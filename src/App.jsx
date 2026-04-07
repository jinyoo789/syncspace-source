// src/App.jsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import LoginPage from './components/LoginPage';
import { CATEGORIES, ROLES, SEED_TEAM } from './constants';
import { setLiveTeam, getTaskAssignees, getTaskDateRange } from './utils';
import Sidebar from './components/Sidebar';
import KanbanBoard from './components/KanbanBoard';
import TeamView from './components/TeamView';
import CalendarView from './components/CalendarView';
import ProjectView from './components/ProjectView';
import GeneralTaskView from './components/GeneralTaskView';
import TodayView from './components/TodayView';
import PastTasksView from './components/PastTasksView';
import PastProjectsView from './components/PastProjectsView';
import TimelineView from './components/TimelineView';
import ActivityLogView from './components/ActivityLogView';
import ProjectModal from './components/ProjectModal';
import TaskModal from './components/TaskModal';
import SettingsView from './components/SettingsView';

export default function App() {
  const [currentView, setCurrentView] = useState('today');
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [team, setTeam] = useState(SEED_TEAM); // Firestore team 컬렉션으로 관리
  const [loggedInUser, setLoggedInUser] = useState(null); // 이메일 매칭 전까지는 null
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(undefined); // undefined = 로딩중, null = 미로그인
  const [activityLogs, setActivityLogs] = useState([]);

  // Firebase Auth 상태 감지
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!firebaseUser) return; // 로그인 전엔 Firestore 구독 안 함

    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const dbTasks = snapshot.docs.map(doc => ({ ...doc.data() }));
      setTasks(dbTasks);
      setIsLoading(false);
    });

    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const dbProjects = snapshot.docs.map(doc => ({ ...doc.data() }));
      setProjects(dbProjects);
    });

    const unsubTeam = onSnapshot(collection(db, 'team'), (snapshot) => {
      const dbTeam = snapshot.docs.map(doc => ({ ...doc.data() }));
      if (dbTeam.length > 0) setTeam(dbTeam);

      // Firestore team에서 이메일로 매칭, 없으면 null
      if (firebaseUser?.email) {
        const matched = dbTeam.find(m => m.email === firebaseUser.email);
        setLoggedInUser(matched || null);
      }
    });

    const unsubLog = onSnapshot(
      query(collection(db, 'activity_log'), orderBy('when', 'desc'), limit(500)),
      (snapshot) => {
        setActivityLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    return () => {
      unsubTasks();
      unsubProjects();
      unsubTeam();
      unsubLog();
    };
  }, [firebaseUser]);
  // team이 바뀌면 utils의 런타임 팀 데이터 갱신
  useEffect(() => { setLiveTeam(team); }, [team]);

  // 팀원별 날짜별 상태 { "유진": { "2026-04-02": "바쁨" }, ... }
  const [dailyStatus, setDailyStatus] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'
  const [createType, setCreateType] = useState('feature'); // 새 등록 시 유형

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProjectModal, setSelectedProjectModal] = useState(null);
  const [projectModalMode, setProjectModalMode] = useState('create');

  const openModal = (item = null, mode = null, type = null) => {
    if (type === 'project' || (item && item.priority && item.pm !== undefined && type === 'project')) {
      setSelectedProjectModal(item);
      setProjectModalMode(mode || 'create');
      setIsProjectModalOpen(true);
      return;
    }
    
    if (item) {
      setSelectedTask(item);
      setModalMode(mode || 'view');
    } else {
      setSelectedTask(null);
      setModalMode('create');
      if (type) setCreateType(type);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedTask(null);
    setIsModalOpen(false);
    setModalMode('create');
  };

  const closeProjectModal = () => {
    setSelectedProjectModal(null);
    setIsProjectModalOpen(false);
    setProjectModalMode('create');
  };

  // ─── 활동 로그 헬퍼 ───
  const logActivity = async (entry) => {
    try {
      await addDoc(collection(db, 'activity_log'), {
        ...entry,
        when: serverTimestamp(),
        who_id: loggedInUser?.id || '',
        who_name: loggedInUser?.name || (firebaseUser?.email || '미상'),
      });
    } catch (e) {
      console.error('activity log failed', e);
    }
  };

  // 담당자 시그니처: subtasks의 dev_id + qa_dev_id 정렬
  const assigneeSig = (t) => {
    const ids = [
      ...(t?.subtasks || []).map(s => s?.dev_id || ''),
      t?.qa_dev_id || '',
    ].filter(Boolean).sort();
    return ids.join('|');
  };

  // 일정 시그니처: subtasks의 start/end + qa_start/qa_end
  const scheduleSig = (t) => {
    const subs = (t?.subtasks || [])
      .map(s => `${s?.id || ''}:${s?.start || ''}-${s?.end || ''}`)
      .sort()
      .join('|');
    return `${subs}||${t?.qa_start || ''}-${t?.qa_end || ''}`;
  };

  const handleSaveTask = async (savedTask) => {
    try {
      const oldTask = tasks.find(t => t.id === savedTask.id);
      await setDoc(doc(db, 'tasks', savedTask.id), savedTask);

      const baseLog = {
        taskId: savedTask.id,
        taskTitle: savedTask.title,
        taskType: savedTask.type || 'feature',
      };

      if (!oldTask) {
        logActivity({ ...baseLog, action: 'created' });
      } else {
        if (oldTask.status !== savedTask.status) {
          logActivity({
            ...baseLog,
            action: 'status_changed',
            before: oldTask.status || '',
            after: savedTask.status || '',
          });
        }
        if (assigneeSig(oldTask) !== assigneeSig(savedTask)) {
          logActivity({
            ...baseLog,
            action: 'assignees_changed',
            before: getTaskAssignees(oldTask).join(', ') || '없음',
            after: getTaskAssignees(savedTask).join(', ') || '없음',
          });
        }
        if (scheduleSig(oldTask) !== scheduleSig(savedTask)) {
          const oldR = getTaskDateRange(oldTask);
          const newR = getTaskDateRange(savedTask);
          logActivity({
            ...baseLog,
            action: 'schedule_changed',
            before: `${oldR.start || '-'} ~ ${oldR.end || '-'}`,
            after: `${newR.start || '-'} ~ ${newR.end || '-'}`,
          });
        }
      }

      closeModal();
    } catch (error) {
      console.error("Error saving task:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  // 칸반 수락/반려 등 상태만 변경하는 단일 액션
  const handleMoveTaskStatus = async (task, newStatus) => {
    if (!task || !task.id || task.status === newStatus) return;
    try {
      const updated = { ...task, status: newStatus };
      await setDoc(doc(db, 'tasks', task.id), updated);
      logActivity({
        taskId: task.id,
        taskTitle: task.title || '',
        taskType: task.type || 'feature',
        action: 'status_changed',
        before: task.status || '',
        after: newStatus,
      });
    } catch (error) {
      console.error("Error moving task status:", error);
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("정말 이 태스크를 삭제하시겠습니까?")) {
      try {
        const oldTask = tasks.find(t => t.id === taskId);
        await deleteDoc(doc(db, 'tasks', taskId));
        if (oldTask) {
          logActivity({
            taskId,
            taskTitle: oldTask.title || '',
            taskType: oldTask.type || 'feature',
            action: 'deleted',
          });
        }
        closeModal();
      } catch (error) {
        console.error("Error deleting task:", error);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const handleSaveProject = async (savedProj) => {
    try {
      // 프로젝트 이름이 바뀌었으면 관련 태스크의 project 필드도 일괄 업데이트
      const oldProj = selectedProjectModal;
      if (oldProj && oldProj.name && oldProj.name !== savedProj.name) {
        const relatedTasks = tasks.filter(t => t.project === oldProj.name);
        await Promise.all(
          relatedTasks.map(t => setDoc(doc(db, 'tasks', t.id), { ...t, project: savedProj.name }))
        );
      }
      await setDoc(doc(db, 'projects', savedProj.id), savedProj);
      closeProjectModal();
    } catch (error) {
      console.error("Error saving project:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteProject = async (projId) => {
    if (window.confirm("정말 이 프로젝트를 삭제하시겠습니까? 연관된 태스크들은 그대로 남습니다.")) {
      try {
        await deleteDoc(doc(db, 'projects', projId));
        closeProjectModal();
      } catch (error) {
        console.error("Error deleting project:", error);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };



  const handleSaveMember = async (member) => {
    try {
      await setDoc(doc(db, 'team', member.id), member);
    } catch (error) {
      console.error("Error saving member:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteMember = async (memberId) => {
    try {
      await deleteDoc(doc(db, 'team', memberId));
    } catch (error) {
      console.error("Error deleting member:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const activeProjects = projects.filter(p => p.status !== '완료');

  // Auth 로딩 중
  if (firebaseUser === undefined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-sm">불러오는 중...</div>
      </div>
    );
  }

  // 미로그인
  if (firebaseUser === null) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans relative">
      <Sidebar currentView={currentView} setCurrentView={(v) => { setCurrentView(v); setMobileMenuOpen(false); }} loggedInUser={loggedInUser} onSignOut={() => signOut(auth)} mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      {/* 모바일 햄버거 버튼 */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-gray-900 text-white p-2.5 rounded-xl shadow-lg"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {currentView === 'today' && (
          <TodayView tasks={tasks} projects={projects} loggedInUser={loggedInUser} onOpenModal={openModal} />
        )}
        {currentView === 'general' && (
          <GeneralTaskView tasks={tasks} onOpenModal={openModal} CATEGORIES={CATEGORIES} />
        )}
        {currentView === 'projects' && (
          <ProjectView projects={activeProjects} tasks={tasks} onOpenModal={openModal} />
        )}
        {currentView === 'mytask' && (
          <KanbanBoard tasks={tasks} setTasks={setTasks} onMoveTaskStatus={handleMoveTaskStatus} loggedInUser={loggedInUser} CATEGORIES={CATEGORIES} onOpenModal={openModal} dailyStatus={dailyStatus} setDailyStatus={setDailyStatus} />
        )}
        {currentView === 'team' && (
          <TeamView team={team} tasks={tasks} CATEGORIES={CATEGORIES} onOpenModal={openModal} dailyStatus={dailyStatus} />
        )}
        {currentView === 'calendar' && (
          <CalendarView tasks={tasks} projects={projects} CATEGORIES={CATEGORIES} onOpenModal={openModal} />
        )}
        {currentView === 'past_tasks' && (
          <PastTasksView tasks={tasks} CATEGORIES={CATEGORIES} onOpenModal={openModal} />
        )}
        {currentView === 'past_projects' && (
          <PastProjectsView projects={projects} tasks={tasks} onOpenModal={openModal} />
        )}
        {currentView === 'timeline' && (
          <TimelineView tasks={tasks} projects={projects} onOpenModal={openModal} />
        )}
        {currentView === 'activity' && (
          <ActivityLogView logs={activityLogs} tasks={tasks} onOpenModal={openModal} />
        )}
        {currentView === 'settings' && (
          <SettingsView team={team} onSaveMember={handleSaveMember} onDeleteMember={handleDeleteMember} />
        )}
      </main>

      <TaskModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        CATEGORIES={CATEGORIES}
        ROLES={ROLES}
        team={team}
        projects={projects}
        initialTask={selectedTask}
        mode={modalMode}
        setMode={setModalMode}
        createType={createType}
        activityLogs={activityLogs}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={closeProjectModal}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
        team={team}
        tasks={tasks}
        initialProject={selectedProjectModal}
        mode={projectModalMode}
        setMode={setProjectModalMode}
      />
    </div>
  );
}
