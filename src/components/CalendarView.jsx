// src/components/CalendarView.jsx
import React, { useState } from 'react';
import { isTaskOnDate, getTaskCategory, getTaskAssignees } from '../utils';
import AddButton from './AddButton';

const I = ({ d, size = 18, className = '', sw = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);
const ChevronLeft = p => <I {...p} d="M15 18l-6-6 6-6" />;
const ChevronRight = p => <I {...p} d="M9 18l6-6-6-6" />;
const PlusIcon = p => <I {...p} d={<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>} />;

// 이벤트 유형별 스타일
const EVENT_STYLES = {
  dev:  { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', label: '개발' },
  crm:  { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500', label: 'CRM' },
  todo: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', label: '할일' },
  stg:  { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300', dot: 'bg-yellow-500', label: 'STG' },
  prd:  { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-500', label: 'PRD' },
};

export default function CalendarView({ tasks = [], projects = [], CATEGORIES = [], onOpenModal }) {
  const TODAY = new Date();
  const [viewType, setViewType] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [typeFilters, setTypeFilters] = useState(['crm', 'stg', 'prd']);
  const [pmFilter, setPmFilter] = useState('전체');

  const pms = ['전체', ...new Set(projects.map(p => p.pm).filter(Boolean))];

  // PM 필터에 해당하는 프로젝트명 집합
  const pmProjectNames = pmFilter === '전체' ? null : new Set(projects.filter(p => p.pm === pmFilter).map(p => p.name));

  // 모든 이벤트를 하나의 리스트로 통합
  // 1) 태스크 이벤트 (subtask 날짜 범위 기준)
  // 2) 프로젝트 배포 이벤트
  const getEventsForDate = (dateObj) => {
    if (!dateObj) return [];
    const dateISO = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    const events = [];

    // 태스크
    tasks.forEach(t => {
      if (pmProjectNames && !pmProjectNames.has(t.project)) return;
      const cat = getTaskCategory(t);
      if (!typeFilters.includes(cat)) return;
      if (isTaskOnDate(t, dateISO)) {
        events.push({ type: 'task', cat, task: t, title: t.title, id: t.id });
      }
    });

    // 프로젝트 배포
    projects.forEach(p => {
      (p.deploys || []).forEach(d => {
        if (d.date !== dateISO) return;
        const cat = d.env === 'PRD' ? 'prd' : 'stg';
        if (!typeFilters.includes(cat)) return;
        events.push({
          type: 'deploy', cat, title: `[${d.env}] ${p.name}`,
          id: `deploy-${d.id}`, deploy: d, project: p,
        });
      });
    });

    return events;
  };

  const moveDate = (step) => {
    const next = new Date(currentDate);
    if (viewType === 'month') next.setMonth(currentDate.getMonth() + step);
    else if (viewType === 'week') next.setDate(currentDate.getDate() + (step * 7));
    else next.setDate(currentDate.getDate() + step);
    setCurrentDate(next);
  };
  const goToday = () => setCurrentDate(new Date());

  const handleEventClick = (e, ev) => {
    e.stopPropagation();
    if (ev.type === 'task') {
      onOpenModal(ev.task, 'view');
    } else if (ev.type === 'deploy' && ev.project) {
      onOpenModal(ev.project, 'view', 'project');
    }
  };

  // 이벤트 뱃지 렌더링
  const EventBadge = ({ ev, compact = false }) => {
    const style = EVENT_STYLES[ev.cat] || EVENT_STYLES.dev;
    return (
      <div
        onClick={(e) => handleEventClick(e, ev)}
        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border truncate cursor-pointer hover:shadow-sm ${style.bg} ${style.text} ${style.border}`}
        title={ev.title}
      >
        {compact ? '' : <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${style.dot}`} />}
        {ev.title}
      </div>
    );
  };

  // ─── 월간 뷰 (셀 내 인라인 렌더링) ───
  const renderMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1))];
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="grid grid-cols-7 bg-gray-50 border-b text-center py-3 text-xs font-bold text-gray-500 uppercase">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div key={i} className={i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : ''}>{d}</div>
          ))}
        </div>
        <div className="flex-1 grid" style={{ gridTemplateRows: `repeat(${cells.length / 7}, 1fr)` }}>
          {Array.from({ length: cells.length / 7 }, (_, wi) => {
            const weekCells = cells.slice(wi * 7, wi * 7 + 7);
            return (
              <div key={wi} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0 min-h-[80px]">
                {weekCells.map((date, di) => {
                  const isToday = date?.toDateString() === TODAY.toDateString();
                  const evts = date ? getEventsForDate(date) : [];
                  return (
                    <div key={di} className={`flex flex-col border-r border-gray-100 last:border-r-0 ${!date ? 'bg-gray-50/50' : ''}`}>
                      {date && (
                        <div className="p-1.5 pb-0.5">
                          <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700'}`}>
                            {date.getDate()}
                          </div>
                        </div>
                      )}
                      <div className="px-1 pb-1 space-y-0.5 overflow-hidden flex-1">
                        {evts.map((ev, idx) => {
                          const style = EVENT_STYLES[ev.cat] || EVENT_STYLES.dev;
                          return (
                            <div
                              key={idx}
                              onClick={(e) => handleEventClick(e, ev)}
                              className={`text-[9px] font-bold px-1 py-0.5 rounded border truncate cursor-pointer hover:shadow-sm ${style.bg} ${style.text} ${style.border}`}
                              title={ev.title}
                            >
                              {ev.title}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── 주간 뷰 ───
  const renderWeek = () => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    const DOW = ['일', '월', '화', '수', '목', '금', '토'];

    return (
      <div className="flex gap-3 md:gap-4 h-full overflow-x-auto pb-2 custom-scrollbar flex-1">
        {[...Array(7)].map((_, i) => {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const evts = getEventsForDate(d);
          const isToday = d.toDateString() === TODAY.toDateString();
          return (
            <div key={i} className={`flex-1 min-w-[130px] md:min-w-[150px] flex flex-col bg-white rounded-xl md:rounded-2xl border ${isToday ? 'border-blue-400 ring-2 ring-blue-100 shadow-md' : 'border-gray-200 shadow-sm'}`}>
              <div className={`p-2 md:p-4 text-center border-b rounded-t-xl md:rounded-t-2xl ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <p className={`text-[10px] md:text-xs font-bold mb-0.5 md:mb-1 ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>{DOW[d.getDay()]}요일</p>
                <p className={`text-lg md:text-2xl font-black ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>{d.getDate()}</p>
              </div>
              <div className="p-2 md:p-3 space-y-1.5 md:space-y-2 overflow-y-auto custom-scrollbar flex-1">
                {evts.map((ev, idx) => {
                  const style = EVENT_STYLES[ev.cat] || EVENT_STYLES.dev;
                  return (
                    <div
                      key={idx}
                      onClick={(e) => handleEventClick(e, ev)}
                      className={`p-2.5 rounded-xl border border-l-4 bg-white cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all ${style.border}`}
                    >
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>{style.label}</span>
                      <p className="text-xs font-bold text-gray-800 mt-1 leading-snug break-keep">{ev.title}</p>
                      {ev.type === 'task' && (
                        <div className="flex flex-wrap gap-0.5 mt-1.5">
                          {getTaskAssignees(ev.task).map((name, i) => (
                            <span key={i} className="text-[9px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200">{name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ─── 일간 뷰 ───
  const renderDay = () => {
    const evts = getEventsForDate(currentDate);
    const DOW = ['일', '월', '화', '수', '목', '금', '토'];

    return (
      <div className="flex-1 bg-white rounded-3xl border border-gray-200 flex flex-col overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b bg-gray-50/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-5">
            <span className="text-6xl font-black text-blue-600 tracking-tighter">{currentDate.getDate()}</span>
            <div>
              <p className="text-base font-bold text-gray-500 mb-1">{DOW[currentDate.getDay()]}요일</p>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</p>
            </div>
          </div>
          <div className="px-5 py-2.5 bg-blue-100 text-blue-700 rounded-xl font-bold">일정 {evts.length}건</div>
        </div>
        <div className="p-8 space-y-4 overflow-y-auto flex-1 custom-scrollbar bg-gray-50/30">
          {evts.length > 0 ? evts.map((ev, idx) => {
            const style = EVENT_STYLES[ev.cat] || EVENT_STYLES.dev;
            return (
              <div
                key={idx}
                onClick={(e) => handleEventClick(e, ev)}
                className={`p-6 rounded-2xl border-l-8 bg-white shadow-sm flex flex-col gap-2 hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 ${style.border}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${style.bg} ${style.text}`}>{style.label}</span>
                  {ev.type === 'task' && <span className="text-xs font-bold text-gray-400">{ev.task?.project}</span>}
                  {ev.type === 'deploy' && <span className="text-xs font-bold text-gray-400">{ev.deploy?.status === 'deployed' ? '완료' : '예정'}</span>}
                </div>
                <h4 className="text-lg font-bold text-gray-900">{ev.title}</h4>
                {ev.type === 'task' && (
                  <div className="flex flex-wrap gap-1">
                    {getTaskAssignees(ev.task).map((name, i) => (
                      <span key={i} className="text-[10px] font-bold px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-gray-600">{name}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="flex items-center justify-center text-gray-400 py-16">
              <p className="font-bold text-sm">이 날 일정이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const toggleFilter = (f) => {
    setTypeFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 h-screen overflow-auto animate-fade-in bg-[#F8FAFC] custom-scrollbar">
      <div className="flex justify-between items-center mb-4 md:mb-6 shrink-0 ml-10 md:ml-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">전체 캘린더</h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1 md:mt-1.5 font-medium">프로젝트와 업무 일정을 관리하세요.</p>
        </div>
        <AddButton onSelect={(type) => onOpenModal(null, 'create', type)} />
      </div>

      {/* PM 필터 */}
      <div className="flex items-center gap-2 mb-3 md:mb-4 shrink-0 flex-wrap overflow-x-auto">
        {pms.map(pm => (
          <button key={pm} onClick={() => setPmFilter(pm)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
              pmFilter === pm ? 'bg-gray-800 text-white border-gray-800 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}>
            {pm}
          </button>
        ))}
      </div>

      {/* 컨트롤 바 */}
      <div className="flex flex-col gap-2 md:gap-4 mb-4 md:mb-6 shrink-0 bg-white p-2 md:p-2.5 rounded-xl md:rounded-2xl border border-gray-200 shadow-sm">
        {/* 상단: 네비게이션 + 오늘 + 뷰 선택 */}
        <div className="flex items-center gap-1.5 md:gap-4">
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl p-0.5 md:p-1 shrink-0">
            <button onClick={() => moveDate(-1)} className="p-1 md:p-2 hover:bg-white hover:shadow-sm rounded-md md:rounded-lg transition-all"><ChevronLeft size={14} className="md:w-[18px] md:h-[18px]" /></button>
            <span className="px-1.5 md:px-4 text-[11px] md:text-sm font-bold text-gray-800 min-w-[80px] md:w-36 text-center whitespace-nowrap">
              {viewType === 'month' ? `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월` :
                viewType === 'week' ? `${currentDate.getMonth() + 1}월 ${Math.ceil(currentDate.getDate() / 7)}주차` :
                  `${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일`}
            </span>
            <button onClick={() => moveDate(1)} className="p-1 md:p-2 hover:bg-white hover:shadow-sm rounded-md md:rounded-lg transition-all"><ChevronRight size={14} className="md:w-[18px] md:h-[18px]" /></button>
          </div>
          <button onClick={goToday} className="px-2 md:px-4 py-1 md:py-2 text-[11px] md:text-sm font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl hover:bg-white hover:shadow-sm transition-all shrink-0">오늘</button>
          <div className="flex bg-gray-100 p-0.5 md:p-1 rounded-lg md:rounded-xl shrink-0 ml-auto">
            {[['month', '월'], ['week', '주'], ['day', '일']].map(([v, l]) => (
              <button key={v} onClick={() => setViewType(v)}
                className={`px-2.5 md:px-4 py-1 md:py-1.5 text-[11px] md:text-xs font-bold rounded-md md:rounded-lg transition-all ${viewType === v ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <span className="hidden md:inline">{l === '월' ? '월간' : l === '주' ? '주간' : '일간'}</span>
                <span className="md:hidden">{l}</span>
              </button>
            ))}
          </div>
        </div>
        {/* 하단: 유형별 필터 */}
        <div className="flex gap-1.5 md:gap-2 overflow-x-auto custom-scrollbar">
          {Object.entries(EVENT_STYLES).map(([key, style]) => {
            const active = typeFilters.includes(key);
            return (
              <button key={key} onClick={() => toggleFilter(key)}
                className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-[11px] font-bold border transition-all shrink-0 ${
                  active ? 'bg-white border-gray-300 shadow-sm text-gray-800' : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-50'
                }`}>
                <div className={`w-2 h-2 rounded-full ${style.dot} ${!active && 'opacity-40'}`} />
                {style.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {viewType === 'month' && renderMonth()}
        {viewType === 'week' && renderWeek()}
        {viewType === 'day' && renderDay()}
      </div>
    </div>
  );
}
