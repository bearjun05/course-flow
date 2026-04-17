# 2️⃣ API 요청/응답 스키마 정의 플랜

> 백엔드 개발자가 API와 DB를 만들기 전에 **어떤 데이터가 오고 가는지**를 문서로 고정한다.
> 이 문서가 완성되면 자연스럽게 DB 테이블 필드 리스트가 확정됨.

---

## 왜 필요한가

- 지금 프론트의 `mock-data.ts`는 형태 예시일 뿐, 공식 계약이 아님
- 담당자 필드만 해도 "쉼표 문자열이냐 배열이냐"가 문서에 없음
- 백엔드 개발자가 문서만 보고 DB 스키마를 짜려면, Request/Response가 먼저 확정되어야 함
- API 스키마 = DB 스키마의 설계도 (필드가 곧 컬럼 후보)

---

## 산출물

### 📄 `docs/policies/API-스키마.md` (신규 문서)

아래 섹션 순서로 작성:

1. **엔티티 정의** (타입별 필드 명세)
2. **공통 규칙** (날짜 포맷, ID 규칙, null vs 빈 배열, 에러 응답 형식)
3. **엔드포인트 명세** (Request / Response / 에러)

---

## 엔티티 스키마 (각 필드: 이름 / 타입 / 필수 / 기본값 / 설명)

### User
- `id: string` (UUID or slug)
- `name: string`
- `email: string`
- `role: "pm" | "curriculumManager" | "tutor" | "editor" | "subtitleEditor" | "reviewer"`
- `slackUserId?: string` (알림 멘션용)

### Project
- `id: string`
- `title: string`
- `version: string` ("v1.0", "v2.0" 형식)
- `status: ProjectStatus` (기획/교안/촬영/편집·검수/완료/중단)
- `suspendedFromStatus?: ProjectStatus` (중단 직전 상태)
- `trafficLight: "green" | "yellow" | "red"`
- `businessUnit: "KDT" | "KDC" | "신사업"` (+ KDT일 때 `trackName`, 기타일 때 `businessUnitOther`)
- `pm: string[]` (복수 허용)
- `tutors: string[]`
- `editors: string[]`
- `subtitleEditors: string[]`
- `reviewers: string[]`
- `curriculumManagers: string[]`
- `chapterCount: number`
- `chapterTitles: string[]` (index = chapter - 1)
- `chapterDurations: number[]` (시간 단위, 소수점 허용)
- `chapterDriveLinks: string[]` (Drive 폴더 URL)
- `rolloutDate: string` (ISO 8601 날짜, `YYYY-MM-DD`)
- `paymentDate: string`
- `createdAt: string` (ISO datetime)
- `updatedAt: string`
- `driveRootUrl?: string` (강의 루트 폴더)
- `slackChannelId?: string`
- `slackChannelName?: string`
- `lessonPlanLink?: string` (커리큘럼 링크)
- `note?: string`
- `tasks: Task[]` (또는 별도 조회)
- `lectures: Lecture[]` (또는 별도 조회)

### Task
- `id: string`
- `projectId: string`
- `chapter: number`
- `taskType: "교안제작" | "커리큘럼 기획" | "촬영" | "편집" | "자막" | "검수" | "승인"`
- `status: "대기" | "진행" | "완료"`
- `startDate: string`
- `endDate: string`
- `assignees: string[]` (이 태스크 전용 담당자, 기본은 프로젝트 전체 역할과 동일)

### Lecture (강)
- `id: string`
- `projectId: string`
- `chapter: number`
- `lectureNumber: number`
- `title: string`
- `lessonPlanUrl?: string`
- `rawVideoUrl?: string`
- `editedVideoUrl?: string`
- `subtitleUrl?: string`
- `summaryNoteUrl?: string`
- `reviewed: boolean`
- `approved: boolean`

### 공통 규칙
- 날짜: 날짜만은 `YYYY-MM-DD`, 시각 포함은 ISO 8601 UTC
- 복수 필드는 **항상 배열** (0명이면 `[]`, null 금지)
- 에러 응답: `{ error: { code: string, message: string, details?: any } }`

---

## 엔드포인트 명세

각 엔드포인트마다 다음 4개를 명시:
1. Method + URL
2. Request body (JSON 스키마)
3. Response body (성공 / 실패)
4. 권한 (어떤 role이 호출 가능)

### 작성 대상 엔드포인트 (백엔드-할일.md에서 옮겨옴)

**Projects**
- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects` (제작 요청 폼 제출)
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/projects/:id/suspend`
- `POST /api/projects/:id/resume`
- `POST /api/projects/:id/planning/complete` (커리큘럼 + 장/강 일괄 등록)

**Tasks**
- `PATCH /api/tasks/:id` (상태 변경)
- `PATCH /api/tasks/:id/dates` (일정 드래그 저장)

**Lectures**
- `PATCH /api/lectures/:id/review` (검수자)
- `PATCH /api/lectures/:id/approval` (PM)
- `PATCH /api/lectures/:id/lesson-plan` (커기매)

**Chapters**
- `POST /api/projects/:id/chapters` (장 추가)
- `PATCH /api/projects/:id/chapters/:ch`
- `DELETE /api/projects/:id/chapters/:ch`

**External**
- `GET /api/external/courses?q=` (리뉴얼용 기존 강의 검색)
- `GET /api/slack/channels?q=`
- `GET /api/slack/channels/:id/members`
- `POST /api/drive/upload-webhook` (Drive 감지)

**Auth**
- `POST /api/auth/login`
- `GET /api/auth/me`

---

## 작업 순서

1. **엔티티 스키마 먼저 확정** (위 내용을 `API-스키마.md`에 문서화)
2. **엔드포인트 하나씩 Request/Response 작성** (우선순위: Projects → Tasks → Lectures → Chapters → External)
3. **최종 정리** 후 `README.md`에서 링크
4. 필요하면 OpenAPI(Swagger) 형식으로도 내보내기 (선택)

---

## 완성 기준

- 백엔드 개발자가 문서만 보고 DB 테이블과 API를 1:1로 만들 수 있어야 함
- "이 필드가 null이어도 되나요?" 같은 질문이 안 나와야 함
- 프론트 mock 데이터와 문서가 일치해야 함

---

## 이후 연결

- 이 문서 확정 후 `lib/types.ts`를 문서에 맞춰 재정렬 (담당자 배열화 포함)
- `mock-data.ts`도 새 스키마에 맞춰 업데이트
- `백엔드-할일.md`의 API 섹션을 이 문서로 대체 또는 링크
