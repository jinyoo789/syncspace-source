// src/components/TeamView.jsx
import React, { useState } from 'react';
import DateNav from './DateNav';
import { todayISO, isPersonInTask, isTaskOnDate, getTaskDateRange, formatDateDot, getMemberName } from '../utils';

const I = ({ d, size = 18, className = '', sw = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);
const CalendarIcon = p => <I {...p} d={<><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>} />;
const CheckCircleIcon = p => <I {...p} d={<><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>} />;

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700', 'bg-pink-100 text-pink-700', 'bg-teal-100 text-teal-700',
];
const Avatar = ({ name, size = 'lg' }) => {
  const h = name ? name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
  const sizes = { sm: 'w-6 h-6 text-[10px]', md: 'w-8 h-8 text-xs', lg: 'w-10 h-10 text-sm' };
  return (
    <div className={`flex items-center justify-center rounded-full font-bold border shrink-0 ${sizes[size]} ${AVATAR_COLORS[h % AVATAR_COLORS.length]}`}>
      {name ? name.charAt(0) : '?'}
    </div>
  );
};

export default function TeamView({ team, tasks, CATEGORIES, onOpenModal, dailyStatus }) {
  const [teamViewDate, setTeamViewDate] = useState(todayISO());
  const [roleFilter, setRoleFilter] = useState('all');

  const roles = ['all', ...Array.from(new Set(team.map(m => m.role).filter(Boolean)))];
  const filteredTeam = roleFilter === 'all' ? team : team.filter(m => m.role === roleFilter);

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC] p-4 md:p-8 h-screen custom-scrollbar animate-fade-in">
      <div className="flex justify-between items-center mb-5 md:mb-6 flex-wrap gap-3 md:gap-4 ml-10 md:ml-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">팀원 현황</h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1 md:mt-1.5 font-medium">팀원 상태와 업무 리스트를 확인합니다.</p>
        </div>
        <DateNav value={teamViewDate} onChange={setTeamViewDate} />
      </div>

      {/* 직무 필터 */}
      <div className="flex items-center gap-2 mb-5 md:mb-6 flex-wrap">
        {roles.map(role => (
          <button key={role} onClick={() => setRoleFilter(role)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              roleFilter === role
                ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}>
            {role === 'all' ? '전체' : role}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {filteredTeam.map(member => {
          // 해당 팀원이 관련된 태스크 중, 선택 날짜에 걸리는 것
          const mt = tasks.filter(t =>
            isPersonInTask(t, member.name) && isTaskOnDate(t, teamViewDate)
          );

          return (
            <div key={member.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full animate-fade-in-up">
              <div className="flex justify-between items-start mb-6 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <Avatar name={member.name} />
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{member.name}</h3>
                    <p className="text-xs text-gray-500 font-medium">{member.role}</p>
                  </div>
                </div>
                {(() => {
                  const status = dailyStatus?.[member.name]?.[teamViewDate];
                  if (!status || status === '보통') return null;
                  const styles = { '바쁨': 'bg-yellow-50 text-yellow-700 border-yellow-200', '불가': 'bg-red-50 text-red-700 border-red-200' };
                  const emoji = { '바쁨': '🟡', '불가': '🔴' };
                  return <span className={`px-2.5 py-1 rounded text-xs font-bold border shadow-sm ${styles[status] || ''}`}>{emoji[status]} {status}</span>;
                })()}
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">할당된 작업</p>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">{mt.length}</span>
                </div>

                <div className="space-y-3 flex-1">
                  {mt.length > 0 ? mt.map(task => {
                    const range = getTaskDateRange(task);
                    const typeBadge = task.type === 'crm'
                      ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                      : task.type === 'todo'
                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                        : 'bg-blue-50 text-blue-600 border-blue-200';

                    return (
                      <div
                        key={task.id}
                        onClick={() => onOpenModal && onOpenModal(task, 'view')}
                        className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-colors cursor-pointer group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-gray-800 pr-2 leading-snug group-hover:text-blue-600 transition-colors flex-1">
                            {task.title}
                          </span>
                          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeBadge}`}>
                            {task.type === 'crm' ? 'CRM' : task.type === 'todo' ? '할일' : '개발'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium">
                          <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                            <CalendarIcon size={11} className="text-gray-400" />
                            {formatDateDot(range.start)} ~ {formatDateDot(range.end)}
                          </span>
                          <span className={`font-bold ${
                            task.status === '완료' ? 'text-green-600' :
                            task.status === '진행중' ? 'text-blue-600' : 'text-gray-400'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                        {/* 이 사람의 역할 표시 */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(task.subtasks || []).filter(s => getMemberName(s.dev_id) === member.name).map((s, i) => (
                            <span key={i} className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              s.role === 'BE' ? 'bg-blue-100 text-blue-600' :
                              s.role === 'FE' ? 'bg-green-100 text-green-600' :
                              'bg-purple-100 text-purple-600'
                            } ${s.done ? 'opacity-50 line-through' : ''}`}>
                              {s.role}{s.done ? ' ✓' : ''}
                            </span>
                          ))}
                          {(getMemberName(task.qa_dev_id) === member.name) && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 ${task.qaDone ? 'opacity-50 line-through' : ''}`}>
                              QA{task.qaDone ? ' ✓' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 py-8">
                      <CheckCircleIcon size={24} className="mb-2 text-gray-300" />
                      할당된 일정이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
