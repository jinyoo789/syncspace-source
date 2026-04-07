// src/components/Sidebar.jsx
import React from 'react';

// 사이드바 전용 아이콘 모음
const I = ({d, size=18, className='', sw=2}) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>{typeof d==='string'?<path d={d}/>:d}</svg>);
const Icons = {
  CalendarDays: p => <I {...p} d={<><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></>} />,
  Sun: p => <I {...p} d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></>} />,
  UserCircle: p => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></>} />,
  Users: p => <I {...p} d={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />,
  Briefcase: p => <I {...p} d={<><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>} />,
  ListTodo: p => <I {...p} d={<><rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><line x1="13" y1="6" x2="21" y2="6"/><line x1="13" y1="12" x2="21" y2="12"/><line x1="13" y1="18" x2="21" y2="18"/></>} />,
  Archive: p => <I {...p} d={<><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></>} />,
  CheckSquare: p => <I {...p} d={<><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>} />, // 지난 업무용 새 아이콘
  LogOut: p => <I {...p} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>} />,
  Settings: p => <I {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>} />,
  Timeline: p => <I {...p} d={<><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></>} />,
  History: p => <I {...p} d={<><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></>} />
};

// 메뉴 항목 렌더링용 작은 컴포넌트
const NavItem = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
      active ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`}
  >
    {icon}
    {label}
  </button>
);

export default function Sidebar({ currentView, setCurrentView, loggedInUser, setLoggedInUser, onSignOut, mobileOpen, onMobileClose }) {
  return (
    <>
    {/* 모바일 오버레이 */}
    {mobileOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={onMobileClose} />}
    <div className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static z-50 md:z-auto transition-transform duration-200 w-64 bg-gray-900 text-white flex flex-col h-screen shrink-0 border-r border-gray-800`}>
      <div className="p-6 font-bold text-xl tracking-wider flex items-center gap-2 border-b border-gray-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-inner">
          <Icons.CalendarDays size={18} className="text-white"/>
        </div>
        SyncSpace
      </div>
      
      <div className="flex-1 px-4 space-y-1.5 overflow-y-auto py-6 custom-scrollbar">
        <p className="px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Workspace</p>
        <NavItem icon={<Icons.Sun size={18}/>} label="오늘의 일정" active={currentView === 'today'} onClick={() => setCurrentView('today')} />
        {loggedInUser ? (
          <NavItem icon={<Icons.UserCircle size={18}/>} label="내 작업" active={currentView === 'mytask'} onClick={() => setCurrentView('mytask')} />
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs text-gray-600 cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => setCurrentView('settings')}>
            <Icons.UserCircle size={18} className="text-gray-600 shrink-0" />
            <span>내 작업 <span className="text-gray-500">(설정에서 이메일 등록 필요)</span></span>
          </div>
        )}
        
        <p className="px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3 mt-8">Team</p>
        <NavItem icon={<Icons.CalendarDays size={18}/>} label="전체 캘린더" active={currentView === 'calendar'} onClick={() => setCurrentView('calendar')} />
        <NavItem icon={<Icons.Timeline size={18}/>} label="타임라인" active={currentView === 'timeline'} onClick={() => setCurrentView('timeline')} />
        <NavItem icon={<Icons.Users size={18}/>} label="팀원 현황" active={currentView === 'team'} onClick={() => setCurrentView('team')} />
        
        <p className="px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3 mt-8">Projects & Tasks</p>
        <NavItem icon={<Icons.Briefcase size={18}/>} label="프로젝트" active={currentView === 'projects'} onClick={() => setCurrentView('projects')} />
        <NavItem icon={<Icons.ListTodo size={18}/>} label="일반 업무" active={currentView === 'general'} onClick={() => setCurrentView('general')} />
        <NavItem icon={<Icons.Archive size={18}/>} label="지난 프로젝트" active={currentView === 'past_projects'} onClick={() => setCurrentView('past_projects')} />
        <NavItem icon={<Icons.CheckSquare size={18}/>} label="지난 업무" active={currentView === 'past_tasks'} onClick={() => setCurrentView('past_tasks')} />

        <p className="px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3 mt-8">Audit</p>
        <NavItem icon={<Icons.History size={18}/>} label="활동 기록" active={currentView === 'activity'} onClick={() => setCurrentView('activity')} />
      </div>

      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        <div className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-800 rounded-xl transition-colors group cursor-pointer border border-transparent hover:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${loggedInUser ? 'bg-blue-100 text-blue-700' : 'bg-gray-700 text-gray-400'}`}>
              {loggedInUser?.name ? loggedInUser.name.charAt(0) : '?'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-100">{loggedInUser?.name || '미등록'}</span>
              <span className="text-[10px] text-gray-500 font-medium">{loggedInUser ? (loggedInUser.role || 'Member') : '설정에서 이메일 등록 필요'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button onClick={() => setCurrentView('settings')} className="text-gray-500 hover:text-white transition-colors bg-gray-800 p-1.5 rounded-lg"><Icons.Settings size={14}/></button>
            <button onClick={onSignOut} className="text-gray-500 hover:text-white transition-colors bg-gray-800 p-1.5 rounded-lg"><Icons.LogOut size={14}/></button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}