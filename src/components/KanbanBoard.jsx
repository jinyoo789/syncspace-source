// src/components/KanbanBoard.jsx
import React, { useState } from 'react';
import DateNav from './DateNav';
import { todayISO, isDateInRange, getTaskAssignees, isPersonInTask, formatDateDot, getTaskDateRange, getMemberName, getPersonTaskEndDate } from '../utils';

const I = ({ d, size = 18, className = '', sw = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);
const CalendarIcon = p => <I {...p} d={<><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>} />;
const PlusIcon = p => <I {...p} d={<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>} />;
const ArrowRightIcon = p => <I {...p} d={<><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>} />;

export default function KanbanBoard({ tasks, setTasks, onMoveTaskStatus, loggedInUser, CATEGORIES, onOpenModal, dailyStatus, setDailyStatus }) {
  const [myTaskDate, setMyTaskDate] = useState(todayISO());

  // 내 검토중 태스크 전체 (날짜 무관)
  const myReviewTasks = tasks.filter(t =>
    t.status === '검토중' && isPersonInTask(t, loggedInUser?.name)
  );
  // 가장 빠른 검토중 태스크의 시작일
  const earliestReviewDate = myReviewTasks.reduce((earliest, t) => {
    const range = getTaskDateRange(t);
    if (!range.start) return earliest;
    if (!earliest || range.start < earliest) return range.start;
    return earliest;
  }, null);

  // 지난 날짜 미완료 태스크 (완료가 아닌 상태 + 내 종료일이 오늘 이전)
  const today = todayISO();
  const myOverdueTasks = tasks.filter(t => {
    if (t.status === '완료' || t.status === '반려') return false;
    if (!isPersonInTask(t, loggedInUser?.name)) return false;
    const endDate = getPersonTaskEndDate(t, loggedInUser?.name);
    return endDate && endDate < today;
  });
  // 가장 오래된 미완료 태스크의 시작일 (해당 날짜로 이동용)
  const oldestOverdueDate = myOverdueTasks.reduce((oldest, t) => {
    const range = getTaskDateRange(t);
    if (!range.start) return oldest;
    if (!oldest || range.start < oldest) return range.start;
    return oldest;
  }, null);

  // 내가 관련된 태스크 중 선택 날짜에 걸리는 것 필터
  const myName = loggedInUser?.name;
  const myTasks = tasks.filter(t => {
    if (!isPersonInTask(t, myName)) return false;
    const inSub = (t.subtasks || []).some(s =>
      getMemberName(s.dev_id) === myName && s.start && s.end && isDateInRange(myTaskDate, s.start, s.end)
    );
    const inQa = getMemberName(t.qa_dev_id) === myName && t.hasQa && t.qa_start && t.qa_end &&
      isDateInRange(myTaskDate, t.qa_start, t.qa_end);
    return inSub || inQa;
  });

  const cols = ['검토중', '대기중', '진행중', '완료'];
  const colColors = { '검토중': 'bg-yellow-500', '대기중': 'bg-gray-400', '진행중': 'bg-blue-500', '완료': 'bg-green-500' };

  const moveTask = (task, newStatus) => {
    if (onMoveTaskStatus) {
      onMoveTaskStatus(task, newStatus);
    }
  };

  const getCatInfo = (task) => {
    if (task.type === 'crm') return CATEGORIES.find(c => c.id === 'crm');
    if (task.type === 'todo') return CATEGORIES.find(c => c.id === 'todo');
    return CATEGORIES.find(c => c.id === 'dev');
  };

  // 하루 상태 관리
  const userName = loggedInUser?.name || '';
  const currentStatus = dailyStatus?.[userName]?.[myTaskDate] || '보통';
  const handleStatusChange = (e) => {
    setDailyStatus(prev => ({
      ...prev,
      [userName]: { ...(prev[userName] || {}), [myTaskDate]: e.target.value },
    }));
  };

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC] p-4 md:p-8 h-screen flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-5 md:mb-8 shrink-0 flex-wrap gap-3 md:gap-4 ml-10 md:ml-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">내 작업</h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1 md:mt-1.5 font-medium">칸반 보드에서 상태를 관리하세요.</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <DateNav value={myTaskDate} onChange={setMyTaskDate} />
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-xs font-bold text-gray-500 px-2">상태</span>
            <select value={currentStatus} onChange={handleStatusChange}
              className="text-sm font-bold bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              <option value="보통">🟢 보통</option>
              <option value="바쁨">🟡 바쁨</option>
              <option value="불가">🔴 불가</option>
            </select>
          </div>
        </div>
      </div>

      {/* 지난 날짜 미완료 알림 배너 */}
      {myOverdueTasks.length > 0 && (
        <div className="mb-3 shrink-0 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
          <p className="text-sm font-bold text-red-800">
            기한 지난 미완료 작업 {myOverdueTasks.length}건
            {oldestOverdueDate && <span className="ml-2 text-red-500 font-semibold">| 가장 오래된 일정: {formatDateDot(oldestOverdueDate)}</span>}
          </p>
          {oldestOverdueDate && (
            <button
              onClick={() => setMyTaskDate(oldestOverdueDate)}
              className="ml-auto text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors shrink-0"
            >
              해당 날짜로 이동 →
            </button>
          )}
        </div>
      )}

      {/* 검토중 알림 배너 */}
      {myReviewTasks.length > 0 && (
        <div className="mb-4 shrink-0 flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          <div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
          <p className="text-sm font-bold text-yellow-800">
            검토 필요 {myReviewTasks.length}건
            {earliestReviewDate && <span className="ml-2 text-yellow-600 font-semibold">| 가장 빠른 시작일: {formatDateDot(earliestReviewDate)}</span>}
          </p>
          {earliestReviewDate && (
            <button
              onClick={() => setMyTaskDate(earliestReviewDate)}
              className="ml-auto text-xs font-bold text-yellow-700 bg-yellow-100 hover:bg-yellow-200 px-3 py-1.5 rounded-lg transition-colors shrink-0"
            >
              해당 날짜로 이동 →
            </button>
          )}
        </div>
      )}

      <div className="flex gap-3 md:gap-5 flex-1 overflow-x-auto pb-4 custom-scrollbar">
        {cols.map(col => {
          const colTasks = myTasks.filter(t => t.status === col);
          return (
            <div key={col} className="flex-1 min-w-[240px] md:min-w-[280px] flex flex-col bg-gray-100/50 rounded-2xl p-3 md:p-4 border border-gray-200/60">
              <h3 className="font-bold text-gray-800 mb-4 flex justify-between items-center px-2">
                <span className="flex items-center gap-2 text-sm">
                  <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${colColors[col]}`} />{col}
                </span>
                <span className="bg-white text-gray-600 px-2.5 py-0.5 rounded-md text-xs border border-gray-200 shadow-sm font-bold">{colTasks.length}</span>
              </h3>

              <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {colTasks.map(task => {
                  const ci = getCatInfo(task);
                  const range = getTaskDateRange(task);
                  const assignees = getTaskAssignees(task);

                  return (
                    <div
                      key={task.id}
                      onClick={() => onOpenModal(task, 'edit')}
                      className={`bg-white p-4 rounded-xl shadow-sm border border-l-4 cursor-pointer transition-all group hover:-translate-y-1 hover:shadow-md animate-fade-in-up ${ci?.borderClass || 'border-gray-200'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${ci?.bgClass} ${ci?.textClass} ${ci?.borderClass}`}>
                          {task.project}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          task.type === 'crm' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' :
                          task.type === 'todo' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                          'bg-blue-50 text-blue-600 border border-blue-200'
                        }`}>
                          {task.type === 'crm' ? 'CRM' : task.type === 'todo' ? '할일' : '개발'}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm mb-3 leading-snug">{task.title}</h4>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {assignees.map((name, i) => (
                          <span key={i} className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            name === loggedInUser?.name ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}>
                            {name}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center text-xs text-gray-500 font-semibold bg-gray-50 px-2 py-1.5 rounded-md border border-gray-100">
                        <CalendarIcon size={12} className="text-gray-400 mr-1.5" />
                        {formatDateDot(range.start)} ~ {formatDateDot(range.end)}
                      </div>

                      {/* 검토중일 때 수락/반려 버튼 */}
                      {col === '검토중' && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); moveTask(task, '대기중'); }}
                            className="flex-1 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5">
                            수락 <ArrowRightIcon size={12} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); moveTask(task, '반려'); }}
                            className="flex-1 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5">
                            반려
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {colTasks.length === 0 && (
                  <div className="py-8 text-center text-xs font-medium text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-white/30">
                    일정이 없습니다
                  </div>
                )}
                <button onClick={() => onOpenModal(null, 'create', 'feature')}
                  className="w-full py-3 border-2 border-dashed border-gray-200 bg-white/50 rounded-xl text-gray-500 text-sm font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2 mt-2 shadow-sm">
                  <PlusIcon size={16} /> 작업 추가
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
