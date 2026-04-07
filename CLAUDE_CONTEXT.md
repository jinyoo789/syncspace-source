# SyncSpace 프로젝트 컨텍스트 (Claude 인수인계용)

## 프로젝트 개요
- **이름**: SyncSpace — 팀 프로젝트 관리 웹앱
- **기술스택**: React 18 + Vite 5 + Tailwind CSS 3 (CDN 아닌 빌드 방식)
- **로컬 경로**: `C:\Users\USER\Desktop\work\syncspace`
- **배포**: GitHub Pages → `https://jinyoo789.github.io/SyncSpace/`
- **GitHub repo**: `https://github.com/jinyoo789/SyncSpace` (main 브랜치에 dist 내용물 배포)
- **배포용 클론 경로**: `C:\Users\USER\Desktop\work\syncspace-git` (dist 결과물만 push하는 용도)
- **빌드 명령**: `npm run build` → `dist/` 폴더 생성
- **개발 서버**: `npm run dev` → `http://localhost:5173/`
- **데이터 저장**: Firebase Firestore 연동 완료 (실시간 onSnapshot)
- **인증**: Firebase Auth (Google 로그인, jobis.co 계정만 허용)

## 사용자 정보
- **이름**: 진 (유진) — PM
- **회사**: jobis.co (대기열/핀테크 서비스)
- **환경**: Windows, Antigravity(Windsurf)/VSCode, PowerShell 터미널
- **참고**: `rm -rf` 안 됨, `Remove-Item` 사용 필요

## 배포 프로세스
1. `syncspace` 폴더에서 소스 수정 & `npm run build`
2. `syncspace-git` 폴더에서:
   ```powershell
   Get-ChildItem -Exclude .git | Remove-Item -Recurse -Force
   Copy-Item -Path ..\syncspace\dist\* -Destination . -Recurse
   git add .
   git commit -m "커밋 메시지"
   git push
   ```
3. 1~2분 후 GitHub Pages에 반영

## vite.config.js 주의사항
- `base: '/SyncSpace/'` — 대문자 S 필수 (GitHub repo 이름과 일치해야 함)

## 데이터 모델

### Task
```
{
  id, title, project (프로젝트명),
  type: 'feature' | 'crm' | 'todo',
  status: '검토중' | '대기중' | '진행중' | '완료',
  urgency: 'high' | 'medium' | 'low',
  note: '',  // 메모 (feature/crm/todo 모두 사용)
  subtasks: [{ id, role:'BE'|'FE'|'QA'|'Design', dev_id, start, end, done }],
  hasQa, qa_dev_id, qa_start, qa_end, qaDone,
  deploys: [{ id, env:'STG'|'PRD', date, status:'scheduled'|'deployed'|'rollback', note }],
  // CRM 전용:
  channel, expected_count, conversion_rate,
  image  // CRM 이미지 (base64)
}
```

### Project
```
{
  id, name, service (서비스명), status, pm, priority, desc,
  deploys: [{ id, env, date, status, note }]
}
```

### 팀 구성 (10명)
- PM: 유진
- Backend: 허정화, 박우진
- Frontend: 김희중, 이진수, 조승희, 이진우
- QA: 안소영, TQA셈괵, 문세윤

### 프로젝트 목록 (9개)
대기열v3, 소득인증서, 사전스크래핑#1/#2, 리펀드대기열, 기타, 대기열v4, 미정, 기타완료

