// src/components/TaskModal.jsx
import React, { useState, useEffect } from 'react';
import { getTaskAssignees, getTaskDateRange, getMemberName } from '../utils';

// ─── 아이콘 ───
const I = ({ d, size = 20, className = '', sw = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);
const XIcon = p => <I {...p} d="M18 6 6 18M6 6l12 12" />;
const SaveIcon = p => <I {...p} d={<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></>} />;
const EditIcon = p => <I {...p} d={<><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></>} />;
const TrashIcon = p => <I {...p} d={<><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>} />;
const PlusIcon = p => <I {...p} d={<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>} />;

const uid = () => Math.random().toString(36).substr(2, 9);

// 레거시 호환: 과거에는 dev_id/qa_dev_id 자리에 이름이 저장돼 있던 경우가 있음.
// team 목록에서 id 매칭 → 실패하면 name 매칭 → 매칭된 멤버의 id를 반환.
// 둘 다 실패하면 빈 문자열(= 미배정)로 떨어뜨려 UI가 깨지지 않게 함.
const memberIdFromLegacy = (idOrName, team) => {
  if (!idOrName) return '';
  const found = (team || []).find(m => m.id === idOrName || m.name === idOrName);
  return found ? found.id : '';
};

const TODAY = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

const formatDate = (ds) => {
  if (!ds) return '-';
  const d = new Date(ds + 'T00:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
};

const ACTIVITY_LABEL = {
  created: '생성',
  deleted: '삭제',
  status_changed: '상태',
  assignees_changed: '담당자',
  schedule_changed: '일정',
};
const ACTIVITY_STYLE = {
  created: 'bg-green-50 text-green-700 border-green-200',
  deleted: 'bg-red-50 text-red-700 border-red-200',
  status_changed: 'bg-blue-50 text-blue-700 border-blue-200',
  assignees_changed: 'bg-purple-50 text-purple-700 border-purple-200',
  schedule_changed: 'bg-amber-50 text-amber-700 border-amber-200',
};
const formatLogDate = (when) => {
  if (!when) return '-';
  const d = typeof when.toDate === 'function' ? when.toDate() : (when instanceof Date ? when : null);
  if (!d) return '-';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${m}/${day} ${hh}:${mm}`;
};

export default function TaskModal({
  isOpen, onClose, onSave, onDelete,
  CATEGORIES, ROLES, team, projects,
  initialTask, mode, setMode, createType,
  activityLogs = [],
}) {
  const getDefaultForm = (type) => ({
    title: '', project: projects?.[0]?.name || '',
    type: type || 'feature', status: '검토중', urgency: 'medium',
    subtasks: (type === 'crm' || type === 'todo')
      ? [{ id: uid(), role: 'BE', dev_id: '', start: TODAY, end: TODAY, done: false }]
      : [{ id: uid(), role: 'BE', dev_id: '', start: TODAY, end: TODAY, done: false }],
    hasQa: false, qa_dev_id: '', qa_start: '', qa_end: '', qaDone: false,
    deploys: [],
    channel: 'kakao', expected_count: 0, conversion_rate: 0, note: '', jiraUrls: [], slackUrls: [],
  });

  const [formData, setFormData] = useState(getDefaultForm(createType));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [crmBulkMode, setCrmBulkMode] = useState(false);
  const [crmBulkEnd, setCrmBulkEnd] = useState(TODAY);

  useEffect(() => {
    if (isOpen) {
      setConfirmDelete(false);
      setCrmBulkMode(false);
      setCrmBulkEnd(TODAY);
      if (initialTask) {
        // 레거시 정규화: dev_id / qa_dev_id 자리에 이름이 저장된 경우 id로 변환해서 로드.
        // 이렇게 해두면 이후 저장 시 올바른 id로 Firestore에 반영되어 자연스럽게 마이그레이션됨.
        const normalizedSubtasks = (initialTask.subtasks?.length
          ? initialTask.subtasks
          : [{ id: uid(), role: 'BE', dev_id: '', start: TODAY, end: TODAY, done: false }]
        ).map(s => ({
          ...s,
          dev_id: s.dev_id ? memberIdFromLegacy(s.dev_id, team) || s.dev_id : '',
        }));
        const normalizedQaDevId = initialTask.qa_dev_id
          ? (memberIdFromLegacy(initialTask.qa_dev_id, team) || initialTask.qa_dev_id)
          : '';
        setFormData({
          ...getDefaultForm(initialTask.type),
          ...initialTask,
          subtasks: normalizedSubtasks,
          qa_dev_id: normalizedQaDevId,
          deploys: initialTask.deploys || [],
        });
      } else {
        setFormData(getDefaultForm(createType));
      }
    }
  }, [isOpen, initialTask, createType, team]);

  const isEditing = mode === 'edit' || mode === 'create';
  const safeClose = () => {
    if (isEditing) {
      if (window.confirm('저장하지 않고 닫으시겠습니까?')) onClose();
    } else {
      onClose();
    }
  };

  // ESC 키
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') safeClose(); };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, isEditing]);

  if (!isOpen) return null;

  // ─── 폼 변경 핸들러들 ───
  const set = (k, v) => setFormData(prev => ({ ...prev, [k]: v }));

  const setSub = (i, k, v) => setFormData(prev => ({
    ...prev,
    subtasks: prev.subtasks.map((s, j) => j === i ? { ...s, [k]: v } : s),
  }));

  const addSub = () => setFormData(prev => ({
    ...prev,
    subtasks: [...prev.subtasks, {
      id: uid(), role: 'BE', dev_id: '',
      start: prev.subtasks.at(-1)?.end || TODAY,
      end: prev.subtasks.at(-1)?.end || TODAY,
      done: false,
    }],
  }));

  const rmSub = (i) => setFormData(prev => ({
    ...prev,
    subtasks: prev.subtasks.filter((_, j) => j !== i),
  }));

  const setDep = (i, k, v) => setFormData(prev => ({
    ...prev,
    deploys: prev.deploys.map((d, j) => j === i ? { ...d, [k]: v } : d),
  }));

  const addDep = () => setFormData(prev => ({
    ...prev,
    deploys: [...prev.deploys, { id: uid(), env: 'STG', date: TODAY, status: 'scheduled', note: '' }],
  }));

  const rmDep = (i) => setFormData(prev => ({
    ...prev,
    deploys: prev.deploys.filter((_, j) => j !== i),
  }));

  // ─── 저장 ───
  const handleSubmit = () => {
    if (!formData.title) {
      alert('제목을 입력해주세요.');
      return;
    }

    // CRM 기간 일괄 생성
    if (crmBulkMode && formData.type === 'crm' && isCreateMode) {
      const startDate = formData.subtasks?.[0]?.start || TODAY;
      const endDate = crmBulkEnd;
      if (endDate < startDate) { alert('종료일이 시작일보다 빠릅니다.'); return; }

      const days = [];
      const cur = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      while (cur <= end) {
        days.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`);
        cur.setDate(cur.getDate() + 1);
      }

      if (days.length > 60) { alert('최대 60일까지 일괄 생성 가능합니다.'); return; }
      if (!window.confirm(`${days.length}개의 CRM 태스크를 생성합니다.`)) return;

      days.forEach(date => {
        const task = {
          ...formData,
          id: uid(),
          title: `${formData.title} (${date.slice(5).replace('-', '/')})`,
          subtasks: [{ ...(formData.subtasks?.[0] || {}), id: uid(), start: date, end: date }],
          jiraUrls: (formData.jiraUrls || []).filter(u => u?.trim()),
          slackUrls: (formData.slackUrls || []).filter(u => u?.trim()),
        };
        delete task.jiraUrl;
        delete task.slackUrl;
        onSave(task);
      });
      return;
    }

    const taskToSave = {
      ...formData,
      id: initialTask ? initialTask.id : uid(),
      jiraUrls: (formData.jiraUrls || []).filter(u => u?.trim()),
      slackUrls: (formData.slackUrls || []).filter(u => u?.trim()),
    };
    delete taskToSave.jiraUrl;
    delete taskToSave.slackUrl;
    onSave(taskToSave);
  };

  // ─── 배경 클릭 ───
  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) safeClose();
  };

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  // 유형별 라벨
  const typeLabels = { feature: '기능 개발', crm: 'CRM / 마케팅', todo: '할일' };
  const urgencyLabels = { high: '높음', medium: '보통', low: '낮음' };
  const statusLabels = { '대기중': '대기중', '진행중': '진행중', '완료': '완료', '검토중': '검토중' };

  // ═══════════════════════════════════════
  // VIEW MODE (읽기 전용)
  // ═══════════════════════════════════════
  if (isViewMode) {
    const assignees = getTaskAssignees(formData);
    const dateRange = getTaskDateRange(formData);
    const matchedProject = projects?.find(p => p.name === formData.project);

    return (
      <div onClick={handleOverlay} className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4 animate-fade-in">
        <div className="bg-white md:rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col h-full md:h-auto md:max-h-[90vh] animate-fade-in-up">

          {/* 헤더 */}
          <div className="flex justify-between items-start p-4 md:p-6 border-b border-gray-100 bg-gray-50/50 md:rounded-t-3xl shrink-0">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  formData.type === 'crm' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                  formData.type === 'todo' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {typeLabels[formData.type] || formData.type}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  formData.status === '완료' ? 'bg-green-50 text-green-700 border-green-200' :
                  formData.status === '진행중' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                  {formData.status}
                </span>
                {formData.urgency === 'high' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200">🔥 긴급</span>
                )}
              </div>
              <h2 className="text-xl font-black text-gray-900 leading-snug">{formData.title}</h2>
              {formData.project && (
                <p className="text-xs font-bold text-gray-400 mt-1">{formData.project}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setMode('edit')} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="수정">
                <EditIcon size={18} />
              </button>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors">
                <XIcon size={18} />
              </button>
            </div>
          </div>

          {/* 본문 */}
          <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">

            {/* 개발 파트 */}
            {formData.subtasks?.length > 0 && formData.type === 'feature' && (
              <div>
                <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">개발 파트</h4>
                <div className="space-y-2">
                  {formData.subtasks.map((s, i) => (
                    <div key={s.id || i} className={`flex items-center gap-3 p-3 rounded-xl border ${s.done ? 'bg-green-50/50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        s.role === 'BE' ? 'bg-blue-100 text-blue-700' :
                        s.role === 'FE' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>{s.role}</span>
                      <span className="text-sm font-bold text-gray-800">{getMemberName(s.dev_id) || '미배정'}</span>
                      <span className="text-xs text-gray-500 ml-auto">{formatDate(s.start)} ~ {formatDate(s.end)}</span>
                      {s.done && <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">완료</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QA */}
            {formData.hasQa && (
              <div>
                <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">QA</h4>
                <div className={`p-3 rounded-xl border ${formData.qaDone ? 'bg-green-50/50 border-green-200' : 'bg-emerald-50/50 border-emerald-200'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">QA</span>
                    <span className="text-sm font-bold text-gray-800">{getMemberName(formData.qa_dev_id) || '미배정'}</span>
                    <span className="text-xs text-gray-500 ml-auto">{formatDate(formData.qa_start)} ~ {formatDate(formData.qa_end)}</span>
                    {formData.qaDone && <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">완료</span>}
                  </div>
                </div>
              </div>
            )}

            {/* 배포 일정 */}
            {formData.deploys?.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">배포 일정</h4>
                <div className="space-y-2">
                  {formData.deploys.map((d, i) => (
                    <div key={d.id || i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        d.env === 'PRD' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{d.env}</span>
                      <span className="text-sm font-bold text-gray-800">{formatDate(d.date)}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        d.status === 'deployed' ? 'bg-green-100 text-green-700' :
                        d.status === 'rollback' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{d.status === 'deployed' ? '완료' : d.status === 'rollback' ? '롤백' : '예정'}</span>
                      {d.note && <span className="text-xs text-gray-500 ml-auto">{d.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 프로젝트 배포 일정 (연관 프로젝트) */}
            {matchedProject?.deploys?.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">프로젝트 배포 일정 ({matchedProject.name})</h4>
                <div className="space-y-2">
                  {matchedProject.deploys.map((d, i) => (
                    <div key={d.id || i} className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-200 bg-white">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        d.env === 'PRD' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{d.env}</span>
                      <span className="text-sm text-gray-600">{formatDate(d.date)}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        d.status === 'deployed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>{d.status === 'deployed' ? '완료' : '예정'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CRM 정보 */}
            {formData.type === 'crm' && (
              <div>
                <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">CRM 발송 정보</h4>
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-2">
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-500">채널</span>
                    <span className="font-bold text-gray-800">
                      {formData.channel === 'kakao' ? '카카오 알림톡' : formData.channel === 'push' ? '앱 푸시' : formData.channel === 'sms' ? '문자' : formData.channel}
                    </span>
                  </div>
                  {formData.expected_count > 0 && (
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-500">타겟</span>
                      <span className="font-bold text-gray-800">{formData.expected_count.toLocaleString()}명</span>
                    </div>
                  )}
                  {formData.conversion_rate > 0 && (
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-500">예상 전환율</span>
                      <span className="font-bold text-gray-800">{formData.conversion_rate}%</span>
                    </div>
                  )}
                  {formData.expected_count > 0 && formData.conversion_rate > 0 && (
                    <div className="flex gap-4 text-sm pt-2 border-t border-indigo-100">
                      <span className="text-indigo-600 font-bold">예상 유입</span>
                      <span className="font-black text-indigo-700">{Math.round(formData.expected_count * formData.conversion_rate / 100).toLocaleString()}명</span>
                    </div>
                  )}
                  {formData.note && (
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-500">메모</span>
                      <span className="text-gray-800">{formData.note}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Jira 링크 */}
            {formData.jiraUrls?.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">Jira</h4>
                <div className="space-y-1.5">
                  {formData.jiraUrls.filter(Boolean).map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors truncate">
                      <svg className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      <span className="truncate">{url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Slack 링크 */}
            {formData.slackUrls?.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">Slack</h4>
                <div className="space-y-1.5">
                  {formData.slackUrls.filter(Boolean).map((url, i) => (
                    <div key={i} className="flex items-center gap-2 flex-wrap">
                      <a href={url.replace(/^https:\/\//, 'slack://')} rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors">앱</a>
                      <a href={url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">웹</a>
                      <span className="text-xs text-gray-500 truncate flex-1 min-w-0">{url}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feature 메모 */}
            {formData.type === 'feature' && formData.note && (
              <div>
                <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">메모</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-200">{formData.note}</p>
              </div>
            )}

            {/* Todo 메모 */}
            {formData.type === 'todo' && formData.note && (
              <div>
                <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">메모</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-200">{formData.note}</p>
              </div>
            )}

            {/* 이력 */}
            {(() => {
              const taskHistory = activityLogs.filter(l => l.taskId === formData.id);
              if (taskHistory.length === 0) return null;
              return (
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">이력</h4>
                  <ul className="space-y-1.5">
                    {taskHistory.slice(0, 20).map(log => (
                      <li key={log.id} className="flex items-start gap-2 text-xs p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${ACTIVITY_STYLE[log.action] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {ACTIVITY_LABEL[log.action] || log.action}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-gray-700">{log.who_name || '미상'}</span>
                            {(log.before !== undefined || log.after !== undefined) && (
                              <span className="text-gray-500">
                                <span className="bg-white px-1 py-0.5 rounded border border-gray-200">{String(log.before ?? '-')}</span>
                                <span className="mx-1 text-gray-400">→</span>
                                <span className="bg-blue-50 text-blue-700 px-1 py-0.5 rounded border border-blue-200 font-bold">{String(log.after ?? '-')}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">{formatLogDate(log.when)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // EDIT / CREATE MODE
  // ═══════════════════════════════════════
  return (
    <div onClick={handleOverlay} className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4 animate-fade-in">
      <div className="bg-white md:rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col h-full md:h-auto md:max-h-[90vh] animate-fade-in-up">

        {/* 헤더 */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 bg-gray-50/50 md:rounded-t-3xl shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-black text-gray-900">
              {isCreateMode ? '새 일정 등록' : '태스크 수정'}
            </h2>
            <p className="text-xs font-bold text-gray-500 mt-1">
              {isCreateMode ? '업무 세부 정보와 일정을 입력하세요.' : '내용을 수정하고 저장하세요.'}
            </p>
          </div>
          <button onClick={safeClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors">
            <XIcon />
          </button>
        </div>

        {/* 폼 본문 */}
        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 md:space-y-6">

          {/* ── 기본 정보 ── */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-blue-600 border-b border-gray-100 pb-2">기본 정보</h3>

            {/* 프로젝트 드롭다운 */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">프로젝트</label>
              <select value={formData.project} onChange={e => set('project', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none">
                {projects?.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                <option value="CRM">CRM</option>
              </select>
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">태스크명 <span className="text-red-500">*</span></label>
              <input type="text" value={formData.title} onChange={e => set('title', e.target.value)}
                placeholder="업무명을 입력하세요"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">작업 유형</label>
                <select value={formData.type} onChange={e => set('type', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="feature">💻 기능 개발</option>
                  <option value="crm">💬 CRM / 마케팅</option>
                  <option value="todo">📝 할일</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">중요도</label>
                <select value={formData.urgency} onChange={e => set('urgency', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="high">🔥 높음</option>
                  <option value="medium">⚡ 보통</option>
                  <option value="low">🌱 낮음</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">상태</label>
                <select value={formData.status} onChange={e => set('status', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="검토중">검토중</option>
                  <option value="대기중">대기중</option>
                  <option value="진행중">진행중</option>
                  <option value="완료">완료</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── 개발 파트 (subtasks) — feature 전용 ── */}
          {formData.type === 'feature' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="text-sm font-black text-blue-600">개발 파트</h3>
              <button onClick={addSub}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                <PlusIcon size={14} /> 파트
              </button>
            </div>
            {formData.subtasks.map((s, i) => (
              <div key={s.id || i} className={`p-4 rounded-2xl border ${s.done ? 'bg-green-50/50 border-green-200' : 'bg-gray-50/50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold">
                      <input type="checkbox" checked={!!s.done} onChange={e => setSub(i, 'done', e.target.checked)}
                        className="w-4 h-4 text-green-600 rounded" />
                      <span className={s.done ? 'text-green-600' : 'text-gray-400'}>완료</span>
                    </label>
                  </div>
                  {formData.subtasks.length > 1 && (
                    <button onClick={() => rmSub(i)} className="text-gray-400 hover:text-red-500 transition-colors text-sm">×</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">역할</label>
                    <select value={s.role} onChange={e => setSub(i, 'role', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold outline-none">
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">담당자</label>
                    <select value={memberIdFromLegacy(s.dev_id, team)} onChange={e => setSub(i, 'dev_id', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold outline-none">
                      <option value="">미배정</option>
                      {team.filter(t => t.role !== 'PM').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">시작</label>
                    <input type="date" value={s.start} onChange={e => setSub(i, 'start', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">종료</label>
                    <input type="date" value={s.end} onChange={e => setSub(i, 'end', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold outline-none" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* ── QA — feature 전용 ── */}
          {formData.type === 'feature' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
              <button onClick={() => set('hasQa', !formData.hasQa)}
                className={`w-10 h-6 rounded-full relative transition-colors ${formData.hasQa ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${formData.hasQa ? 'left-5' : 'left-1'}`} />
              </button>
              <h3 className="text-sm font-black text-blue-600">QA 기간</h3>
            </div>
            {formData.hasQa && (
              <div className={`p-4 rounded-2xl border ${formData.qaDone ? 'bg-green-50/50 border-green-200' : 'bg-emerald-50/30 border-emerald-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-emerald-700">QA 일정</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold">
                    <input type="checkbox" checked={!!formData.qaDone} onChange={e => set('qaDone', e.target.checked)}
                      className="w-4 h-4 text-green-600 rounded" />
                    <span className={formData.qaDone ? 'text-green-600' : 'text-gray-400'}>완료</span>
                  </label>
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-bold text-emerald-600 mb-1">QA 담당</label>
                  <select value={memberIdFromLegacy(formData.qa_dev_id, team)} onChange={e => set('qa_dev_id', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm font-bold outline-none">
                    <option value="">미배정</option>
                    {team.filter(t => t.role === 'QA').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-emerald-600 mb-1">QA 시작</label>
                    <input type="date" value={formData.qa_start} onChange={e => set('qa_start', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm font-bold outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-600 mb-1">QA 종료</label>
                    <input type="date" value={formData.qa_end} onChange={e => set('qa_end', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm font-bold outline-none" />
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {/* ── 배포 일정 ── */}
          {formData.type === 'feature' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h3 className="text-sm font-black text-blue-600">배포 일정 (태스크)</h3>
                <button onClick={addDep}
                  className="text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                  <PlusIcon size={14} /> 배포
                </button>
              </div>
              {formData.deploys.map((d, i) => (
                <div key={d.id || i} className="flex gap-2 items-end flex-wrap p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-20">
                    <label className="block text-xs font-bold text-gray-500 mb-1">환경</label>
                    <select value={d.env} onChange={e => setDep(i, 'env', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none">
                      <option value="STG">STG</option>
                      <option value="PRD">PRD</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[130px]">
                    <label className="block text-xs font-bold text-gray-500 mb-1">날짜</label>
                    <input type="date" value={d.date} onChange={e => setDep(i, 'date', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none" />
                  </div>
                  <div className="w-20">
                    <label className="block text-xs font-bold text-gray-500 mb-1">상태</label>
                    <select value={d.status} onChange={e => setDep(i, 'status', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none">
                      <option value="scheduled">예정</option>
                      <option value="deployed">완료</option>
                      <option value="rollback">롤백</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[80px]">
                    <label className="block text-xs font-bold text-gray-500 mb-1">메모</label>
                    <input value={d.note} onChange={e => setDep(i, 'note', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none" placeholder="메모" />
                  </div>
                  <button onClick={() => rmDep(i)} className="text-gray-400 hover:text-red-500 transition-colors pb-1.5 text-lg">×</button>
                </div>
              ))}
            </div>
          )}

          {/* ── 메모 — feature 전용 ── */}
          {formData.type === 'feature' && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-blue-600 border-b border-gray-100 pb-2">메모</h3>
              <textarea value={formData.note || ''} onChange={e => set('note', e.target.value)}
                rows={3}
                placeholder="담당자 전달 사항, 작업 관련 메모 등"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
            </div>
          )}

          {/* ── CRM 전용 ── */}
          {formData.type === 'crm' && (
            <div className="space-y-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
              <h3 className="text-sm font-black text-indigo-800 border-b border-indigo-100 pb-2">CRM 발송 상세 정보</h3>

              {/* 기간 일괄 생성 토글 (create 모드에서만) */}
              {isCreateMode && (
                <div className="flex items-center gap-3 bg-indigo-100/60 px-3 py-2.5 rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={crmBulkMode} onChange={e => setCrmBulkMode(e.target.checked)}
                      className="w-4 h-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-xs font-bold text-indigo-700">기간 일괄 생성</span>
                  </label>
                  {crmBulkMode && <span className="text-[10px] text-indigo-500">날짜별로 태스크가 자동 생성됩니다</span>}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-indigo-600 mb-1.5">{crmBulkMode ? '시작일' : '날짜'}</label>
                  <input type="date" value={formData.subtasks?.[0]?.start || ''} onChange={e => {
                    const date = e.target.value;
                    if (formData.subtasks?.length > 0) { setSub(0, 'start', date); setSub(0, 'end', date); }
                    if (crmBulkMode && date > crmBulkEnd) setCrmBulkEnd(date);
                  }}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold outline-none" />
                </div>
                {crmBulkMode && (
                  <div>
                    <label className="block text-xs font-bold text-indigo-600 mb-1.5">종료일</label>
                    <input type="date" value={crmBulkEnd} onChange={e => setCrmBulkEnd(e.target.value)}
                      min={formData.subtasks?.[0]?.start || TODAY}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold outline-none" />
                  </div>
                )}
                {!crmBulkMode && (
                  <div>
                    <label className="block text-xs font-bold text-indigo-600 mb-1.5">담당자</label>
                    <select value={getMemberName(formData.subtasks?.[0]?.dev_id)} onChange={e => { if (formData.subtasks?.length > 0) setSub(0, 'dev_id', e.target.value); }}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold outline-none">
                      <option value="">미배정</option>
                      {team.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {crmBulkMode && (
                <div>
                  <label className="block text-xs font-bold text-indigo-600 mb-1.5">담당자</label>
                  <select value={getMemberName(formData.subtasks?.[0]?.dev_id)} onChange={e => { if (formData.subtasks?.length > 0) setSub(0, 'dev_id', e.target.value); }}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold outline-none">
                    <option value="">미배정</option>
                    {team.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-indigo-600 mb-1.5">발송 채널</label>
                  <select value={formData.channel} onChange={e => set('channel', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold outline-none">
                    <option value="kakao">카카오 알림톡</option>
                    <option value="push">앱 푸시</option>
                    <option value="sms">문자 (SMS/LMS)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-600 mb-1.5">예상 타겟 수</label>
                  <input type="number" value={formData.expected_count || ''} onChange={e => set('expected_count', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-600 mb-1.5">예상 전환율 (%)</label>
                  <input type="number" step="0.1" value={formData.conversion_rate || ''} onChange={e => set('conversion_rate', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold outline-none" />
                </div>
              </div>
              {formData.expected_count > 0 && formData.conversion_rate > 0 && (
                <div className="bg-indigo-100/60 p-3 rounded-xl flex items-center gap-3">
                  <span className="text-xs font-bold text-indigo-600">예상 유입</span>
                  <span className="text-base font-black text-indigo-800">
                    {Math.round(formData.expected_count * formData.conversion_rate / 100).toLocaleString()}명
                  </span>
                  <span className="text-xs text-indigo-500">
                    ({formData.expected_count.toLocaleString()} × {formData.conversion_rate}%)
                  </span>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-indigo-600 mb-1.5">메모</label>
                <input type="text" value={formData.note} onChange={e => set('note', e.target.value)}
                  placeholder="타겟 조건, 발송 메모 등"
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold outline-none" />
              </div>
            </div>
          )}

          {/* ── Todo 전용 ── */}
          {formData.type === 'todo' && (
            <div className="space-y-4 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
              <h3 className="text-sm font-black text-amber-800 border-b border-amber-100 pb-2">할일 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-amber-600 mb-1.5">시작일</label>
                  <input type="date" value={formData.subtasks?.[0]?.start || ''} onChange={e => {
                    const date = e.target.value;
                    if (formData.subtasks?.length > 0) {
                      setSub(0, 'start', date);
                      // 종료일이 시작일보다 이전이면 시작일로 맞춤
                      if (formData.subtasks[0].end && date > formData.subtasks[0].end) {
                        setSub(0, 'end', date);
                      }
                    }
                  }}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs font-bold outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-600 mb-1.5">종료일</label>
                  <input type="date" value={formData.subtasks?.[0]?.end || ''} onChange={e => {
                    const date = e.target.value;
                    if (formData.subtasks?.length > 0) {
                      setSub(0, 'end', date);
                      // 시작일이 종료일보다 이후이면 종료일로 맞춤
                      if (formData.subtasks[0].start && date < formData.subtasks[0].start) {
                        setSub(0, 'start', date);
                      }
                    }
                  }}
                    min={formData.subtasks?.[0]?.start || ''}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs font-bold outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-600 mb-1.5">담당자</label>
                  <select value={getMemberName(formData.subtasks?.[0]?.dev_id)} onChange={e => { if (formData.subtasks?.length > 0) setSub(0, 'dev_id', e.target.value); }}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs font-bold outline-none">
                    <option value="">미배정</option>
                    {team.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-600 mb-1.5">메모</label>
                <input type="text" value={formData.note} onChange={e => set('note', e.target.value)}
                  placeholder="메모"
                  className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs font-bold outline-none" />
              </div>
            </div>
          )}

          {/* ── 외부 링크 — 공통 ── */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-gray-500 border-b border-gray-100 pb-2">외부 링크</h3>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-500">Jira 이슈</label>
                <button type="button" onClick={() => set('jiraUrls', [...(formData.jiraUrls || []), ''])}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800">+ 추가</button>
              </div>
              {(formData.jiraUrls?.length > 0 ? formData.jiraUrls : ['']).map((url, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input type="url" value={url} onChange={e => {
                    const urls = [...(formData.jiraUrls?.length > 0 ? formData.jiraUrls : [''])];
                    urls[i] = e.target.value;
                    set('jiraUrls', urls);
                  }}
                    placeholder="https://yourteam.atlassian.net/browse/PROJ-123"
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  {(formData.jiraUrls?.length > 1 || i > 0) && (
                    <button type="button" onClick={() => {
                      const urls = [...(formData.jiraUrls || [])].filter((_, j) => j !== i);
                      set('jiraUrls', urls.length > 0 ? urls : ['']);
                    }} className="text-gray-400 hover:text-red-500 text-lg px-1">×</button>
                  )}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-500">Slack 스레드</label>
                <button type="button" onClick={() => set('slackUrls', [...(formData.slackUrls || []), ''])}
                  className="text-[10px] font-bold text-purple-600 hover:text-purple-800">+ 추가</button>
              </div>
              {(formData.slackUrls?.length > 0 ? formData.slackUrls : ['']).map((url, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input type="url" value={url} onChange={e => {
                    const urls = [...(formData.slackUrls?.length > 0 ? formData.slackUrls : [''])];
                    urls[i] = e.target.value;
                    set('slackUrls', urls);
                  }}
                    placeholder="https://yourteam.slack.com/archives/C.../p..."
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none" />
                  {(formData.slackUrls?.length > 1 || i > 0) && (
                    <button type="button" onClick={() => {
                      const urls = [...(formData.slackUrls || [])].filter((_, j) => j !== i);
                      set('slackUrls', urls.length > 0 ? urls : ['']);
                    }} className="text-gray-400 hover:text-red-500 text-lg px-1">×</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-4 md:p-5 border-t border-gray-100 bg-gray-50/80 md:rounded-b-3xl flex justify-between items-center shrink-0">
          <div>
            {isEditMode && !confirmDelete && (
              <button onClick={() => setConfirmDelete(true)}
                className="px-4 py-2 text-xs font-bold text-red-500 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">
                삭제
              </button>
            )}
            {isEditMode && confirmDelete && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-500 font-bold">정말 삭제?</span>
                <button onClick={() => onDelete(formData.id)}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">확인</button>
                <button onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg">취소</button>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={safeClose}
              className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors shadow-sm">
              취소
            </button>
            <button onClick={handleSubmit}
              className="px-6 py-2.5 text-sm font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/30 flex items-center gap-2">
              <SaveIcon size={18} /> {isCreateMode && crmBulkMode && formData.type === 'crm' ? '일괄 생성' : isCreateMode ? '등록' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
