// scripts/cleanup-activity-log.js
// activity_log 컬렉션에서 지정된 기간(기본 180일)보다 오래된 항목을 삭제.
// GitHub Actions에서 매일 1회 실행됨.
import admin from 'firebase-admin';

const RETENTION_DAYS = Number(process.env.RETENTION_DAYS) || 180;

const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!saRaw) {
  console.error('Missing FIREBASE_SERVICE_ACCOUNT env var');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(saRaw);
} catch (e) {
  console.error('FIREBASE_SERVICE_ACCOUNT is not valid JSON:', e.message);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
  console.log(`[${new Date().toISOString()}] activity_log cleanup 시작`);
  console.log(`기준: ${RETENTION_DAYS}일 이전 (< ${cutoff.toISOString()})`);

  const snapshot = await db
    .collection('activity_log')
    .where('when', '<', admin.firestore.Timestamp.fromDate(cutoff))
    .get();

  console.log(`삭제 대상: ${snapshot.size}건`);

  if (snapshot.size === 0) {
    console.log('삭제할 항목 없음. 종료.');
    return;
  }

  // Firestore batch는 한 번에 최대 500 operations. 청크로 나눠서 처리.
  let deleted = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    batchCount++;
    if (batchCount >= 500) {
      await batch.commit();
      deleted += batchCount;
      console.log(`  ${deleted}건 삭제 완료...`);
      batch = db.batch();
      batchCount = 0;
    }
  }
  if (batchCount > 0) {
    await batch.commit();
    deleted += batchCount;
  }

  console.log('');
  console.log(`=== 결과 ===`);
  console.log(`삭제 완료: ${deleted}건`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('cleanup 중 치명 오류:', err);
    process.exit(1);
  });
