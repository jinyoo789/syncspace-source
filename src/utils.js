// src/utils.js — 공통 유틸리티
// 모든 컴포넌트에서 중복되던 날짜/태스크 헬퍼를 한 곳에 모음
import { SEED_TEAM } from './constants';

const DOW = ['일', '월', '화', '수', '목', '금', '토'];

// ─── 런타임 팀 데이터 (Firestore에서 로드된 팀) ───
let _liveTeam = [];

/** App.jsx에서 Firestore team이 변경될 때 호출 */
export function setLiveTeam(team) {
  _liveTeam = team || [];
}

/** SEED_TEAM + Firestore team 합쳐서 조회 (옛 ID도 찾을 수 있도록) */
function getAllTeam() {
  if (_liveTeam.length === 0) return SEED_TEAM;
  // Firestore team + SEED_TEAM 병합 (같은 이름이면 Firestore 우선, 옛 ID도 유지)
  const merged = [..._liveTeam];
  SEED_TEAM.forEach(seed => {
    // Firestore에 같은 이름이 있으면 → 옛 ID로도 찾을 수 있게 추가
    const exists = _liveTeam.find(m => m.name === seed.name);
    if (!exists) {
      merged.push(seed); // Firestore에 없는 SEED 멤버도 포함
    } else if (exists.id !== seed.id) {
      // 같은 이름이지만 ID가 다름 → 옛 ID용 엔트리도 추가
      merged.push({ ...seed, _legacy: true });
    }
  });
  return merged;
}

/** 오늘 날짜 ISO 문자열 (YYYY-MM-DD) */
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "YYYY-MM-DD" → "M/D (요일)" */
export function formatDate(ds) {
  if (!ds) return '-';
  const d = new Date(ds + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()} (${DOW[d.getDay()]})`;
}

/** "YYYY-MM-DD" → "M.D (요일)" */
export function formatDateDot(ds) {
  if (!ds) return '';
  const d = new Date(ds + 'T00:00:00');
  return `${d.getMonth() + 1}.${d.getDate()} (${DOW[d.getDay()]})`;
}

/** "YYYY-MM-DD" → "YYYY-MM-DD (요일)" */
export function formatDateFull(ds) {
  if (!ds) return '-';
  const d = new Date(ds + 'T00:00:00');
  return `${ds} (${DOW[d.getDay()]})`;
}

/** 날짜가 start~end 범위 안에 있는지 (문자열 비교) */
export function isDateInRange(target, start, end) {
  if (!target || !start || !end) return false;
  return target >= start && target <= end;
}

export function getMemberName(idOrName) {
  if (!idOrName) return '';
  const team = getAllTeam();
  const member = team.find(m => m.id === idOrName || m.name === idOrName);
  return member ? member.name : String(idOrName);
}

/** 태스크에서 모든 담당자 이름 추출 (subtask + QA) */
export function getTaskAssignees(task) {
  const names = new Set();

  if (task.subtasks) {
    task.subtasks.forEach(s => { if (s.dev_id) names.add(getMemberName(s.dev_id)); });
  }
  if (task.qa_dev_id) names.add(getMemberName(task.qa_dev_id));
  return [...names];
}

/** 태스크의 전체 시작~종료 날짜 범위 (subtask + QA 포함) */
export function getTaskDateRange(task) {
  const dates = [];
  if (task.subtasks) {
    task.subtasks.forEach(s => {
      if (s.start) dates.push(s.start);
      if (s.end) dates.push(s.end);
    });
  }
  if (task.hasQa) {
    if (task.qa_start) dates.push(task.qa_start);
    if (task.qa_end) dates.push(task.qa_end);
  }
  if (dates.length === 0) return { start: '', end: '' };
  dates.sort();
  return { start: dates[0], end: dates[dates.length - 1] };
}

/** 특정 날짜가 태스크의 작업 범위에 포함되는지 (subtask + QA) */
export function isTaskOnDate(task, dateISO) {
  const inSub = (task.subtasks || []).some(s =>
    s.start && s.end && dateISO >= s.start && dateISO <= s.end
  );
  if (inSub) return true;
  if (task.hasQa && task.qa_start && task.qa_end) {
    if (dateISO >= task.qa_start && dateISO <= task.qa_end) return true;
  }
  return false;
}

/** 특정 사람이 태스크에 관련되어 있는지 (dev_id를 이름으로 변환 후 비교) */
export function isPersonInTask(task, personName) {
  if (!personName) return false;

  const inSub = (task.subtasks || []).some(s =>
    s.dev_id && getMemberName(s.dev_id) === personName
  );
  if (inSub) return true;
  if (task.qa_dev_id && getMemberName(task.qa_dev_id) === personName) return true;
  return false;
}

/** 특정 사람의 서브태스크/QA 종료일 중 가장 빠른 것 반환 */
export function getPersonTaskEndDate(task, personName) {
  if (!personName) return null;
  const ends = [];
  (task.subtasks || []).forEach(s => {
    if (s.dev_id && getMemberName(s.dev_id) === personName && s.end) ends.push(s.end);
  });
  if (task.qa_dev_id && getMemberName(task.qa_dev_id) === personName && task.hasQa && task.qa_end) {
    ends.push(task.qa_end);
  }
  if (ends.length === 0) return null;
  ends.sort();
  return ends[ends.length - 1]; // 가장 늦은 종료일
}

/** 태스크의 시각적 카테고리 (캘린더/뱃지 색상용) */
export function getTaskCategory(task) {
  if (task.type === 'crm') return 'crm';
  if (task.type === 'todo') return 'todo';
  return 'dev';
}

/** 유니크 ID 생성 */
export function uid() {
  return Math.random().toString(36).substr(2, 9);
}
