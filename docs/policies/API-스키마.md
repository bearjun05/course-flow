# API 스키마 문서

> 백엔드 개발자가 DB 테이블과 API를 설계할 때의 공식 계약서.
> 프론트의 `lib/types.ts`와 `lib/mock-data.ts`는 이 문서의 예시 구현체.
>
> 관련 문서:
> - 비즈니스 룰: `정책-초안.md`
> - 백엔드 구현 체크리스트: `백엔드-할일.md`

---

## 공통 규칙

### 날짜/시각 포맷
- 날짜만: `YYYY-MM-DD` (예: `"2026-04-17"`)
- 시각 포함: ISO 8601 UTC (예: `"2026-04-17T09:30:00.000Z"`)
- 시간대는 서버·DB 모두 UTC. 클라이언트가 표시 시 Asia/Seoul로 변환.

### ID
- 모든 엔티티 ID는 `string` (UUID 권장)
- 클라이언트 임시 ID(폼 입력 중)와 서버 발급 ID를 구분 필요

### 배열/Null
- **복수 필드는 항상 배열**, 0명이면 `[]`. `null` 금지.
  - 예: `tutors: []` (O), `tutors: null` (X)
- 단일 선택 문자열 필드의 "선택 안 함"은 `undefined` (JSON에서는 키 자체 생략)

### 에러 응답
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "사용자에게 보여줄 한글 메시지",
    "details": { "field": "title", "reason": "required" }
  }
}
```

### 인증
- 모든 요청에 `Authorization: Bearer <JWT>` 헤더
- JWT payload에 `userId`, `role` 포함
- 별도 명시 없으면 모든 엔드포인트는 인증 필수

### 권한 표기
각 엔드포인트에 **호출 가능 role** 명시:
- `pm` / `curriculumManager` / `tutor` / `editor` / `subtitleEditor` / `reviewer`
- `*` = 모든 인증 사용자
- 특정 조건(예: "해당 프로젝트 담당자만")이 있으면 별도 명시

---

## 1. 엔티티 스키마

### User

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `id` | string | ✅ | - | 서버 발급 UUID |
| `name` | string | ✅ | - | 한글 실명 (예: "김태경") |
| `email` | string | ✅ | - | 로그인 이메일 |
| `role` | UserRole | ✅ | - | 아래 enum |
| `slackUserId` | string | - | - | 슬랙 멘션용 ID (예: `U01ABC123`) |
| `createdAt` | datetime | ✅ | - | |

```ts
type UserRole =
  | "pm"
  | "curriculumManager"
  | "tutor"
  | "editor"
  | "subtitleEditor"
  | "reviewer";
