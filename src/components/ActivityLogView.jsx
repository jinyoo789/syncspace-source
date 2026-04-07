// src/components/ActivityLogView.jsx
import React, { useState, useMemo } from 'react';

const ACTION_LABEL = {
  created: '생성',
  deleted: '삭제',
  status_changed: '상태 변경',
  assignees_changed: '담당자 변경',
  schedule_changed: '일정 변경',
  pm_changed: 'PM 변경',
  priority_changed: '우선순위 변경',
  name_changed: '이름 변경',
  email_changed: '이메일 변경',
  role_changed: '역할 변경',
};

const ACTION_STYLE = {
  created: 'bg-green-50 text-green-700 border-green-200',
  deleted: 'bg-red-50 text-red-700 border-red-200',
  status_changed: 'bg-blue-50 text-blue-700 border-blue-200',
  assignees_changed: 'bg-purple-50 text-purple-700 border-purple-200',
  schedule_changed: 'bg-amber-50 text-amber-700 border-amber-200',
  pm_changed: 'bg-sky-50 text-sky-700 border-sky-200',
  priority_changed: 'bg-orange-50 text-orange-700 border-orange-200',
  name_changed: 'bg-gray-50 text-gray-700 border-gray-200',
  email_changed: 'bg-gray-50 text-gray-700 border-gray-200',
  role_changed: 'bg-teal-50 text-teal-700 border-teal-200',
};

const TASK_TYPE_LABEL = { feature: '기능', crm: 'CRM', todo: '할일' };
const TASK_TYPE_STYLE = {
  feature: 'bg-blue-50 text-blue-600 border-blue-100',
  crm: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  todo: 'bg-amber-50 text-amber-600 border-amber-100',
};

const ENTITY_LABEL = { task: '태스크', project: '프로젝트', member: '팀원' };
const ENTITY_STYLE = {
  task: 'bg-gray-50 text-gray-600 border-gray-200',
  project: 'bg-purple-50 text-purple-600 border-purple-200',
  member: 'bg-pink-50 text-pink-600 border-pink-200',
};

// serverTimestamp() 결과를 Date로 변환
const toDate = (when) => {
  if (!when) return null;
  if (typeof when.toDate === 'function') return when.toDate();
  if (when instanceof Date) return when;
  return null;
};

