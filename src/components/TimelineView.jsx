// src/components/TimelineView.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { getTaskAssignees, getTaskDateRange, getMemberName } from '../utils';
import AddButton from './AddButton';

const ROLE_COLORS = { BE: '#3b82f6', FE: '#10b981', QA: '#a855f7', Design: '#ec4899' };

export default function TimelineView({ tasks, projects = [], onOpenModal }) {
  const scrollContainerRef = useRef(null);
  const [hideCompleted, setHideCompleted] = useState(true);
  const [showTodo, setShowTodo] = useState(false);
  const [pmFilter, setPmFilter] = useState('전체');

  const pms = useMemo(() => ['전체', ...new Set(projects.map(p => p.pm).filter(Boolean))], [projects]);

  // 프로젝트 우선순위 맵 (P1 > P2 > P3)
  const projPriorityMap = useMemo(() => {
    const map = {};
    projects.forEach(p => { map[p.name] = p.priority || 'P3'; });
    return map;
  }, [projects]);

  // PM 필터에 해당하는 프로젝트명 집합
  const pmProjectNames = useMemo(() => {
    if (pmFilter === '전체') return null;
    return new Set(projects.filter(p => p.pm === pmFilter).map(p => p.name));
  }, [pmFilter, projects]);

  // 완료 필터 + 할일 필터 + PM 필터 + 프로젝트 우선순위순 정렬
  const filteredTasks = useMemo(() => {
    let filtered = hideCompleted ? tasks.filter(t => t.status !== '완료') : tasks;
    if (!showTodo) filtered = filtered.filter(t => t.type !== 'todo');
    if (pmProjectNames) filtered = filtered.filter(t => pmProjectNames.has(t.project));
    return [...filtered].sort((a, b) => {
      // 1순위: 프로젝트 우선순위 (P1 < P2 < P3)
      const aPri = projPriorityMap[a.project] || 'P3';
      const bPri = projPriorityMap[b.project] || 'P3';
      if (aPri !== bPri) return aPri.localeCompare(bPri);
      // 2순위: 프로젝트명
      const projCmp = (a.project || '').localeCompare(b.project || '');
      if (projCmp !== 0) return projCmp;
      // 3순위: 시작일
      const aRange = getTaskDateRange(a);
      const bRange = getTaskDateRange(b);
      return (aRange.start || '').localeCompare(bRange.start || '');
    });
  }, [tasks, hideCompleted, showTodo]);

  // 프로젝트 그룹 계산 (rowSpan용)
  const projectGroups = useMemo(() => {
    const groups = [];
    let currentProj = null;
    let count = 0;
    filteredTasks.forEach((t, i) => {
      if (t.project !== currentProj) {
        if (currentProj !== null) groups.push({ name: currentProj, count, startIdx: i - count });
        currentProj = t.project;
        count = 1;
      } else {
        count++;
      }
    });
    if (currentProj !== null) groups.push({ name: currentProj, count, startIdx: filteredTasks.length - count });
    return groups;
  }, [filteredTasks]);

  // 날짜 범위 계산
  const { minDate, totalDays, datesArr } = useMemo(() => {
    const allDates = [];
    const addDate = (ds) => { if (ds) allDates.push(new Date(ds + 'T00:00:00')); };

    tasks.forEach(t => {
      (t.subtasks || []).forEach(s => { addDate(s.start); addDate(s.end); });
      if (t.hasQa) { addDate(t.qa_start); addDate(t.qa_end); }
      (t.deploys || []).forEach(d => addDate(d.date));
    });
    projects.forEach(p => {
      (p.deploys || []).forEach(d => addDate(d.date));
    });

    if (allDates.length === 0) {
      const today = new Date();
      return { minDate: today, totalDays: 14, datesArr: Array.from({ length: 14 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i - 3); return d; }) };
    }

    let min = new Date(Math.min(...allDates));
    let max = new Date(Math.max(...allDates));
    min.setDate(min.getDate() - 2);
    max.setDate(max.getDate() + 3);

    const days = Math.round((max - min) / (1000 * 60 * 60 * 24));
    const arr = Array.from({ length: days }, (_, i) => {
      const d = new Date(min);
      d.setDate(d.getDate() + i);
      return d;
    });
    return { minDate: min, totalDays: days, datesArr: arr };
  }, [tasks, projects]);

  const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const diffDays = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / (1000 * 60 * 60 * 24));
  const minISO = toISO(minDate);
  const DAY_W = 80;

  useEffect(() => {
    if (scrollContainerRef.current && datesArr.length > 0) {
      const today = new Date();
      const offsetDays = Math.round((today - minDate) / (1000 * 60 * 60 * 24));
      scrollContainerRef.current.scrollLeft = Math.max(0, (offsetDays * DAY_W) - 320);
    }
  }, [datesArr, minDate]);

  const deployMarkers = useMemo(() => {
    const markers = [];
    projects.forEach(p => {
      (p.deploys || []).forEach(d => {
        markers.push({ date: d.date, env: d.env, label: p.name, level: 'project', status: d.status });
      });
    });
    return markers;
  }, [projects]);

  // 프로젝트별 색상
  const PROJECT_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];
  const getProjectColor = (name) => {
    const idx = projects.findIndex(p => p.name === name);
    return PROJECT_COLORS[idx >= 0 ? idx % PROJECT_COLORS.length : 0];
  };

  // 각 태스크가 어떤 프로젝트 그룹의 첫 번째인지 체크
  const isFirstInGroup = (taskIdx) => projectGroups.some(g => g.startIdx === taskIdx);
  const getGroup = (taskIdx) => projectGroups.find(g => g.startIdx <= taskIdx && taskIdx < g.startIdx + g.count);

  return (
    <div className="flex-1 overflow-hidden bg-[#F8FAFC] p-4 md:p-8 h-screen flex flex-col animate-fade-in">
      <div className="mb-4 md:mb-6 shrink-0 flex justify-between items-center flex-wrap gap-3 ml-10 md:ml-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">타임라인</h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1 md:mt-1.5 font-medium">업무의 흐름과 겹치는 일정을 간트차트로 확인하세요.</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setShowTodo(prev => !prev)}
            className={`text-[11px] md:text-xs font-bold px-3 md:px-4 py-1.5 md:py-2 rounded-xl border transition-all ${showTodo ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
          >
            {showTodo ? '할일 표시 ON' : '할일 표시 OFF'}
          </button>
          <button
            onClick={() => setHideCompleted(prev => !prev)}
            className={`text-[11px] md:text-xs font-bold px-3 md:px-4 py-1.5 md:py-2 rounded-xl border transition-all ${hideCompleted ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
          >
            {hideCompleted ? '완료 숨김 ON' : '완료 숨김 OFF'}
          </button>
          <AddButton onSelect={(type) => onOpenModal && onOpenModal(null, 'create', type)} />
        </div>
      </div>

      {/* PM 필터 */}
      <div className="flex items-center gap-2 mb-3 md:mb-4 shrink-0 flex-wrap overflow-x-auto">
        {pms.map(pm => (
          <button key={pm} onClick={() => setPmFilter(pm)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              pmFilter === pm ? 'bg-gray-800 text-white border-gray-800 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}>
            {pm}
          </button>
        ))}
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-4 shrink-0 text-[10px] md:text-xs font-bold text-gray-500 overflow-x-auto">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: ROLE_COLORS.BE }} />BE</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: ROLE_COLORS.FE }} />FE</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: '#f59e0b' }} />QA</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-500" />CRM</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500" />할일</span>
        <span className="flex items-center gap-1.5">◆ 배포</span>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-auto custom-scrollbar flex flex-col scroll-smooth"
      >
        {/* 날짜 헤더 */}
        <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10 w-max min-w-full">
          <div className="w-28 shrink-0 border-r border-gray-200 p-3 font-bold text-gray-500 text-xs flex items-center bg-gray-50 sticky left-0 z-20">
            프로젝트
          </div>
          <div className="w-48 shrink-0 border-r border-gray-200 p-3 font-bold text-gray-500 text-xs flex items-center bg-gray-50 sticky left-28 z-20">
            업무명
          </div>
          {datesArr.map((d, i) => {
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            const isToday = d.toDateString() === new Date().toDateString();
            const dayISO = toISO(d);
            const deploys = deployMarkers.filter(m => m.date === dayISO);

            return (
              <div key={i} className={`shrink-0 border-r border-gray-100 p-2 text-center text-xs font-bold flex flex-col justify-center relative ${isWeekend ? 'bg-red-50/30 text-red-400' : 'text-gray-500'} ${isToday ? 'bg-blue-50 text-blue-600 border-blue-200 border-b-2' : ''}`}
                style={{ width: DAY_W }}>
                <span>{d.getMonth() + 1}/{d.getDate()}</span>
                <span className="text-[10px] opacity-70">{['일', '월', '화', '수', '목', '금', '토'][d.getDay()]}</span>
                {deploys.length > 0 && (
                  <div className="flex justify-center gap-0.5 mt-0.5">
                    {deploys.map((dp, di) => (
                      <span key={di} className={`text-[7px] font-bold px-1 rounded ${dp.env === 'PRD' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`} title={`${dp.env}: ${dp.label}`}>
                        {dp.env}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 타임라인 바디 */}
        <div className="relative w-max min-w-full pb-10">
          {/* 오늘 빨간 줄 */}
          {(() => {
            const todayOffset = diffDays(minISO, toISO(new Date()));
            if (todayOffset < 0 || todayOffset >= totalDays) return null;
            return (
              <div className="absolute top-0 bottom-0 border-l-2 border-red-400/50 z-0 pointer-events-none"
                style={{ left: `calc(19rem + ${todayOffset * DAY_W}px + ${DAY_W / 2}px)` }} />
            );
          })()}

          {filteredTasks.map((task, taskIdx) => {
            const subs = task.subtasks || [];
            const hasQa = task.hasQa && task.qa_start && task.qa_end;
            const rowCount = Math.max(subs.length, 1) + (hasQa ? 1 : 0);
            const ROW_H = 24;
            const rowH = (rowCount * ROW_H) + 16;

            const group = getGroup(taskIdx);
            const isFirst = isFirstInGroup(taskIdx);
            const isGroupBorder = isFirst && taskIdx > 0;

            return (
              <div key={task.id} className={`flex ${isGroupBorder ? 'border-t-2 border-gray-300' : 'border-b border-gray-100'} hover:bg-gray-50/50 transition-colors group`}>
                {/* 프로젝트명 (그룹 첫 번째만 표시) */}
                <div className="w-28 shrink-0 border-r border-gray-200 bg-white group-hover:bg-gray-50/50 transition-colors z-10 sticky left-0 flex items-start p-2"
                  style={{ minHeight: rowH }}>
                  {isFirst && (
                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => {
                        const proj = projects.find(p => p.name === task.project);
                        if (proj) onOpenModal && onOpenModal(proj, 'view', 'project');
                      }}>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getProjectColor(task.project) }} />
                      <span className="text-[11px] font-bold leading-tight break-keep">{task.project || '미정'}</span>
                    </div>
                  )}
                </div>

                {/* 업무 정보 */}
                <div className="w-48 shrink-0 border-r border-gray-200 p-2 bg-white group-hover:bg-gray-50/50 transition-colors z-10 sticky left-28"
                  style={{ minHeight: rowH }}>
                  <p className="text-xs font-bold text-gray-800 truncate cursor-pointer hover:text-blue-600"
                    onClick={() => onOpenModal && onOpenModal(task, 'view')}>
                    {task.title}
                  </p>
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {getTaskAssignees(task).map((name, i) => (
                      <span key={i} className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1 rounded">{name}</span>
                    ))}
                  </div>
                </div>

                {/* 간트 바 영역 */}
                <div className="relative flex-1" style={{ minWidth: `${totalDays * DAY_W}px`, minHeight: rowH }}>
                  {subs.map((s, si) => {
                    if (!s.start || !s.end) return null;
                    const left = diffDays(minISO, s.start);
                    const duration = diffDays(s.start, s.end) + 1;
                    const color = task.type === 'crm' ? '#6366f1' : task.type === 'todo' ? '#f59e0b' : (ROLE_COLORS[s.role] || '#94a3b8');

                    return (
                      <div
                        key={s.id || si}
                        className="absolute rounded-md flex items-center px-2 text-[10px] font-bold text-white overflow-hidden cursor-pointer hover:brightness-110 transition-all"
                        style={{
                          left: `${left * DAY_W + 4}px`,
                          width: `${duration * DAY_W - 8}px`,
                          top: si * ROW_H + 8,
                          height: ROW_H - 4,
                          backgroundColor: color,
                          opacity: s.done ? 0.5 : 1,
                        }}
                        onClick={() => onOpenModal && onOpenModal(task, 'view')}
                        title={`[${s.role}] ${getMemberName(s.dev_id) || '미배정'} (${s.start} ~ ${s.end})`}
                      >
                        <span className="truncate">{getMemberName(s.dev_id) || s.role}{s.done ? ' ✓' : ''}</span>
                      </div>
                    );
                  })}

                  {hasQa && (() => {
                    const left = diffDays(minISO, task.qa_start);
                    const duration = diffDays(task.qa_start, task.qa_end) + 1;
                    return (
                      <div
                        className="absolute rounded-md flex items-center px-2 text-[10px] font-bold text-white overflow-hidden cursor-pointer hover:brightness-110 transition-all"
                        style={{
                          left: `${left * DAY_W + 4}px`,
                          width: `${duration * DAY_W - 8}px`,
                          top: subs.length * ROW_H + 8,
                          height: ROW_H - 4,
                          backgroundColor: '#f59e0b',
                          opacity: task.qaDone ? 0.5 : 1,
                        }}
                        onClick={() => onOpenModal && onOpenModal(task, 'view')}
                        title={`[QA] ${getMemberName(task.qa_dev_id) || '미배정'} (${task.qa_start} ~ ${task.qa_end})`}
                      >
                        <span className="truncate">{getMemberName(task.qa_dev_id) || 'QA'}{task.qaDone ? ' ✓' : ''}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
