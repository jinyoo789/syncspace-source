// src/components/TodayView.jsx
import React from 'react';
import { todayISO, isDateInRange, getTaskAssignees } from '../utils';

// ─── 아이콘 ───
const I = ({ d, size = 24, className = '', sw = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);
const RocketIcon = p => <I {...p} d={<><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></>} />;
const BeakerIcon = p => <I {...p} d={<><path d="M4.5 3h15" /><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3" /><path d="M6 14h12" /></>} />;
const MessageIcon = p => <I {...p} d={<><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" /></>} />;
const SunIcon = p => <I {...p} d={<><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></>} />;
const ShieldIcon = p => <I {...p} d={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>} />;
const CodeIcon = p => <I {...p} d={<><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>} />;
const CheckIcon = p => <I {...p} d={<><polyline points="20 6 9 17 4 12" /></>} />;

export default function TodayView({ tasks = [], projects = [], loggedInUser, onOpenModal, setCurrentView }) {
  const today = todayISO();
  const NOW = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];

  // 재배정 필요: 내가 PM인 프로젝트에서 반려된 task들
  // project.pm 필드에는 팀원 이름이 저장되므로 loggedInUser.name과 비교
  const myProjectNames = projects
    .filter(p => p.pm && loggedInUser?.name && p.pm === loggedInUser.name)
    .map(p => p.name);
  const rejectedForMe = tasks.filter(t =>
    t.status === '반려' && myProjectNames.includes(t.project)
  );

  // 1. PRD 배포 (프로젝트 deploys + 태스크 deploys)
  const todayPRD = [];
  projects.forEach(p => {
    (p.deploys || []).forEach(d => {
      if (d.env === 'PRD' && d.date === today) {
        todayPRD.push({ ...d, label: p.name, level: 'project' });
      }
    });
  });
  tasks.forEach(t => {
    (t.deploys || []).forEach(d => {
      if (d.env === 'PRD' && d.date === today) {
        todayPRD.push({ ...d, label: t.title, level: 'task', task: t });
      }
    });
  });

  // 2. STG 배포 (프로젝트 deploys + 태스크 deploys)
  const todaySTG = [];
  projects.forEach(p => {
    (p.deploys || []).forEach(d => {
      if (d.env === 'STG' && d.date === today) {
        todaySTG.push({ ...d, label: p.name, level: 'project' });
      }
    });
  });
  tasks.forEach(t => {
    (t.deploys || []).forEach(d => {
      if (d.env === 'STG' && d.date === today) {
        todaySTG.push({ ...d, label: t.title, level: 'task', task: t });
      }
    });
  });

  // 3. QA 진행 중
  const todayQA = tasks.filter(t =>
    t.hasQa && t.qa_start && t.qa_end && isDateInRange(today, t.qa_start, t.qa_end)
  );

  // 4. 개발 진행 중 (feature 타입, subtask 날짜 기준)
  const todayDev = tasks.filter(t =>
    t.type === 'feature' &&
    (t.subtasks || []).some(s => s.start && s.end && isDateInRange(today, s.start, s.end))
  );

  // 5. CRM
  const todayCRM = tasks.filter(t =>
    t.type === 'crm' &&
    (t.subtasks || []).some(s => s.start && s.end && isDateInRange(today, s.start, s.end))
  );

  // 6. 할일
  const todayTodo = tasks.filter(t =>
    t.type === 'todo' &&
    (t.subtasks || []).some(s => s.start && s.end && isDateInRange(today, s.start, s.end))
  );

  // 담당자 뱃지
  const AssigneeBadges = ({ task }) => {
    const names = getTaskAssignees(task);
    if (names.length === 0) return <span className="text-xs text-gray-400">담당자 미정</span>;
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {names.map((name, i) => (
          <span key={i} className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-gray-200 text-[10px] font-bold text-gray-600">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[8px] font-bold">{name.charAt(0)}</span>
            {name}
          </span>
        ))}
      </div>
    );
  };

  // 카드 컴포넌트
  const Section = ({ icon, title, subtitle, count, borderColor, bgColor, textColor, countBg, items, renderItem, emptyText }) => (
    <div className="bg-white rounded-2xl md:rounded-3xl border shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow" style={{ borderColor }}>
      <div className="p-3.5 md:p-5 border-b flex items-center gap-2.5 md:gap-3" style={{ backgroundColor: bgColor, borderColor }}>
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: bgColor }}>
          {icon}
        </div>
        <div>
          <h2 className="text-base md:text-lg font-black" style={{ color: textColor }}>{title}</h2>
          <p className="text-[10px] md:text-xs font-bold" style={{ color: textColor, opacity: 0.7 }}>{subtitle}</p>
        </div>
        <span className="ml-auto px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold" style={{ backgroundColor: countBg, color: textColor }}>{count}</span>
      </div>
      <div className="p-3.5 md:p-5 flex-1 space-y-2.5 md:space-y-3">
        {items.length > 0 ? items.map(renderItem) : (
          <div className="h-full flex items-center justify-center text-gray-400 py-8">
            <p className="font-bold text-sm">{emptyText}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC] p-4 md:p-8 h-screen animate-fade-in custom-scrollbar">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl md:rounded-3xl p-5 md:p-8 text-white shadow-xl mb-5 md:mb-8 relative overflow-hidden shrink-0 ml-10 md:ml-0">
        <SunIcon size={160} className="absolute -right-10 -top-10 text-slate-500 opacity-20 hidden md:block" />
        <div className="relative z-10">
          <p className="text-slate-300 font-bold mb-1 md:mb-2 tracking-wide text-xs md:text-base">
            {NOW.getFullYear()}년 {NOW.getMonth() + 1}월 {NOW.getDate()}일 ({days[NOW.getDay()]}요일)
          </p>
          <h1 className="text-xl md:text-3xl font-black mb-1 md:mb-2 leading-tight">오늘의 주요 서비스 하이라이트</h1>
          <p className="text-slate-200 font-medium text-sm md:text-base">{loggedInUser?.name || '사용자'}님, 오늘도 화이팅입니다.</p>
        </div>
      </div>

      {/* 재배정 필요 배너 (내가 PM인 프로젝트에서 반려된 작업이 있을 때만) */}
      {rejectedForMe.length > 0 && (
        <button
          onClick={() => setCurrentView && setCurrentView('projects')}
          className="w-full mb-5 md:mb-6 bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 border-2 border-rose-200 rounded-2xl md:rounded-3xl p-4 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm hover:shadow transition-all text-left group"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm md:text-base font-black text-rose-900">재배정 필요 {rejectedForMe.length}건</h3>
            <p className="text-xs md:text-sm text-rose-700 font-medium mt-0.5">
              팀원이 반려한 작업이 있어요. 프로젝트 화면에서 다른 담당자에게 배정해주세요.
            </p>
          </div>
          <div className="text-rose-500 group-hover:translate-x-1 transition-transform shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </button>
      )}

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">

        {/* PRD 배포 */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-red-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="bg-red-50 p-3.5 md:p-5 border-b border-red-100 flex items-center gap-2.5 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><RocketIcon size={18} /></div>
            <div><h2 className="text-base md:text-lg font-black text-red-700">PRD 배포</h2><p className="text-[10px] md:text-xs font-bold text-red-400">실서비스 적용</p></div>
            <span className="ml-auto bg-red-100 text-red-700 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold">{todayPRD.length}</span>
          </div>
          <div className="p-3.5 md:p-5 flex-1 space-y-2.5 md:space-y-3">
            {todayPRD.length > 0 ? todayPRD.map((d, i) => (
              <div key={i}
                onClick={() => d.task && onOpenModal && onOpenModal(d.task, 'view')}
                className={`p-3 rounded-2xl border-l-4 border-red-500 bg-red-50/30 ${d.task ? 'cursor-pointer hover:shadow-sm' : ''}`}>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">{d.label}</h3>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${d.level === 'project' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                    {d.level === 'project' ? '프로젝트' : '태스크'}
                  </span>
                </div>
                {d.note && <p className="text-xs text-gray-500 mt-1">{d.note}</p>}
              </div>
            )) : <div className="flex items-center justify-center text-gray-400 py-8"><p className="font-bold text-sm">오늘 PRD 배포 없음</p></div>}
          </div>
        </div>

        {/* STG 배포 */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-amber-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="bg-amber-50 p-3.5 md:p-5 border-b border-amber-100 flex items-center gap-2.5 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center"><BeakerIcon size={18} /></div>
            <div><h2 className="text-base md:text-lg font-black text-amber-700">STG 배포</h2><p className="text-[10px] md:text-xs font-bold text-amber-500">테스트 서버</p></div>
            <span className="ml-auto bg-amber-100 text-amber-700 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold">{todaySTG.length}</span>
          </div>
          <div className="p-3.5 md:p-5 flex-1 space-y-2.5 md:space-y-3">
            {todaySTG.length > 0 ? todaySTG.map((d, i) => (
              <div key={i}
                onClick={() => d.task && onOpenModal && onOpenModal(d.task, 'view')}
                className={`p-3 rounded-2xl border-l-4 border-amber-500 bg-amber-50/30 ${d.task ? 'cursor-pointer hover:shadow-sm' : ''}`}>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">{d.label}</h3>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${d.level === 'project' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                    {d.level === 'project' ? '프로젝트' : '태스크'}
                  </span>
                </div>
                {d.note && <p className="text-xs text-gray-500 mt-1">{d.note}</p>}
              </div>
            )) : <div className="flex items-center justify-center text-gray-400 py-8"><p className="font-bold text-sm">오늘 STG 배포 없음</p></div>}
          </div>
        </div>

        {/* QA */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-emerald-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="bg-emerald-50 p-3.5 md:p-5 border-b border-emerald-100 flex items-center gap-2.5 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><ShieldIcon size={18} /></div>
            <div><h2 className="text-base md:text-lg font-black text-emerald-700">QA 진행 중</h2><p className="text-[10px] md:text-xs font-bold text-emerald-500">품질 검수</p></div>
            <span className="ml-auto bg-emerald-100 text-emerald-700 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold">{todayQA.length}</span>
          </div>
          <div className="p-3.5 md:p-5 flex-1 space-y-2.5 md:space-y-3">
            {todayQA.length > 0 ? todayQA.map(t => (
              <div key={t.id} onClick={() => onOpenModal && onOpenModal(t, 'view')}
                className="p-3 rounded-2xl border-l-4 border-emerald-500 bg-emerald-50/30 cursor-pointer hover:shadow-sm transition-shadow">
                <h3 className="text-sm font-bold text-gray-900 leading-snug">{t.title}</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">{t.project}</p>
                <AssigneeBadges task={t} />
              </div>
            )) : <div className="flex items-center justify-center text-gray-400 py-8"><p className="font-bold text-sm">오늘 QA 없음</p></div>}
          </div>
        </div>

        {/* 개발 진행 */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-blue-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="bg-blue-50 p-3.5 md:p-5 border-b border-blue-100 flex items-center gap-2.5 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><CodeIcon size={18} /></div>
            <div><h2 className="text-base md:text-lg font-black text-blue-700">개발 진행</h2><p className="text-[10px] md:text-xs font-bold text-blue-400">기능 개발 중</p></div>
            <span className="ml-auto bg-blue-100 text-blue-700 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold">{todayDev.length}</span>
          </div>
          <div className="p-3.5 md:p-5 flex-1 space-y-2.5 md:space-y-3">
            {todayDev.length > 0 ? todayDev.map(t => (
              <div key={t.id} onClick={() => onOpenModal && onOpenModal(t, 'view')}
                className="p-3 rounded-2xl border-l-4 border-blue-500 bg-blue-50/30 cursor-pointer hover:shadow-sm transition-shadow">
                <h3 className="text-sm font-bold text-gray-900 leading-snug">{t.title}</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">{t.project}</p>
                <AssigneeBadges task={t} />
              </div>
            )) : <div className="flex items-center justify-center text-gray-400 py-8"><p className="font-bold text-sm">오늘 개발 진행 없음</p></div>}
          </div>
        </div>

        {/* CRM */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-indigo-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="bg-indigo-50 p-3.5 md:p-5 border-b border-indigo-100 flex items-center gap-2.5 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center"><MessageIcon size={18} /></div>
            <div><h2 className="text-base md:text-lg font-black text-indigo-700">CRM & 발송</h2><p className="text-[10px] md:text-xs font-bold text-indigo-400">알림톡, 푸시 등</p></div>
            <span className="ml-auto bg-indigo-100 text-indigo-700 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold">{todayCRM.length}</span>
          </div>
          <div className="p-3.5 md:p-5 flex-1 space-y-2.5 md:space-y-3">
            {todayCRM.length > 0 ? todayCRM.map(t => (
              <div key={t.id} onClick={() => onOpenModal && onOpenModal(t, 'view')}
                className="p-3 rounded-2xl border-l-4 border-indigo-500 bg-indigo-50/30 cursor-pointer hover:shadow-sm transition-shadow">
                <h3 className="text-sm font-bold text-gray-900 leading-tight">{t.title}</h3>
                <div className="flex flex-wrap items-center gap-1 mt-2 text-[10px] font-bold text-gray-500">
                  <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200">{t.channel || '기타'}</span>
                  {t.expected_count > 0 && <span className="text-indigo-500 bg-indigo-100 px-1.5 py-0.5 rounded">{t.expected_count?.toLocaleString()}건</span>}
                </div>
              </div>
            )) : <div className="flex items-center justify-center text-gray-400 py-8"><p className="font-bold text-sm">오늘 CRM 없음</p></div>}
          </div>
        </div>

        {/* 할일 */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-amber-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="bg-amber-50/70 p-3.5 md:p-5 border-b border-amber-100 flex items-center gap-2.5 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center"><CheckIcon size={18} /></div>
            <div><h2 className="text-base md:text-lg font-black text-amber-700">할일</h2><p className="text-[10px] md:text-xs font-bold text-amber-500">단순 업무</p></div>
            <span className="ml-auto bg-amber-100 text-amber-700 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold">{todayTodo.length}</span>
          </div>
          <div className="p-3.5 md:p-5 flex-1 space-y-2.5 md:space-y-3">
            {todayTodo.length > 0 ? todayTodo.map(t => (
              <div key={t.id} onClick={() => onOpenModal && onOpenModal(t, 'view')}
                className="p-3 rounded-2xl border-l-4 border-amber-500 bg-amber-50/30 cursor-pointer hover:shadow-sm transition-shadow">
                <h3 className="text-sm font-bold text-gray-900 leading-snug">{t.title}</h3>
                <AssigneeBadges task={t} />
              </div>
            )) : <div className="flex items-center justify-center text-gray-400 py-8"><p className="font-bold text-sm">오늘 할일 없음</p></div>}
          </div>
        </div>

      </div>
    </div>
  );
}
