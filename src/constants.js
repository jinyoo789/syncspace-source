// src/constants.js — App.jsx에서 분리 (Vite Fast Refresh 호환성)

// ─── 카테고리 (시각 구분용) ───
export const CATEGORIES = [
  { id: 'dev', label: '개발', dotClass: 'bg-blue-500', bgClass: 'bg-blue-50', textClass: 'text-blue-700', borderClass: 'border-blue-200' },
  { id: 'design', label: '디자인', dotClass: 'bg-pink-500', bgClass: 'bg-pink-50', textClass: 'text-pink-700', borderClass: 'border-pink-200' },
  { id: 'planning', label: '기획', dotClass: 'bg-orange-500', bgClass: 'bg-orange-50', textClass: 'text-orange-700', borderClass: 'border-orange-200' },
  { id: 'crm', label: 'CRM/마케팅', dotClass: 'bg-indigo-500', bgClass: 'bg-indigo-50', textClass: 'text-indigo-700', borderClass: 'border-indigo-200' },
  { id: 'qa', label: 'QA', dotClass: 'bg-emerald-500', bgClass: 'bg-emerald-50', textClass: 'text-emerald-700', borderClass: 'border-emerald-200' },
  { id: 'todo', label: '할일', dotClass: 'bg-amber-500', bgClass: 'bg-amber-50', textClass: 'text-amber-700', borderClass: 'border-amber-200' },
];

// ─── 역할 목록 ───
export const ROLES = ['BE', 'FE', 'QA', 'Design', '세무기획'];

// ─── 팀원 시드 데이터 ───
export const SEED_TEAM = [
  { id: 'l04zjn7r', name: '유진', role: 'PM' },
  { id: '1rjwrmci', name: '허정화', role: 'Backend' },
  { id: 'e7pofj2g', name: '박우진', role: 'Backend' },
  { id: '1seylca9', name: '김희중', role: 'Frontend' },
  { id: 'zh5by0iq', name: '이진수', role: 'Frontend' },
  { id: '9hy728zq', name: '조승희', role: 'Frontend' },
  { id: '1vl8hevj', name: '안소영', role: 'QA' },
  { id: '33ua2gc6', name: 'TQA 셈괵', role: 'QA' },
];