## 주요 파일 구조
```
src/
├── App.jsx          # Firebase 연동 + 전역 상태 관리
├── firebase.js      # Firebase 초기화 (Auth + Firestore)
├── utils.js         # 공통 유틸리티 (날짜/태스크 헬퍼)
├── constants.js     # CATEGORIES, ROLES, SEED_TEAM
├── main.jsx         # 엔트리포인트
├── index.css        # Tailwind 기본 스타일
├── App.css          # 앱 커스텀 스타일
└── components/
    ├── Sidebar.jsx          # 사이드바 네비게이션
    ├── LoginPage.jsx        # Google 로그인 (jobis.co 계정 제한)
    ├── TodayView.jsx        # 오늘의 일정 (메인 대시보드)
    ├── KanbanBoard.jsx      # 내 작업 (칸반 보드)
    ├── CalendarView.jsx     # 전체 캘린더
    ├── TeamView.jsx         # 팀원 현황
    ├── ProjectView.jsx      # 프로젝트 상세
    ├── GeneralTaskView.jsx  # 일반 업무 목록 (CRM + 할일만, feature 제외)
    ├── TimelineView.jsx     # 타임라인/간트
    ├── PastTasksView.jsx    # 지난 업무
    ├── PastProjectsView.jsx # 지난 프로젝트
    ├── TaskModal.jsx        # 태스크 보기/수정/생성 모달 (3모드: view/edit/create)
    ├── ProjectModal.jsx     # 프로젝트 보기/수정/생성 모달
    ├── SettingsView.jsx     # 설정 (팀원 CRUD: 이름/직무/이메일)
    ├── AddButton.jsx        # +등록 드롭다운 (태스크/CRM/할일)
    └── DateNav.jsx          # 날짜 네비게이션 공통 컴포넌트
```

## 완료된 작업 (Phase 1~3 + Round 1~4)

### Phase 1-3: 데이터 모델 + TaskModal + 뷰 컴포넌트 전면 재작성 ✅
### Round 1: 검토중 상태, 하루상태, 태스크 배포 표시 ✅
### Round 2: AddButton 드롭다운, 서비스명, 폼분리 ✅
### Round 3: view 모달 담당자 중복 제거, feature 메모 필드 추가 ✅
### Round 4: Firebase Firestore 연동, Google 인증(jobis.co 계정 제한), 프로젝트 CRUD (ProjectModal) ✅

## UX/UI 설계 결정사항
- **뷰별 클릭 동작**:
  - 내 작업(칸반): 바로 edit 모달
  - 나머지 뷰: view 모달 → "수정" 버튼으로 edit 전환
- **등록 UX**: AddButton 드롭다운으로 유형 선택 후 해당 폼 모달
- **태스크 상태 흐름**: 검토중 → 대기중 → 진행중 → 완료

## Round 5 작업 목록 (진행 순서대로)

1. **[GeneralTaskView] 개발 업무 제외** — feature 타입은 프로젝트 뷰에 있으므로 일반 업무에서 제외
2. **[ProjectView] 카드에 담당자 이름 표시** — 아바타 이니셜 대신 이름 텍스트로 표시
3. **[PastProjectsView] 카드 클릭 → 상세 모달 + 담당자 표시** — ProjectModal view 모드 연결
4. **[KanbanBoard] 검토중 작업 날짜 알림 배너** — 내 검토중 태스크가 있을 때 최早 날짜 + 바로가기 버튼
5. **[CalendarView] 디폴트 뷰를 주간으로 변경**
6. **[CalendarView] 주간 뷰에 담당자 이름 표시**
7. **[TimelineView] 담당자 이름 표시 버그 수정**
8. **[TimelineView] 완료 작업 숨김 토글 버튼 추가**
9. **[SettingsView + Sidebar] 설정 메뉴 신규** — 팀원 CRUD (이름/직무/이메일), Firebase 연동
10. **[CalendarView] 월간 뷰에서 연속 날짜 업무 bar 형태로 표시**

## PENDING 작업

### 우선순위 높음
1. **배포** — Round 5 완료 후 GitHub Pages에 최신 빌드 반영

### 보류/취소
- **CRM 이미지 첨부** — Firebase Blaze(유료) 플랜 필요하여 보류
- **gh-pages 자동 배포** — 현재 수동 dist 복사 방식 유지

## 실제 운영 데이터
- 사용자가 올린 JSON 데이터 참조 (tasks 22개, devs 10명, projects 9개, crms 12개, logs 다수)
- 이 데이터를 App.jsx의 시드 데이터에 반영하거나, Firebase 연동 후 직접 입력 예정
