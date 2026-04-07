// src/components/AddButton.jsx — 등록 유형 선택 드롭다운 버튼
import React, { useState, useRef, useEffect } from 'react';

const I = ({ d, size = 18, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);
const PlusIcon = p => <I {...p} d={<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>} />;

/**
 * AddButton — + 등록 버튼 클릭 시 드롭다운(태스크/CRM·일정/할일) 표시
 * @param {function} onSelect - (type: 'feature'|'crm'|'todo') => void
 */
export default function AddButton({ onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const items = [
    { type: 'project', label: '프로젝트', icon: '🚀', color: 'text-purple-600' },
    { type: 'feature', label: '태스크 (기능 개발)', icon: '💻', color: 'text-blue-600' },
    { type: 'crm', label: 'CRM / 일정', icon: '💬', color: 'text-indigo-600' },
    { type: 'todo', label: '할일', icon: '📝', color: 'text-amber-600' },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-2 md:px-5 md:py-2.5 bg-blue-600 text-white text-xs md:text-sm font-bold rounded-lg md:rounded-xl hover:bg-blue-700 shadow-md flex items-center gap-1.5 md:gap-2 transition-transform hover:-translate-y-0.5"
      >
        <PlusIcon size={16} /> <span className="hidden md:inline">등록</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-30 min-w-[180px] animate-fade-in">
          {items.map(item => (
            <button
              key={item.type}
              onClick={() => { onSelect(item.type); setOpen(false); }}
              className="w-full px-4 py-3 text-left text-sm font-bold text-gray-800 hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0"
            >
              <span className="text-base">{item.icon}</span>
              <span className={item.color}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
