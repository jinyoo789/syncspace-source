// src/components/PastProjectsView.jsx
import React, { useState } from 'react';
import { formatDateFull, getTaskAssignees } from '../utils';

const I = ({ d, size = 18, className = '', sw = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);
const CheckCircleIcon = p => <I {...p} d={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>} />;

export default function PastProjectsView({ projects, tasks, onOpenModal }) {
  const [pmFilter, setPmFilter] = useState('전체');

  const pms = ['전체', ...new Set(projects.map(p => p.pm).filter(Boolean))];
  const pastProjects = projects.filter(p => p.status === '완료').filter(p => pmFilter === '전체' || p.pm === pmFilter);

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC] p-4 md:p-8 h-screen animate-fade-in custom-scrollbar">
      <div className="mb-5 md:mb-8 shrink-0 ml-10 md:ml-0">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">지난 프로젝트</h1>
        <p className="text-gray-500 text-xs md:text-sm mt-1 md:mt-1.5 font-medium">완료된 프로젝트를 확인합니다.</p>
      </div>

      {/* PM 필터 */}
      <div className="flex items-center gap-2 mb-5 md:mb-6 shrink-0 flex-wrap">
        {pms.map(pm => (
          <button key={pm} onClick={() => setPmFilter(pm)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              pmFilter === pm ? 'bg-gray-800 text-white border-gray-800 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}>
            {pm}
          </button>
        ))}
      </div>

      {pastProjects.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {pastProjects.map(proj => {
            const pt = tasks.filter(t => t.project === proj.name);

            // 담당자 수집
            const allMembers = new Set();
            pt.forEach(t => getTaskAssignees(t).forEach(n => allMembers.add(n)));
            const members = [...allMembers];

            return (
              <div
                key={proj.id}
                onClick={() => onOpenModal && onOpenModal(proj, 'view', 'project')}
                className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm opacity-80 hover:opacity-100 hover:shadow-md transition-all cursor-pointer flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                    <CheckCircleIcon size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-700">{proj.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {proj.service && <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md">{proj.service}</span>}
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-md">완료</span>
                    </div>
                  </div>
                </div>

                {proj.desc && (
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">{proj.desc}</p>
                )}

                <div className="flex flex-col gap-2 mb-4 text-xs font-medium text-gray-600">
                  {(proj.deploys || []).map((d, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                      <span className={`font-bold ${d.env === 'PRD' ? 'text-red-500' : 'text-yellow-600'}`}>{d.env} 배포</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700">{formatDateFull(d.date)}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          d.status === 'deployed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {d.status === 'deployed' ? '완료' : '예정'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100 mt-auto flex justify-between items-center">
                  <div className="flex flex-wrap gap-1">
                    {members.slice(0, 5).map((m, i) => (
                      <span key={i} className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md border border-gray-200">{m}</span>
                    ))}
                    {members.length > 5 && (
                      <span className="relative group/tip text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-400 rounded-md border border-gray-200 cursor-default">
                        +{members.length - 5}
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tip:block bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap z-20">
                          {members.slice(5).join(', ')}
                        </span>
                      </span>
                    )}
                    {members.length === 0 && <span className="text-[10px] text-gray-400">담당자 없음</span>}
                  </div>
                  <p className="text-xs font-bold text-gray-400 shrink-0 ml-2">태스크 {pt.length}건</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-sm">
          <p className="text-gray-400 font-bold">완료된 프로젝트가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
