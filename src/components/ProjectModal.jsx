// src/components/ProjectModal.jsx
import React, { useState, useEffect } from 'react';
import { formatDateFull, getTaskAssignees, getTaskDateRange, formatDateDot } from '../utils';

const I = ({ d, size = 18, className = '', sw = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);
const XIcon = p => <I {...p} d="M18 6 6 18M6 6l12 12" />;
const EditIcon = p => <I {...p} d={<><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></>} />;
const SaveIcon = p => <I {...p} d={<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></>} />;
const CheckCircleIcon = p => <I {...p} d={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>} />;
const PlusIcon = p => <I {...p} d={<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>} />;

const uid = () => Math.random().toString(36).substr(2, 9);
const TODAY = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();

export default function ProjectModal({
  isOpen, onClose, onSave, onDelete,
  team, tasks, initialProject, mode, setMode
}) {
  const getDefaultForm = () => ({
    name: '', service: '', pm: '', priority: 'P2', status: '대기중', desc: '', deploys: []
  });

  const [formData, setFormData] = useState(getDefaultForm());
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmDelete(false);
      if (initialProject) setFormData({ ...getDefaultForm(), ...initialProject });
      else setFormData(getDefaultForm());
    }
  }, [isOpen, initialProject]);

  const isEditing = mode === 'edit' || mode === 'create';
  const safeClose = () => {
    if (isEditing) {
      if (window.confirm('저장하지 않고 닫으시겠습니까?')) onClose();
    } else {
      onClose();
    }
  };

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') safeClose(); };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, isEditing]);

  if (!isOpen) return null;

  const set = (k, v) => setFormData(prev => ({ ...prev, [k]: v }));
  
  const addDep = () => setFormData(prev => ({
    ...prev, deploys: [...prev.deploys, { id: uid(), env: 'STG', date: TODAY, status: 'scheduled', note: '' }]
  }));
  const setDep = (i, k, v) => setFormData(prev => ({
    ...prev, deploys: prev.deploys.map((d, j) => j === i ? { ...d, [k]: v } : d)
  }));
  const rmDep = (i) => setFormData(prev => ({
    ...prev, deploys: prev.deploys.filter((_, j) => j !== i)
  }));

  const handleOverlay = (e) => { if (e.target === e.currentTarget) safeClose(); };

  const handleSubmit = () => {
    if (!formData.name) return alert('프로젝트명을 입력해주세요.');
    onSave({ ...formData, id: initialProject ? initialProject.id : uid() });
  };

  const isView = mode === 'view';
  const isCreate = mode === 'create';
  const isEdit = mode === 'edit';

  if (isView) {
    // initialProject에서 직접 name을 가져옴 (formData 세팅 전 렌더 방지)
    const projName = formData.name || initialProject?.name || '';
    const projectTasks = tasks.filter(t => t.project === projName);
    return (
      <div onClick={handleOverlay} className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4 animate-fade-in">
        <div className="bg-white md:rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col h-full md:h-auto md:max-h-[90vh] animate-fade-in-up overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50/80 flex justify-between items-start shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-1 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-md">{formData.priority}</span>
                <span className="px-2.5 py-1 text-[10px] font-bold bg-gray-200 text-gray-700 rounded-md">PM: {formData.pm || '미정'}</span>
                {formData.service && <span className="px-2.5 py-1 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-md">{formData.service}</span>}
                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${formData.status === '완료' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                  {formData.status}
                </span>
              </div>
              <h2 className="text-2xl font-black text-gray-900">{formData.name}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setMode('edit')} className="p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors">
                <EditIcon />
              </button>
              <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 rounded-full transition-colors">
                <XIcon />
              </button>
            </div>
          </div>

          <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 md:space-y-6">
            {formData.desc && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase">프로젝트 설명</h4>
                <p className="text-sm text-gray-800 bg-gray-50 p-4 rounded-xl border border-gray-100 break-keep whitespace-pre-wrap">{formData.desc}</p>
              </div>
            )}

            {(formData.deploys || []).length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase">배포 일정</h4>
                <div className="space-y-2">
                  {formData.deploys.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${d.env === 'PRD' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.env}</span>
                      <span className="text-sm font-bold text-gray-800">{formatDateFull(d.date)}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${d.status === 'deployed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {d.status === 'deployed' ? '완료' : d.status === 'rollback' ? '롤백' : '예정'}
                      </span>
                      {d.note && <span className="text-xs text-gray-500 ml-auto">{d.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase flex items-center justify-between">
                <span>연관된 작업 목록</span>
                <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px]">{projectTasks.length}건</span>
              </h4>
              <div className="space-y-2">
                {projectTasks.length > 0 ? projectTasks.map(task => {
                  const range = getTaskDateRange(task);
                  const assignees = getTaskAssignees(task);
                  return (
                    <div key={task.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {task.status === '완료' ? <CheckCircleIcon size={16} className="text-green-500 shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />}
                        <div className="min-w-0">
                          <p className={`text-sm font-bold truncate ${task.status === '완료' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{task.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {assignees.slice(0, 3).map((name, i) => (
                              <span key={i} className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1 rounded">{name}</span>
                            ))}
                            <span className="text-[9px] text-gray-400">{formatDateDot(range.start)} ~ {formatDateDot(range.end)}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-md border ml-2 ${task.status === '완료' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {task.status}
                      </span>
                    </div>
                  );
                }) : (
                  <div className="p-6 text-center text-xs font-bold text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    이 프로젝트에 등록된 작업이 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── CREATE / EDIT MODE ──
  return (
    <div onClick={handleOverlay} className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4 animate-fade-in">
      <div className="bg-white md:rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col h-full md:h-auto md:max-h-[90vh] animate-fade-in-up">

        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 bg-gray-50/50 md:rounded-t-3xl shrink-0">
          <div>
            <h2 className="text-xl font-black text-gray-900">{isCreate ? '새 프로젝트 생성' : '프로젝트 수정'}</h2>
            <p className="text-xs font-bold text-gray-500 mt-1">{isCreate ? '새로운 프로젝트 정보를 입력하세요.' : '프로젝트 정보를 수정합니다.'}</p>
          </div>
          <button onClick={safeClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"><XIcon /></button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 md:space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-black text-blue-600 border-b border-gray-100 pb-2">기본 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">프로젝트명 <span className="text-red-500">*</span></label>
                <input type="text" value={formData.name || ''} onChange={e => set('name', e.target.value)}
                  placeholder="예) 대기열 v3"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">서비스 (분류)</label>
                <input type="text" value={formData.service || ''} onChange={e => set('service', e.target.value)}
                  placeholder="예) 정부지원금"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">PM (담당자)</label>
                <select value={formData.pm || ''} onChange={e => set('pm', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">미지정</option>
                  {team.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">우선순위</label>
                <select value={formData.priority} onChange={e => set('priority', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="P1">P1 (매우 높음)</option>
                  <option value="P2">P2 (높음)</option>
                  <option value="P3">P3 (보통/낮음)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">상태</label>
                <select value={formData.status} onChange={e => set('status', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="대기중">대기중</option>
                  <option value="진행중">진행중</option>
                  <option value="완료">완료</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">설명</label>
              <textarea value={formData.desc || ''} onChange={e => set('desc', e.target.value)} rows={3} placeholder="프로젝트에 대한 설명"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="text-sm font-black text-blue-600">배포 일정 (프로젝트 전체 기준)</h3>
              <button onClick={addDep} className="text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"><PlusIcon size={14} /> 배포</button>
            </div>
            {formData.deploys.map((d, i) => (
              <div key={d.id || i} className="flex gap-2 items-end flex-wrap p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-24">
                  <label className="block text-xs font-bold text-gray-500 mb-1">환경</label>
                  <select value={d.env} onChange={e => setDep(i, 'env', e.target.value)} className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none">
                    <option value="STG">STG</option>
                    <option value="PRD">PRD</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[130px]">
                  <label className="block text-xs font-bold text-gray-500 mb-1">날짜</label>
                  <input type="date" value={d.date} onChange={e => setDep(i, 'date', e.target.value)} className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none" />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-bold text-gray-500 mb-1">상태</label>
                  <select value={d.status} onChange={e => setDep(i, 'status', e.target.value)} className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none">
                    <option value="scheduled">예정</option>
                    <option value="deployed">완료</option>
                    <option value="rollback">롤백</option>
                  </select>
                </div>
                <div className="flex-[2] min-w-[120px]">
                  <label className="block text-xs font-bold text-gray-500 mb-1">메모</label>
                  <input value={d.note} onChange={e => setDep(i, 'note', e.target.value)} placeholder="메모" className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none" />
                </div>
                <button onClick={() => rmDep(i)} className="text-gray-400 hover:text-red-500 transition-colors pb-1.5 text-lg">×</button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 md:p-5 border-t border-gray-100 bg-gray-50/80 md:rounded-b-3xl flex justify-between items-center shrink-0">
          <div>
            {isEdit && !confirmDelete && (
              <button onClick={() => setConfirmDelete(true)} className="px-4 py-2 text-xs font-bold text-red-500 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">삭제</button>
            )}
            {isEdit && confirmDelete && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-500 font-bold">정말 삭제?</span>
                <button onClick={() => onDelete(formData.id)} className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">확인</button>
                <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg">취소</button>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={safeClose} className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors shadow-sm">취소</button>
            <button onClick={handleSubmit} className="px-6 py-2.5 text-sm font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2"><SaveIcon /> {isCreate ? '생성' : '수정'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
