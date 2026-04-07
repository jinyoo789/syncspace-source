// src/components/DateNav.jsx — 날짜 좌우 이동 공통 컴포넌트
import React from 'react';

const I = ({ d, size = 18, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

/**
 * DateNav — 날짜 선택 + 좌/우 이동 + "오늘" 버튼
 * @param {string} value - "YYYY-MM-DD"
 * @param {function} onChange - (newDateStr) => void
 * @param {string} [className] - 래퍼 추가 className
 */
export default function DateNav({ value, onChange, className = '' }) {
  const moveDay = (step) => {
    const d = new Date(value + 'T00:00:00');
    d.setDate(d.getDate() + step);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    onChange(iso);
  };

  const goToday = () => {
    const d = new Date();
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    onChange(iso);
  };

  return (
    <div className={`flex items-center gap-1.5 md:gap-2 bg-white p-1 md:p-1.5 rounded-xl border border-gray-200 shadow-sm ${className}`}>
      <button onClick={() => moveDay(-1)}
        className="p-1 md:p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-800"
        title="전날">
        <I d="M15 18l-6-6 6-6" size={16} />
      </button>
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="px-1 md:px-2 py-1 text-xs md:text-sm font-bold text-gray-700 outline-none bg-transparent cursor-pointer min-w-[110px] md:min-w-[130px]"
      />
      <button onClick={() => moveDay(1)}
        className="p-1 md:p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-800"
        title="다음날">
        <I d="M9 18l6-6-6-6" size={16} />
      </button>
      <div className="w-px h-5 bg-gray-200" />
      <button onClick={goToday}
        className="px-2 md:px-3 py-1 text-[11px] md:text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
        오늘
      </button>
    </div>
  );
}