const formatRelative = (date) => {
  if (!date) return '-';
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d} ${hh}:${mm}`;
};

// 로그 엔트리에서 실제 표시할 entity 정보 추출.
// 신규 엔트리는 entityType/entityId/entityName 필드를 가짐.
// 레거시 엔트리는 taskId/taskTitle/taskType 필드만 가지므로 task로 매핑.
const resolveEntity = (log) => {
  if (log.entityType) {
    return {
      type: log.entityType,
      id: log.entityId || '',
      name: log.entityName || '(제목 없음)',
      meta: log.entityMeta || {},
    };
  }
  return {
    type: 'task',
    id: log.taskId || '',
    name: log.taskTitle || '(제목 없음)',
    meta: { type: log.taskType || 'feature' },
  };
};

const PAGE_SIZE = 50;

export default function ActivityLogView({ logs = [], tasks = [], projects = [], onOpenModal }) {
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const users = useMemo(
    () => ['all', ...Array.from(new Set(logs.map(l => l.who_name).filter(Boolean)))],
    [logs]
  );

  const filtered = useMemo(() => {
    return logs.filter(l => {
      const entity = resolveEntity(l);
      if (actionFilter !== 'all' && l.action !== actionFilter) return false;
      if (entityFilter !== 'all' && entity.type !== entityFilter) return false;
      if (userFilter !== 'all' && l.who_name !== userFilter) return false;
      return true;
    });
  }, [logs, actionFilter, entityFilter, userFilter]);

  const shown = filtered.slice(0, visible);

  const handleClickEntity = (entity) => {
    if (!onOpenModal) return;
    if (entity.type === 'task') {
      const task = tasks.find(t => t.id === entity.id);
      if (task) onOpenModal(task, 'view');
    } else if (entity.type === 'project') {
      const proj = projects.find(p => p.id === entity.id);
      if (proj) onOpenModal(proj, 'view', 'project');
    }
    // member는 현재 모달이 없으므로 클릭 안 함
  };

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC] p-4 md:p-8 h-screen flex flex-col animate-fade-in">
      <div className="mb-4 md:mb-6 shrink-0 ml-10 md:ml-0">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">활동 기록</h1>
        <p className="text-gray-500 text-xs md:text-sm mt-1 md:mt-1.5 font-medium">
          누가 언제 무엇을 변경했는지 기록을 확인하세요. (최근 500건, 180일 보관)
        </p>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap items-center gap-2 mb-4 shrink-0">
        {/* 대상 필터 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-gray-400 mr-1">대상</span>
          {['all', 'task', 'project', 'member'].map(t => (
            <button
              key={t}
              onClick={() => { setEntityFilter(t); setVisible(PAGE_SIZE); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                entityFilter === t
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t === 'all' ? '전체' : ENTITY_LABEL[t]}
            </button>
          ))}
        </div>

        {/* 액션 필터 */}
        <div className="flex items-center gap-1.5 flex-wrap ml-2">
          <span className="text-[11px] font-bold text-gray-400 mr-1">유형</span>
          {['all', 'created', 'status_changed', 'assignees_changed', 'schedule_changed', 'deleted'].map(a => (
            <button
              key={a}
              onClick={() => { setActionFilter(a); setVisible(PAGE_SIZE); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                actionFilter === a
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {a === 'all' ? '전체' : ACTION_LABEL[a]}
            </button>
          ))}
        </div>

        {users.length > 1 && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px] font-bold text-gray-400 mr-1">사람</span>
            <select
              value={userFilter}
              onChange={(e) => { setUserFilter(e.target.value); setVisible(PAGE_SIZE); }}
              className="text-xs font-bold bg-white border border-gray-200 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {users.map(u => (
                <option key={u} value={u}>{u === 'all' ? '전체' : u}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-auto custom-scrollbar">
        {shown.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">기록이 없습니다.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {shown.map((log) => {
              const date = toDate(log.when);
              const entity = resolveEntity(log);
              const clickable =
                (entity.type === 'task' && tasks.some(t => t.id === entity.id)) ||
                (entity.type === 'project' && projects.some(p => p.id === entity.id));
              const deleted = !clickable && (entity.type === 'task' || entity.type === 'project');

              return (
                <li key={log.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs shrink-0">
                      {(log.who_name || '?').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-800">{log.who_name || '미상'}</span>

                        {/* entity 종류 뱃지 */}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            ENTITY_STYLE[entity.type] || ''
                          }`}
                        >
                          {ENTITY_LABEL[entity.type] || entity.type}
                        </span>

                        {/* 액션 뱃지 */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            ACTION_STYLE[log.action] || 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          {ACTION_LABEL[log.action] || log.action}
                        </span>

                        {/* task type 뱃지 (task일 때만) */}
                        {entity.type === 'task' && entity.meta?.type && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              TASK_TYPE_STYLE[entity.meta.type] || ''
                            }`}
                          >
                            {TASK_TYPE_LABEL[entity.meta.type] || entity.meta.type}
                          </span>
                        )}

                        {/* member 역할 뱃지 */}
                        {entity.type === 'member' && entity.meta?.role && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-gray-50 text-gray-600 border-gray-200">
                            {entity.meta.role}
                          </span>
                        )}

                        <span className="text-[11px] text-gray-400 ml-auto">{formatRelative(date)}</span>
                      </div>
                      <div className="mt-1">
                        {clickable ? (
                          <button
                            onClick={() => handleClickEntity(entity)}
                            className="text-sm font-bold text-gray-900 hover:text-blue-600 text-left truncate"
                          >
                            {entity.name}
                          </button>
                        ) : (
                          <span className={`text-sm font-bold text-gray-500 ${deleted ? 'line-through' : ''}`}>
                            {entity.name}
                          </span>
                        )}
                      </div>
                      {(log.before !== undefined || log.after !== undefined) && (
                        <div className="mt-1.5 text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                            {String(log.before ?? '-')}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-blue-700 font-bold">
                            {String(log.after ?? '-')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {visible < filtered.length && (
          <div className="p-4 text-center border-t border-gray-100">
            <button
              onClick={() => setVisible(v => v + PAGE_SIZE)}
              className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              더 보기 ({filtered.length - visible}건 남음)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