```

**접근 영역**:
- `pm`, `curriculumManager` → 에듀옵스(`/`)
- `tutor`, `editor`, `subtitleEditor`, `reviewer` → 에듀웍스(`/eduworks`)

---

### Project

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `id` | string | ✅ | - | UUID |
| `title` | string | ✅ | - | 강의명 (수정 가능, 변경 시 Drive/슬랙 동기화) |
| `version` | string | ✅ | `"v1.0"` | 예: `"v1.0"`, `"v2.0"`. 리뉴얼 시 자동 증가 |
| `status` | ProjectStatus | ✅ | `"기획"` | 아래 enum |
| `suspendedFromStatus` | ProjectStatus | - | - | 중단 직전 상태 (재개 시 복구용) |
| `trafficLight` | TrafficLight | ✅ | `"green"` | PM 수동 조작만 |
| `businessUnit` | BusinessUnit | ✅ | - | `"KDT"` / `"KDC"` / `"기타"` |
| `trackName` | string | - | - | KDT일 때만 (예: "데이터분석") |
| `businessUnitOther` | string | - | - | 기타일 때 직접 입력값 |
| `productionType` | ProductionType | ✅ | - | `"신규"` / `"리뉴얼"` |
| `renewalType` | RenewalType | - | - | 리뉴얼일 때 `"부분"` / `"전체"` |
| `previousCourseId` | string | - | - | 리뉴얼일 때 이전 강의 ID |
| `previousCourseTitle` | string | - | - | 리뉴얼일 때 이전 강의명 |
| `pm` | string[] | ✅ | `[]` | PM 이름 배열 (복수 허용) |
| `tutors` | string[] | ✅ | `[]` | |
| `curriculumManagers` | string[] | ✅ | `[]` | |
| `editors` | string[] | ✅ | `[]` | |
| `subtitleEditors` | string[] | ✅ | `[]` | |
| `reviewers` | string[] | ✅ | `[]` | |
| `rolloutDate` | date | ✅ | - | `YYYY-MM-DD` |
| `paymentDate` | date | ✅ | - | `YYYY-MM-DD` |
| `chapterCount` | number | ✅ | `0` | `chapterDurations.length`와 동일 |
| `chapterTitles` | string[] | ✅ | `[]` | index = chapter - 1 |
| `chapterDurations` | number[] | ✅ | `[]` | 시간 단위, 소수점 허용 (예: `1.5`) |
| `chapterDriveLinks` | string[] | ✅ | `[]` | 장별 Drive 폴더 URL |
| `driveRootUrl` | string | - | - | 강의 루트 폴더 URL |
| `lessonPlanLink` | string | - | - | 커리큘럼 링크 (노션/구글닥) |
| `slackChannel` | string | - | - | 채널명 (예: "콘텐츠_강의제작_xxx") |
| `slackChannelId` | string | - | - | 채널 ID |
| `backofficeLink` | string | - | - | 백오피스 페이지 URL |
| `note` | string | - | `""` | 자유 메모 |
| `hidden` | boolean | ✅ | `false` | 숨김 처리 |
| `createdAt` | datetime | ✅ | - | |
| `updatedAt` | datetime | ✅ | - | |

```ts
type ProjectStatus = "기획" | "교안" | "촬영" | "편집·검수" | "완료" | "중단";
type TrafficLight = "green" | "yellow" | "red";
type BusinessUnit = "KDT" | "KDC" | "기타";
type ProductionType = "신규" | "리뉴얼";
type RenewalType = "부분" | "전체";
```

**관계**:
- `Project` 1:N `Task` (`projectId`로 조회)
- `Project` 1:N `Lecture` (`projectId`로 조회)
- 담당자 필드들은 별도 `ProjectAssignment` 테이블로 정규화하는 것도 고려 가능

---

### Task (장별 공정 태스크)

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `id` | string | ✅ | - | UUID |
| `projectId` | string | ✅ | - | FK |
| `chapter` | number | ✅ | - | 1부터 시작 |
| `taskType` | TaskType | ✅ | - | 아래 enum |
| `status` | TaskStatus | ✅ | `"대기"` | |
| `startDate` | date | - | - | 일정 드래그로 수정 |
| `endDate` | date | - | - | |
| `assignees` | string[] | ✅ | `[]` | 이 태스크만의 담당자 (기본은 프로젝트 역할과 동일) |
| `note` | string | - | - | |

```ts
type TaskType =
  | "교안제작"
  | "커리큘럼 기획"
  | "촬영"
  | "편집"
  | "자막"
  | "검수"
  | "승인";

