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
  for (let i = 0; i < keys.length; i += CHUNK) {
    const chunk = keys.slice(i, i + CHUNK);
    const jql = `key in (${chunk.join(',')})`;
    const url = `${JIRA_BASE}/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=status&maxResults=${CHUNK}`;
    const res = await fetch(url, {
      headers: { Authorization: authHeader, Accept: 'application/json' },
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Jira API error ${res.status}: ${body.slice(0, 300)}`);
      continue;
    }
    const data = await res.json();
    for (const issue of data.issues || []) {
      result[issue.key] = issue.fields?.status?.name || null;
    }
  }
  return result;
}

async function main() {
  console.log(`[${new Date().toISOString()}] Jira sync 시작`);

  const tasksSnap = await db.collection('tasks').get();

  // 이슈키 → 해당 키를 참조하는 syncspace 태스크 목록
  const keyToTasks = new Map();
  for (const doc of tasksSnap.docs) {
    const t = doc.data();
    const urls = (t.jiraUrls && t.jiraUrls.length > 0)
      ? t.jiraUrls
      : (t.jiraUrl ? [t.jiraUrl] : []);
    for (const url of urls) {
      const key = issueKeyFromUrl(url);
      if (!key) continue;
      if (!keyToTasks.has(key)) keyToTasks.set(key, []);
      keyToTasks.get(key).push({ id: doc.id, task: t });
    }
  }

  const allKeys = [...keyToTasks.keys()];
  console.log(`전체 task ${tasksSnap.size}건, Jira 이슈 ${allKeys.length}건 조회 대상`);

  if (allKeys.length === 0) {
    console.log('동기화할 항목 없음. 종료.');
    return;
  }

  const statuses = await fetchJiraStatuses(allKeys);
  console.log(`Jira에서 ${Object.keys(statuses).length}건 응답 수신`);

  let updated = 0;
  let alreadyInSync = 0;
  let unmappedSkipped = 0;
  let notFoundOrNoPermission = 0;
  const unknownStatuses = new Set();

  for (const [key, taskRefs] of keyToTasks) {
    const jiraStatus = statuses[key];
    if (!jiraStatus) {
      notFoundOrNoPermission++;
      console.log(`  [skip] ${key}: Jira에서 조회 불가 (삭제됐거나 권한 없음)`);
      continue;
    }

    const targetStatus = JIRA_TO_SYNCSPACE[jiraStatus];
    if (!targetStatus) {
      unknownStatuses.add(jiraStatus);
      unmappedSkipped++;
      continue;
    }

    for (const { id, task } of taskRefs) {
      if (task.status === targetStatus) {
        alreadyInSync++;
        continue;
      }

      const before = task.status || '';
      console.log(`  [update] ${id} "${task.title}": ${before} → ${targetStatus} (Jira ${key}: ${jiraStatus})`);

      try {
        await db.collection('tasks').doc(id).update({ status: targetStatus });
        await db.collection('activity_log').add({
          when: admin.firestore.FieldValue.serverTimestamp(),
          who_id: 'jira-sync',
          who_name: 'Jira 동기화',
          taskId: id,
          taskTitle: task.title || '',
          taskType: task.type || 'feature',
          action: 'status_changed',
          before,
          after: targetStatus,
          source: 'jira',
          jira_key: key,
          jira_status: jiraStatus,
        });
        updated++;
      } catch (e) {
        console.error(`  [error] ${id} 업데이트 실패:`, e.message);
      }
    }
  }

  console.log('');
  console.log('=== 결과 요약 ===');
  console.log(`업데이트:       ${updated}건`);
  console.log(`이미 동기화됨:  ${alreadyInSync}건`);
  console.log(`매핑 없는 status: ${unmappedSkipped}건`);
  console.log(`Jira 미발견:    ${notFoundOrNoPermission}건`);
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
