// src/components/GeneralTaskView.jsx
import React, { useState } from 'react';
import { getTaskAssignees, getTaskDateRange, formatDateDot } from '../utils';
import AddButton from './AddButton';

const PlusIcon = p => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const FilterIcon = p => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

export default function GeneralTaskView({ tasks, onOpenModal, CATEGORIES }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // 개발(feature) 업무는 프로젝트 뷰에서 관리 — 일반 업무에서는 제외
  const filteredTasks = tasks.filter(task => {
    if (task.type === 'feature') return false;
    if (activeFilter !== 'all' && task.status !== activeFilter) return false;
    if (typeFilter !== 'all' && task.type !== typeFilter) return false;
    return true;
  }).sort((a, b) => {
    const aEnd = getTaskDateRange(a).end || '';
    const bEnd = getTaskDateRange(b).end || '';
    return aEnd.localeCompare(bEnd);
  });

  const typeBadge = (type) => {
    if (type === 'crm') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (type === 'todo') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };
  const typeLabel = (type) => type === 'crm' ? 'CRM' : type === 'todo' ? '할일' : '개발';

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC] p-4 md:p-8 h-screen animate-fade-in custom-scrollbar">
      <div className="flex justify-between items-center mb-5 md:mb-6 shrink-0 ml-10 md:ml-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">일반 업무</h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1 md:mt-1.5 font-medium">전체 업무 목록을 확인하세요.</p>
        </div>
        <AddButton onSelect={(type) => onOpenModal && onOpenModal(null, 'create', type)} />
      </div>

      {/* 필터 바 */}
      <div className="flex items-center justify-between gap-2 mb-5 md:mb-6 bg-white p-2 md:p-3 rounded-xl md:rounded-2xl border border-gray-200 shadow-sm flex-wrap">
        <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto">
          <FilterIcon className="text-gray-400 mx-1 md:mx-2 shrink-0" />
          {['all', '검토중', '대기중', '진행중', '완료'].map(status => (
            <button key={status} onClick={() => setActiveFilter(status)}
              className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-xl text-[11px] md:text-xs font-bold transition-all shrink-0 ${activeFilter === status ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
              {status === 'all' ? '전체' : status}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          {['all', 'crm', 'todo'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-2.5 md:px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
              {t === 'all' ? '전체' : t === 'crm' ? 'CRM' : '할일'}
            </button>
          ))}
        </div>
      </div>

      {/* 데스크톱 테이블 */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <div className="col-span-4 pl-2">업무명</div>
          <div className="col-span-1 text-center">유형</div>
          <div className="col-span-2 text-center">상태</div>
          <div className="col-span-2 text-center">담당자</div>
          <div className="col-span-3 text-right pr-2">일정</div>
        </div>
        <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
          {filteredTasks.length > 0 ? filteredTasks.map(task => {
            const assignees = getTaskAssignees(task);
            const range = getTaskDateRange(task);

            return (
              <div
                key={task.id}
                onClick={() => onOpenModal && onOpenModal(task, 'view')}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <div className="col-span-4 pl-2">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{task.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{task.project}</p>
                </div>
                <div className="col-span-1 flex justify-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeBadge(task.type)}`}>
                    {typeLabel(task.type)}
                  </span>
                </div>
                <div className="col-span-2 flex justify-center">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                    task.status === '완료' ? 'bg-green-50 text-green-700 border-green-200' :
                    task.status === '진행중' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    {task.status}
                  </span>
                </div>
                <div className="col-span-2 flex justify-center">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {assignees.length > 0 ? assignees.slice(0, 3).map((name, i) => (
                      <span key={i} className="text-[10px] font-bold text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                        {name}
                      </span>
                    )) : <span className="text-[10px] text-gray-400">미정</span>}
                    {assignees.length > 3 && <span className="text-[10px] text-gray-400">+{assignees.length - 3}</span>}
                  </div>
                </div>
                <div className="col-span-3 text-right pr-2 text-xs font-bold text-gray-500">
                  {formatDateDot(range.start)} ~ {formatDateDot(range.end)}
                </div>
              </div>
            );
          }) : (
            <div className="p-12 text-center text-gray-400 font-bold">조건에 맞는 업무가 없습니다.</div>
          )}
        </div>
      </div>

      {/* 모바일 카드 리스트 */}
      <div className="md:hidden space-y-3">
        {filteredTasks.length > 0 ? filteredTasks.map(task => {
          const assignees = getTaskAssignees(task);
          const range = getTaskDateRange(task);
          return (
            <div
              key={task.id}
              onClick={() => onOpenModal && onOpenModal(task, 'view')}
              className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm active:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-bold text-gray-900 flex-1">{task.title}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${typeBadge(task.type)}`}>
                  {typeLabel(task.type)}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mb-2">{task.project}</p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    task.status === '완료' ? 'bg-green-50 text-green-700 border-green-200' :
                    task.status === '진행중' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>{task.status}</span>
                  {assignees.slice(0, 2).map((name, i) => (
                    <span key={i} className="text-[10px] font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">{name}</span>
                  ))}
                  {assignees.length > 2 && <span className="text-[10px] text-gray-400">+{assignees.length - 2}</span>}
                </div>
                <span className="text-[10px] font-bold text-gray-400 shrink-0">{formatDateDot(range.start)} ~ {formatDateDot(range.end)}</span>
              </div>
            </div>
          );
        }) : (
          <div className="p-12 text-center text-gray-400 font-bold bg-white rounded-xl border border-gray-200">조건에 맞는 업무가 없습니다.</div>
        )}
      </div>
    </div>
  );
}