type TaskStatus = "대기" | "진행" | "리뷰" | "완료";
```

**생성 규칙**:
- 기획 완료 모달 제출 시 장별로 `["교안제작", "촬영", "편집", "자막", "검수", "승인"]` 6개 태스크 자동 생성
- `"커리큘럼 기획"`은 프로젝트당 1개 (장과 무관, `chapter = 0`)

**편집·자막 합침 표시**:
- UI에서는 "편집·자막" 한 단계로 표시하지만, 내부 데이터는 `편집` + `자막` 두 개로 저장
- 두 태스크 모두 `status === "완료"`여야 "편집·자막" 단계가 완료로 인식됨

---

### Lecture (강)

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `id` | string | ✅ | - | UUID |
| `projectId` | string | ✅ | - | FK |
| `chapter` | number | ✅ | - | 소속 장 (1부터) |
| `lectureNumber` | number | ✅ | - | 장 내 순서 (1부터) |
| `label` | string | ✅ | - | `"${chapter}-${lectureNumber}"` (예: `"1-1"`) |
| `title` | string | - | - | 강 제목 (기획 모달에서 입력) |
| `lessonPlanUrl` | string | - | - | 교안 링크 (커기매가 등록) |
| `rawVideoUrl` | string | - | - | 원본 영상 (Drive 자동 감지) |
| `editedVideoUrl` | string | - | - | 편집 영상 (Drive 자동 감지) |
| `subtitleUrl` | string | - | - | 자막 (Drive 자동 감지) |
| `summaryNoteUrl` | string | - | - | 요약노트 (Drive 자동 감지) |
| `reviewUrl` | string | - | - | 백오피스 검수 페이지 |
| `reviewed` | boolean | ✅ | `false` | 검수자가 체크 토글 |
| `approved` | boolean | ✅ | `false` | PM이 체크 토글 |

---

## 2. 엔드포인트 명세

### 2.1 Auth

#### `POST /api/auth/login`
- Request: `{ email: string, password: string }`
- Response (200): `{ token: string, user: User }`
- Response (401): 에러 응답
- 권한: 비인증 허용

#### `GET /api/auth/me`
- Response (200): `{ user: User }`
- 권한: `*`

---

### 2.2 Projects

#### `GET /api/projects`
- Query: `?status=기획,교안&hidden=false&person=김태경`
- Response (200):
  ```json
  {
    "projects": [ /* Project[] */ ],
    "total": 42
  }
  ```
- 권한:
  - `pm`, `curriculumManager`: 전체 조회
  - 외부 역할: 본인이 배정된 프로젝트만 반환 (서버가 자동 필터)

#### `GET /api/projects/:id`
- Response (200): `{ project: Project }`
- 404: 존재하지 않거나 접근 권한 없음
- 권한:
  - `pm`, `curriculumManager`: 모두
  - 외부 역할: 본인 배정된 경우만

#### `POST /api/projects` (제작 요청 폼 제출)
- Request:
  ```json
  {
    "title": "실시간 채팅 아키텍처",
    "tutorAssigned": "yes",
    "tutorName": "김태경",
    "businessUnit": "KDT",
    "trackName": "데이터분석",
    "productionType": "신규",
    "rolloutDate": "2026-06-01",
    "paymentDate": "2026-05-25",
    "estimatedDuration": 20,
    "estimatedChapters": 5,
    "hasCurriculum": "yes",
    "curriculumLink": "https://notion.so/...",
    "needSchedule": "no",
    "conceptDescription": null
  }
  ```
  - 리뉴얼일 경우 추가 필드: `renewalType`, `previousCourseId`, `previousCourseTitle`, `nextVersion`
- Response (201): `{ project: Project }` (생성된 프로젝트)
- 서버 동작:
  1. `status = "기획"`, `version = "v1.0"` (신규) 또는 `previousVersion + 1` (리뉴얼)
  2. Drive 폴더 생성: `{강의명}/{강의명}_{version}/`
  3. 슬랙 채널 매핑은 PM이 나중에 수동
- 권한: `pm`, `curriculumManager`

#### `PATCH /api/projects/:id`
- Request: `Partial<Project>` — 변경할 필드만
- Response (200): `{ project: Project }`
- 서버 동작:
  - `title` 변경 시 Drive 폴더명 + 슬랙 채널명 + 백오피스 동기화
  - `status` 변경 시 이벤트 로그 기록
- 권한:
  - 대부분 필드: `pm`
  - `trafficLight`: `pm` 전용 (수동 조작만)
  - `reviewed` 토글은 이 엔드포인트 아님 (Lecture 전용)

#### `DELETE /api/projects/:id`
- Response (204)
- 서버 동작: Drive 폴더명에 ` (deprecated)` 추가. DB는 soft-delete (hidden=true)
- 권한: `pm`

#### `POST /api/projects/:id/suspend`
- Request: 없음
- Response (200): `{ project: Project }` — `status: "중단"`, `suspendedFromStatus: <기존>`
- 권한: `pm`

#### `POST /api/projects/:id/resume`
- Response (200): `{ project: Project }` — `status: <suspendedFromStatus>`, `suspendedFromStatus: null`
- 권한: `pm`

#### `POST /api/projects/:id/planning/complete`
- Request:
  ```json
  {
    "curriculumLink": "https://notion.so/...",
    "chapters": [
      {
        "title": "1장 제목",
        "duration": 2.5,
        "lectures": [
          { "title": "1-1 강 제목" },
          { "title": "1-2 강 제목" }
        ]
      }
    ]
  }
  ```
- Response (200): `{ project: Project }` (tasks + lectures + chapterDriveLinks 포함)
- 서버 동작:
  1. 장별로 `["교안제작", "촬영", "편집", "자막", "검수", "승인"]` 6개 Task 생성
  2. 강별 Lecture 생성
  3. Drive에 장 폴더 + 5개 하위 폴더 생성
  4. `project.status = "교안"`, `chapterDurations/Titles/DriveLinks` 채움
- 권한: `pm`

---

### 2.3 Tasks

#### `PATCH /api/tasks/:id`
- Request: `{ status?: TaskStatus, assignees?: string[], note?: string }`
- Response (200): `{ task: Task }`
- 서버 동작:
  - `status` 변경 시 순서 강제 검증 (외부 역할만, PM은 예외)
  - `status === "완료"`로 변경 시 자동 전이 체인 트리거 (슬랙 알림 등)
  - 되돌리기(완료 → 진행)일 때: 이후 단계 Task들을 모두 `대기`로 연쇄 해제
- 권한:
  - `pm`: 모든 태스크 자유롭게
  - 각 역할: 본인 태스크 타입만 (예: `editor`는 `"편집"`만)

#### `PATCH /api/tasks/:id/dates`
- Request: `{ startDate: string, endDate: string }`
- Response (200): `{ task: Task }`
- 권한: `pm`

---

### 2.4 Lectures

#### `PATCH /api/lectures/:id/review`
- Request: `{ reviewed: boolean }`
- Response (200): `{ lecture: Lecture }`
- 권한: `reviewer` (본인 배정된 프로젝트 한정)

#### `PATCH /api/lectures/:id/approval`
- Request: `{ approved: boolean }`
- Response (200): `{ lecture: Lecture }`
- 서버 동작:
  - 모든 강이 `approved=true`가 되면 프로젝트 상태를 자동 `"완료"`로 전환
- 권한: `pm`

#### `PATCH /api/lectures/:id/lesson-plan`
- Request: `{ lessonPlanUrl: string }`
- Response (200): `{ lecture: Lecture }`
- 서버 동작:
  - 해당 장의 모든 강이 `lessonPlanUrl`을 갖게 되면 "교안 → 촬영" 자동 전이
  - 슬랙 "교안 제작 완료" 메시지 발송
- 권한: `curriculumManager`

---

### 2.5 Chapters (장 추가/수정/삭제)

#### `POST /api/projects/:id/chapters`
- Request: `{ title: string, duration: number, lectures: { title: string }[] }`
- Response (200): `{ project: Project }` (태스크/강/Drive 폴더 포함 갱신)
- 서버 동작: 새 장 번호 = 기존 최대 + 1. Drive 폴더 추가 생성.
- 권한: `pm`

#### `PATCH /api/projects/:id/chapters/:chapter`
- Request: `{ title?: string, duration?: number }`
- Response (200): `{ project: Project }`
- `title` 변경 시 Drive 폴더명 동기화
- 권한: `pm`

#### `DELETE /api/projects/:id/chapters/:chapter`
- Response (200): `{ project: Project }` (이후 장 번호들 앞으로 당겨짐)
- 권한: `pm`

---

### 2.6 External

#### `GET /api/external/courses?q=:keyword`
- 용도: 제작 요청 폼 리뉴얼 분기에서 기존 강의 검색
- Response (200): `{ courses: [{ id, title, latestVersion }] }`
- 권한: `pm`, `curriculumManager`

#### `GET /api/slack/channels?q=:keyword`
- Response (200): `{ channels: [{ id, name }] }`
- 권한: `pm`

#### `GET /api/slack/channels/:id/members`
- Response (200): `{ members: [{ slackUserId, name }] }`
- 권한: `pm`

---

### 2.7 Drive Webhook

#### `POST /api/drive/upload-webhook`
- 용도: Google Drive Push Notification 수신
- 인증: Google 서명 검증 (Bearer 아님)
- Request: Google Drive API Watch 이벤트 바디
- 서버 동작:
  1. 파일 경로 파싱해서 프로젝트/장/강 식별
  2. 파일명 정규식 검증 (`N-N_(m)_요청사항` 등)
  3. 해당 Lecture의 URL 필드 자동 갱신
  4. 전이 조건 만족 시 Task 상태 "완료"로 전환 + 슬랙 알림
- Response (200): `{ ok: true }`

---

## 3. 자동 전이 이벤트 (서버 내부)

프론트에서 직접 호출하지 않지만, 서버가 내부적으로 트리거해야 하는 이벤트:

| 트리거 | 조건 | 동작 |
|--------|------|------|
| 교안 → 촬영 | 장의 모든 강에 `lessonPlanUrl` 등록 | Task 상태 변경 + 슬랙 "교안 제작 완료" |
| 촬영 → 편집·자막 | `01.원본영상`에 강별 파일 업로드 감지 | Task 상태 + 슬랙 "촬영 완료" |
| 편집·자막 → 검수 | `03.최종영상` + `04.최종자막` 모두 감지 | Task 상태 + 슬랙 "편집·자막 완료" |
| 검수 완료 (수동) | 검수자 체크 토글 | 슬랙 "검수 완료" + 승인 단계 활성 |
| 승인 완료 (수동) | PM 체크 토글 | 슬랙 "승인 완료" |
| 프로젝트 완료 | 모든 강이 `approved=true` | `status = "완료"` 자동 전환 |

---

## 4. 프론트 mock과의 매핑

현재 프론트(`lib/mock-data.ts`)는 담당자 필드를 `tutor: string` (쉼표 구분 문자열)로 저장. 백엔드 마이그레이션 시:

| 현재 프론트 | 백엔드 API |
|------------|-----------|
| `tutor: "김태경,강태경"` | `tutors: ["김태경", "강태경"]` |
| `editor: ""` (빈 문자열) | `editors: []` |
| `reviewer: "박진영"` | `reviewers: ["박진영"]` |

백엔드 작업 순서:
1. API 스키마 이대로 구현
2. 프론트 `types.ts` 배열 타입으로 수정
3. 쉼표 구분 로직(`parseAssigneeNames`) 제거

---

## 5. 미정 사항

- Drive API 감지 주기 (Push vs 폴링) — 백엔드 결정
- 파일명 정규식 상세 — 백엔드 결정
- 인증 토큰 만료/갱신 정책 — 백엔드 결정
- 파일 업로드 중복/실패 처리 — 백엔드 결정

→ `백엔드-할일.md` 및 `미결정-정책.md` 참고.
