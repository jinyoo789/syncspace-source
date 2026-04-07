// src/components/PastTasksView.jsx
import React, { useState } from 'react';
import { getTaskAssignees, getTaskDateRange, formatDateDot } from '../utils';

export default function PastTasksView({ tasks, CATEGORIES, onOpenModal }) {
  const [typeFilter, setTypeFilter] = useState('all');

  const pastTasks = tasks
    .filter(t => t.status === '완료')
    .filter(t => t.type !== 'feature')
    .filter(t => typeFilter === 'all' || t.type === typeFilter)
    .sort((a, b) => {
      const aStart = getTaskDateRange(a).start || '';
      const bStart = getTaskDateRange(b).start || '';
      return bStart.localeCompare(aStart);
    });

  const typeBadge = (type) => {
    if (type === 'crm') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (type === 'todo') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };
  const typeLabel = (type) => type === 'crm' ? 'CRM' : type === 'todo' ? '할일' : '개발';

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC] p-4 md:p-8 h-screen animate-fade-in custom-scrollbar">
      <div className="flex justify-between items-center mb-5 md:mb-6 shrink-0 flex-wrap gap-3 md:gap-4 ml-10 md:ml-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">지난 업무</h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1 md:mt-1.5 font-medium">완료된 업무를 확인합니다.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
          {['all', 'crm', 'todo'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-2.5 md:px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all ${typeFilter === t ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
              {t === 'all' ? '전체' : typeLabel(t)}
            </button>
          ))}
        </div>
      </div>

      {/* 데스크톱 테이블 */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <div className="col-span-5 pl-2">업무명</div>
          <div className="col-span-1 text-center">유형</div>
          <div className="col-span-3 text-center">담당자</div>
          <div className="col-span-3 text-right pr-2">일정</div>
        </div>
        <div className="divide-y divide-gray-100">
          {pastTasks.length > 0 ? pastTasks.map(task => {
            const assignees = getTaskAssignees(task);
            const range = getTaskDateRange(task);
            return (
              <div key={task.id}
                onClick={() => onOpenModal && onOpenModal(task, 'view')}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors cursor-pointer group opacity-80">
                <div className="col-span-5 pl-2">
                  <p className="text-sm font-bold text-gray-600 group-hover:text-blue-600 transition-colors line-through">{task.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{task.project}</p>
                </div>
                <div className="col-span-1 flex justify-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeBadge(task.type)}`}>{typeLabel(task.type)}</span>
                </div>
                <div className="col-span-3 flex justify-center">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {assignees.length > 0 ? assignees.map((name, i) => (
                      <span key={i} className="text-[10px] font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">{name}</span>
                    )) : <span className="text-[10px] text-gray-400">-</span>}
                  </div>
                </div>
                <div className="col-span-3 text-right pr-2 text-xs font-bold text-gray-400">
                  {formatDateDot(range.start)} ~ {formatDateDot(range.end)}
                </div>
              </div>
            );
          }) : (
            <div className="p-12 text-center text-gray-400 font-bold">완료된 업무가 없습니다.</div>
          )}
        </div>
      </div>

      {/* 모바일 카드 리스트 */}
      <div className="md:hidden space-y-3">
        {pastTasks.length > 0 ? pastTasks.map(task => {
          const assignees = getTaskAssignees(task);
          const range = getTaskDateRange(task);
          return (
            <div key={task.id}
              onClick={() => onOpenModal && onOpenModal(task, 'view')}
              className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm active:bg-gray-50 cursor-pointer opacity-80">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-sm font-bold text-gray-600 line-through flex-1">{task.title}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${typeBadge(task.type)}`}>{typeLabel(task.type)}</span>
              </div>
              <p className="text-[10px] text-gray-400 mb-2">{task.project}</p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  {assignees.slice(0, 3).map((name, i) => (
                    <span key={i} className="text-[10px] font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">{name}</span>
                  ))}
                  {assignees.length > 3 && <span className="text-[10px] text-gray-400">+{assignees.length - 3}</span>}
                </div>
                <span className="text-[10px] font-bold text-gray-400 shrink-0">{formatDateDot(range.start)} ~ {formatDateDot(range.end)}</span>
              </div>
            </div>
          );
        }) : (
          <div className="p-12 text-center text-gray-400 font-bold bg-white rounded-xl border border-gray-200">완료된 업무가 없습니다.</div>
        )}
      </div>
    </div>
  );
}
