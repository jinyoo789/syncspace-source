// src/components/ProjectView.jsx
import React, { useState, useEffect } from 'react';
import { formatDateFull, getTaskAssignees, getTaskDateRange, formatDateDot } from '../utils';
import AddButton from './AddButton';
const I = ({ d, size = 18, className = '', sw = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);
const PlusIcon = p => <I {...p} d={<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>} />;
const XIcon = p => <I {...p} d="M18 6 6 18M6 6l12 12" />;
const RocketIcon = p => <I {...p} d={<><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></>} />;
const CheckCircleIcon = p => <I {...p} d={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>} />;

const AVATAR_COLORS = ['bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700'];
const Avatar = ({ name }) => {
  const h = name ? name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
  return <div title={name} className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white -ml-2 first:ml-0 shadow-sm ${AVATAR_COLORS[h % AVATAR_COLORS.length]}`}>{name.charAt(0)}</div>;
};

export default function ProjectView({ projects, tasks, onOpenModal }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [pmFilter, setPmFilter] = useState('전체');

  const pms = ['전체', ...new Set(projects.map(p => p.pm).filter(Boolean))];
  const filteredProjects = pmFilter === '전체' ? projects : projects.filter(proj => proj.pm === pmFilter);

  // ESC 키
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setSelectedProject(null); };
    if (selectedProject) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedProject]);

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC] p-4 md:p-8 h-screen animate-fade-in custom-scrollbar relative">
      <div className="flex justify-between items-center mb-5 md:mb-8 shrink-0 ml-10 md:ml-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">프로젝트</h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1 md:mt-1.5 font-medium">진행 중인 프로젝트의 진척도와 일정을 확인하세요.</p>
        </div>
        <AddButton onSelect={(type) => onOpenModal && onOpenModal(null, 'create', type)} />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {filteredProjects.map(proj => {
          const pt = tasks.filter(t => t.project === proj.name);
          const progress = pt.length === 0 ? 0 : Math.round((pt.filter(t => t.status === '완료').length / pt.length) * 100);
          const deploys = proj.deploys || [];
          const stgDeploy = deploys.find(d => d.env === 'STG');
          const prdDeploy = deploys.find(d => d.env === 'PRD');
          const rejectedTasks = pt.filter(t => t.status === '반려');

          // 프로젝트에 관련된 모든 사람 수집 (PM 포함)
          const allMembers = new Set();
          if (proj.pm) allMembers.add(proj.pm);
          pt.forEach(t => getTaskAssignees(t).forEach(n => allMembers.add(n)));
          const members = [...allMembers];

          return (
            <div key={proj.id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedProject(proj)}>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <RocketIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{proj.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {proj.service && <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md">{proj.service}</span>}
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-md">{proj.status || '진행중'}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">{proj.priority}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-5 flex-1 line-clamp-2 cursor-pointer" onClick={() => setSelectedProject(proj)}>
                {proj.desc || '프로젝트 상세 설명이 없습니다.'}
              </p>

              {/* 진척도 */}
              <div className="mb-5 cursor-pointer" onClick={() => setSelectedProject(proj)}>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-gray-600">진척도 ({pt.filter(t => t.status === '완료').length}/{pt.length})</span>
                  <span className="text-blue-600">{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* 배포 일정 */}
              <div className="flex flex-col gap-2 mb-5 text-xs font-medium text-gray-600">
                {stgDeploy && (
                  <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                    <span className="text-yellow-600 font-bold">STG</span>
                    <span className="font-bold text-gray-800">{formatDateFull(stgDeploy.date)}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${stgDeploy.status === 'deployed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {stgDeploy.status === 'deployed' ? '완료' : '예정'}
                    </span>
                  </div>
                )}
                {prdDeploy && (
                  <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                    <span className="text-red-500 font-bold">PRD</span>
                    <span className="font-bold text-gray-800">{formatDateFull(prdDeploy.date)}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${prdDeploy.status === 'deployed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {prdDeploy.status === 'deployed' ? '완료' : '예정'}
                    </span>
                  </div>
                )}
                {!stgDeploy && !prdDeploy && (
                  <div className="text-center text-gray-400 py-2 text-[10px]">배포 일정 미등록</div>
                )}
              </div>

              {/* 재배정 필요 (반려된 작업) */}
              {rejectedTasks.length > 0 && (
                <div className="mb-5 bg-rose-50/60 border border-rose-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <h4 className="text-[11px] font-black text-rose-700 uppercase tracking-wide">재배정 필요 {rejectedTasks.length}건</h4>
                  </div>
                  <div className="space-y-1.5">
                    {rejectedTasks.map(t => {
                      const prevAssignees = getTaskAssignees(t);
                      return (
                        <div
                          key={t.id}
                          onClick={(e) => { e.stopPropagation(); onOpenModal && onOpenModal(t, 'edit'); }}
                          className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-rose-100 cursor-pointer hover:border-rose-300 hover:shadow-sm transition-all"
                        >
                          <span className="text-xs font-bold text-gray-800 truncate flex-1">{t.title}</span>
                          {prevAssignees.length > 0 && (
                            <span className="text-[9px] text-gray-400 shrink-0">
                              이전: {prevAssignees.join(', ')}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 하단 */}
              <div className="pt-4 border-t border-gray-100 flex justify-between items-center mt-auto">
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
                <button onClick={() => onOpenModal && onOpenModal(proj, 'view', 'project')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-4 py-2 rounded-xl shrink-0 ml-2">
                  상세 보기
                </button>
              </div>
            </div>
          );
        })}
      </div>


    </div>
  );
}
