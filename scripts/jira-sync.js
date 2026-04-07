// scripts/jira-sync.js
// Jira → syncspace 단방향 동기화 (읽기 전용 Jira API + Firestore 쓰기)
// GitHub Actions에서 15분마다 실행됨.
import admin from 'firebase-admin';

const JIRA_BASE = process.env.JIRA_BASE || 'https://jobis.atlassian.net';
const EMAIL = process.env.JIRA_EMAIL;
const TOKEN = process.env.JIRA_API_TOKEN;
const SA_RAW = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!EMAIL || !TOKEN || !SA_RAW) {
  console.error('Missing required env: JIRA_EMAIL, JIRA_API_TOKEN, FIREBASE_SERVICE_ACCOUNT');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(SA_RAW);
} catch (e) {
  console.error('FIREBASE_SERVICE_ACCOUNT is not valid JSON:', e.message);
  process.exit(1);
}

// Jira status name → syncspace status 매핑.
// 매핑되지 않은 status는 syncspace를 건드리지 않음 (안전장치).
// 새 status를 자동화 대상으로 추가하려면 아래 객체를 수정.
const JIRA_TO_SYNCSPACE = {
  // 완료 계열
  'Done': '완료',
  'Closed': '완료',
  'Resolved': '완료',
  '완료': '완료',
  // 진행 계열
  'In Progress': '진행중',
  'In Review': '진행중',
  'In Development': '진행중',
  '진행중': '진행중',
  '개발중': '진행중',
};

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const issueKeyFromUrl = (url) => {
  const m = String(url || '').match(/\/browse\/([A-Z][A-Z0-9_]+-\d+)/);
  return m ? m[1] : null;
};

const authHeader = 'Basic ' + Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64');

async function fetchJiraStatuses(keys) {
  const result = {};
  const CHUNK = 50;
  const url = `${JIRA_BASE}/rest/api/3/search/jql`;

  for (let i = 0; i < keys.length; i += CHUNK) {
    const chunk = keys.slice(i, i + CHUNK);
    const jql = `key in (${chunk.join(',')})`;

    // 새 엔드포인트는 POST + JSON body, 페이지네이션은 nextPageToken 기반.
    // 청크 크기(50)와 maxResults가 같으므로 보통 한 페이지로 끝나지만,
    // 안전하게 nextPageToken이 오면 한 번 더 받아옴.
    let nextPageToken = undefined;
    let safetyCounter = 0;
    do {
      const body = {
        jql,
        fields: ['status'],
        maxResults: CHUNK,
      };
      if (nextPageToken) body.nextPageToken = nextPageToken;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error(`Jira API error ${res.status}: ${errBody.slice(0, 300)}`);
        break;
      }

      const data = await res.json();
      for (const issue of data.issues || []) {
        result[issue.key] = issue.fields?.status?.name || null;
      }

      nextPageToken = data.nextPageToken;
      safetyCounter++;
    } while (nextPageToken && safetyCounter < 10);
  }
  return result;
}

async function main() {
  console.log(`[${new Date().toISOString()}] Jira sync 시작`);

  const tasksSnap = await db.collection('tasks').get();

  // task 단위로 연관 Jira 이슈 키 수집 (한 task의 여러 링크는 한 묶음으로)
  const taskInfo = new Map(); // taskId → { task, keys[] }
  for (const doc of tasksSnap.docs) {
    const t = doc.data();
    const urls = (t.jiraUrls && t.jiraUrls.length > 0)
      ? t.jiraUrls
      : (t.jiraUrl ? [t.jiraUrl] : []);
    const keys = [...new Set(
      urls.map(u => issueKeyFromUrl(u)).filter(Boolean)
    )]; // 같은 task 내 중복 링크 제거
    if (keys.length > 0) {
      taskInfo.set(doc.id, { task: t, keys });
    }
  }

  // 전체에서 유니크한 Jira 키만 한 번에 조회
  const allKeys = [...new Set(
    [...taskInfo.values()].flatMap(v => v.keys)
  )];
  console.log(`전체 task ${tasksSnap.size}건, Jira 링크가 있는 task ${taskInfo.size}건, 유니크 이슈 ${allKeys.length}건 조회`);

  if (allKeys.length === 0) {
    console.log('동기화할 항목 없음. 종료.');
    return;
  }

  const statuses = await fetchJiraStatuses(allKeys);
  console.log(`Jira에서 ${Object.keys(statuses).length}건 응답 수신`);

  let updated = 0;
  let alreadyInSync = 0;
  let skippedNoUsable = 0;
  const unknownStatuses = new Set();

  // task 단위 처리: 한 task의 여러 링크 status를 종합해서 한 번만 update
  for (const [taskId, { task, keys }] of taskInfo) {
    const mappedStatuses = []; // 매핑 성공한 syncspace status들
    const linkSummary = [];    // 로그용

    for (const key of keys) {
      const jiraStatus = statuses[key];
      if (!jiraStatus) {
        linkSummary.push(`${key}=조회불가`);
        continue;
      }
      const mapped = JIRA_TO_SYNCSPACE[jiraStatus];
      if (!mapped) {
        linkSummary.push(`${key}=${jiraStatus}(매핑X)`);
        unknownStatuses.add(jiraStatus);
        continue;
      }
      mappedStatuses.push(mapped);
      linkSummary.push(`${key}=${jiraStatus}→${mapped}`);
    }

    // 매핑된 status가 하나도 없으면 스킵 (안 건드림)
    if (mappedStatuses.length === 0) {
      skippedNoUsable++;
      continue;
    }

    // 정책:
    //   - 매핑된 status가 모두 '완료' → 최종 '완료'
    //   - 하나라도 '진행중'이면 (나머지가 완료든 매핑X든) → '진행중'
    const allDone = mappedStatuses.every(s => s === '완료');
    const targetStatus = allDone ? '완료' : '진행중';

    if (task.status === targetStatus) {
      alreadyInSync++;
      continue;
    }

    const before = task.status || '';
    const summaryStr = linkSummary.join(', ');
    console.log(`  [update] ${taskId} "${task.title}": ${before} → ${targetStatus} [${summaryStr}]`);

    try {
      await db.collection('tasks').doc(taskId).update({ status: targetStatus });
      await db.collection('activity_log').add({
        when: admin.firestore.FieldValue.serverTimestamp(),
        who_id: 'jira-sync',
        who_name: 'Jira 동기화',
        taskId,
        taskTitle: task.title || '',
        taskType: task.type || 'feature',
        action: 'status_changed',
        before,
        after: targetStatus,
        source: 'jira',
        jira_keys: keys,
        jira_link_summary: summaryStr,
      });
      updated++;
    } catch (e) {
      console.error(`  [error] ${taskId} 업데이트 실패:`, e.message);
    }
  }

  console.log('');
  console.log('=== 결과 요약 ===');
  console.log(`업데이트:           ${updated}건`);
  console.log(`이미 동기화됨:      ${alreadyInSync}건`);
  console.log(`판정 불가 (스킵):   ${skippedNoUsable}건  (매핑 가능한 link가 하나도 없음)`);
  if (unknownStatuses.size > 0) {
    console.log('');
    console.log(`매핑되지 않은 Jira status (필요 시 scripts/jira-sync.js의 JIRA_TO_SYNCSPACE에 추가):`);
    for (const s of unknownStatuses) console.log(`  - "${s}"`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('동기화 중 치명 오류:', err);
    process.exit(1);
  });
