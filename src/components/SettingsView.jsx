// src/components/SettingsView.jsx
import React, { useState } from 'react';

const ROLE_OPTIONS = ['PM', 'Backend', 'Frontend', 'QA', 'Design', '세무기획'];

const uid = () => Math.random().toString(36).substr(2, 9);

const I = ({ d, size = 18, className = '', sw = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);
const PlusIcon = p => <I {...p} d={<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>} />;
const EditIcon = p => <I {...p} d={<><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></>} />;
const TrashIcon = p => <I {...p} d={<><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></>} />;
const SaveIcon = p => <I {...p} d={<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></>} />;
const XIcon = p => <I {...p} d="M18 6 6 18M6 6l12 12" />;

const ROLE_COLORS = {
  PM: 'bg-purple-100 text-purple-700',
  Backend: 'bg-blue-100 text-blue-700',
  Frontend: 'bg-green-100 text-green-700',
  QA: 'bg-amber-100 text-amber-700',
  Design: 'bg-pink-100 text-pink-700',
};

const getDefaultForm = () => ({ name: '', role: 'Frontend', email: '' });

export default function SettingsView({ team, onSaveMember, onDeleteMember }) {
  const [editingId, setEditingId] = useState(null); // null = 새 등록, id = 수정 중
  const [formData, setFormData] = useState(null); // null = 폼 닫힘
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const openCreate = () => {
    setEditingId(null);
    setFormData(getDefaultForm());
  };

  const openEdit = (member) => {
    setEditingId(member.id);
    setFormData({ name: member.name, role: member.role, email: member.email || '' });
  };

  const closeForm = () => {
    setFormData(null);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return alert('이름을 입력해주세요.');
    const id = editingId || uid();
    onSaveMember({ id, name: formData.name.trim(), role: formData.role, email: formData.email.trim() });
    closeForm();
  };

  const set = (k, v) => setFormData(prev => ({ ...prev, [k]: v }));

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC] p-4 md:p-8 h-screen animate-fade-in custom-scrollbar">
      <div className="flex justify-between items-center mb-5 md:mb-8 shrink-0 ml-10 md:ml-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">설정</h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1 md:mt-1.5 font-medium">팀원을 관리하고 계정 정보를 등록하세요.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-bold px-3 md:px-4 py-2 md:py-2.5 rounded-xl transition-colors shadow-md"
        >
          <PlusIcon size={16} /> 팀원 추가
        </button>
      </div>

      {/* 팀원 등록/수정 폼 */}
      {formData !== null && (
        <div className="bg-white rounded-2xl border border-blue-200 shadow-md p-4 md:p-6 mb-5 md:mb-6 animate-fade-in-up">
          <div className="flex justify-between items-center mb-4 md:mb-5">
            <h3 className="text-base font-black text-gray-900">{editingId ? '팀원 수정' : '새 팀원 등록'}</h3>
            <button onClick={closeForm} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"><XIcon size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 md:mb-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">이름 <span className="text-red-500">*</span></label>
              <input
                type="text" value={formData.name} onChange={e => set('name', e.target.value)}
                placeholder="예) 홍길동"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">직무</label>
              <select
                value={formData.role} onChange={e => set('role', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">이메일 <span className="text-gray-400 font-normal">(로그인 매칭용)</span></label>
              <input
                type="email" value={formData.email} onChange={e => set('email', e.target.value)}
                placeholder="예) hong@jobis.co"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={closeForm} className="px-5 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">취소</button>
            <button onClick={handleSubmit} className="px-5 py-2 text-sm font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2">
              <SaveIcon size={14} /> {editingId ? '수정' : '등록'}
            </button>
          </div>
        </div>
      )}

      {/* 데스크톱 팀원 테이블 */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <div className="col-span-3">이름</div>
          <div className="col-span-2">직무</div>
          <div className="col-span-5">이메일</div>
          <div className="col-span-2 text-right">관리</div>
        </div>
        <div className="divide-y divide-gray-100">
          {team.map(member => (
            <div key={member.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
              <div className="col-span-3">
                <p className="text-sm font-bold text-gray-900">{member.name}</p>
              </div>
              <div className="col-span-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${ROLE_COLORS[member.role] || 'bg-gray-100 text-gray-600'}`}>
                  {member.role}
                </span>
              </div>
              <div className="col-span-5">
                <p className="text-sm text-gray-500 font-medium">{member.email || <span className="text-gray-300 italic">미등록</span>}</p>
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <button onClick={() => openEdit(member)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><EditIcon size={15} /></button>
                {confirmDeleteId === member.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => { onDeleteMember(member.id); setConfirmDeleteId(null); }} className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded transition-colors">확인</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors">취소</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(member.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><TrashIcon size={15} /></button>
                )}
              </div>
            </div>
          ))}
          {team.length === 0 && (
            <div className="p-12 text-center text-gray-400 font-bold">등록된 팀원이 없습니다.</div>
          )}
        </div>
      </div>

      {/* 모바일 팀원 카드 */}
      <div className="md:hidden space-y-3">
        {team.map(member => (
          <div key={member.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-gray-900">{member.name}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${ROLE_COLORS[member.role] || 'bg-gray-100 text-gray-600'}`}>
                  {member.role}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => openEdit(member)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><EditIcon size={14} /></button>
                {confirmDeleteId === member.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => { onDeleteMember(member.id); setConfirmDeleteId(null); }} className="text-[10px] font-bold text-white bg-red-500 px-2 py-1 rounded">확인</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">취소</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(member.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><TrashIcon size={14} /></button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500">{member.email || <span className="text-gray-300 italic">이메일 미등록</span>}</p>
          </div>
        ))}
        {team.length === 0 && (
          <div className="p-12 text-center text-gray-400 font-bold bg-white rounded-xl border border-gray-200">등록된 팀원이 없습니다.</div>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-400 font-medium">
        * 이메일은 Google 로그인 시 팀원 계정 자동 매칭에 사용됩니다.
      </p>
    </div>
  );
}
