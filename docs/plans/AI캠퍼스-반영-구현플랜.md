# AI 캠퍼스 반영 — 상세 구현 플랜 (영향 조사 · 회귀 방지 · 테스트 포함)

> 결정 문서: [노션-강의제작시스템-에셋관리-반영.md](./노션-강의제작시스템-에셋관리-반영.md)
> 작성: 2026-06-08 · 모든 의사결정 완료. 코드 전수 조사 후 작성.
> 이 플랜은 ① 무엇을 바꾸나 ② **어떤 기존 기능이 깨질 수 있나(회귀)** ③ **검증 테스트**까지 포함합니다.

---

## 요약 (한눈에)

사업부에 **AI 캠퍼스**를 추가합니다. AI 캠퍼스 강의는 영상이 없어 **촬영·편집·자막이 빠지고**, 흐름은 `기획 → 교안 → 검수 → 승인 → 완료`. 화면에서 빠진 단계는 **옅은 회색 빗금**으로 표시(칸 정렬 유지). 함께: **장 이름 클릭 수정**, **교안 링크 업로드/교체/삭제(대시보드 안에서는 누구나)**.

⚠️ 전수 조사로 드러난 **가장 큰 위험**: 진행률 계산이 단계 수를 **고정값(7/6/4)**으로 쓰는 곳이 4군데라, 단순히 태스크만 빼면 **AI 캠퍼스 진행률이 영영 100%가 안 되거나 단계가 깨져 보입니다.** 그래서 "태스크 생성기 분기 + 진행률 분모를 사업부별 단계 수로 교정"을 핵심으로 잡고, **단위 테스트로 100% 도달을 검증**합니다.

---

## 확정된 결정 (참고)

| # | 결정 |
| --- | --- |
| **D1** | AI 캠퍼스 단계: `기획 → 교안 → 검수 → 승인 → 완료` (촬영·편집·자막 제거, 기획 유지) |
| **D2** | 강의 8자리 코드: 화면은 표시·입력만, 발급·외부연결은 **백엔드 위임** |
| **D3** | 갈래: 폼 흐름 안 바꿈. `사업부 → 트랙(KDC 없음) → 갈래 드롭다운(강의/과제/프로젝트/숙제)` |
| **D4** | 장 이름 수정: **에듀옵스 대시보드 안에서만**, 외부 읽기 전용 |
| **D5** | 교안 링크: 대시보드 안에서는 **누구나 업로드 + 교체/삭제** |
| **UI** | 비활성 단계 = **옅은 회색 빗금**, 칸 정렬 유지 |

> AI 캠퍼스 트랙: Private LLM / Fullstack AX / Data Science / On-Device / Physical / UXUI. 코드 문자열은 **"AI 캠퍼스"**(공백 포함)로 통일.

---

## 변경되는 레이어 지도 (impact map)

> 조사로 확인한, 이번 작업이 실제로 닿는 파일과 역할. 줄번호는 조사 시점 기준(구현 때 재확인).

| 레이어 | 파일 | 역할 | 이번에 닿나 |
| --- | --- | --- | --- |
| **타입(뿌리)** | `lib/types.ts` | `BusinessUnit`(:9), `ProjectStatus`(:1), `TaskType`(:15), `Project`(:38), `Lecture`(:84) | 추가 |
| **상수** | `lib/constants.ts` | `BUSINESS_UNITS`(:23), `KDT_TRACKS`(:30), `PROJECT_STATUSES`(:8), `STATUS_TO_KANBAN`(:17), `STATUS_BADGE_VARIANT`(:76 *죽은코드*) | 추가/신설 |
| **단계 로직** | `lib/process-helpers.ts` | `CHAPTER_TASK_TYPES`(:33), `getChapterDetailedStage`(:46), `getEffectiveKanbanColumn`(:9), `TASK_TYPE_TO_KANBAN`(:23 *죽은코드*) | 분기 추가 |
| **태스크 생성기 ①** | `lib/mock-data.ts` | `TASK_TYPES_PER_CHAPTER`(:9), `createChapterTasks`(:18) | **분기 (핵심)** |
| **태스크 생성기 ②** | `app/projects/[id]/page.tsx` | `TASK_TYPES_ON_PLANNING`(:81), 기획완료/장추가 시 태스크 생성(:168,:210), `chapterTitles`(:51,76,132), `handleLectureUrlChange`(:149) | **분기 + 콜백 추가** |
| **폼** | `components/form/project-request-form.tsx` | 사업부 라디오(:377-394 *하드코딩*), 트랙 분기(:397), `FormData`(:29-56), 검증(:263) | 추가 |
| **진척표** | `components/dashboard/progress-table/dot-matrix-table.tsx` | `DETAIL_COLUMNS`(:18), `STAGE_ORDER`(:29), 진행률(:167-175), `as DetailColumn`(:123,171) | 분기 + 분모 교정 + 빗금 |
| **작업현황** | `components/detail/work-status-tab.tsx` | `FILE_COLUMNS`(:59), `ChapterProgress`(:203,258), 인라인 `stageKeys`(:270), `currentStageKey`(:286) | 분기 + 분모 교정 + 빗금 + readOnly |
| **셀** | `components/detail/work-status-cells.tsx` | `DeliverableCell` 교안링크(:51,104), 스타일 inline(:114,156,192) | 교체/삭제 UI |
| **파이프라인** | `components/dashboard/chapter-pipeline.tsx` | `PIPELINE_STAGE_NAMES`(:6), `PIPELINE_TASK_TYPES`(:9), `getChapterProgress`(:25-53, 4슬롯 고정) | 분기 + 빗금 |
| **일정** | `components/detail/monday-board.tsx` | `STAGE_ORDER`(:41), `StageChip`(:105), 진행률(:740,911), `readOnly`(:78,721) | 분기 + 빗금 |
| **칸반 필터** | `components/dashboard/progress-table.tsx` | `getEffectiveKanbanColumn` 유일 소비처(:29) | 노출 유지 확인 |
| **목록 필터** | `components/dashboard/project-grid/project-grid.tsx` | 사업부 필터(:45), 드롭다운 `BUSINESS_UNITS.map`(:156), KDT 트랙 필터(:49,149,164) | 자동 대응(상수만) |
| **카드** | `components/dashboard/project-grid/project-card.tsx` | `getCompletionRate`(:15-20, 실제 태스크 수 분모) | 자동 안전 |

---

## 🚨 기존 기능 회귀 위험 & 방지책 (가장 중요)

> 조사 결과 **`Record<BusinessUnit,...>`가 코드에 없어 TS strict가 사업부 추가를 거의 안 잡아줍니다.** 즉 "타입만 고치면 빌드는 통과하는데 화면은 깨지는" 무음 버그가 핵심 위험. 아래 5개를 설계로 막습니다.

### R1. 사업부 추가가 빌드에 안 잡힘 → 3곳을 항상 함께, 폼을 상수 기반으로 통일
- **위험**: `BusinessUnit` 타입(`types.ts:9`)과 `BUSINESS_UNITS` 배열(`constants.ts:23`)이 **각자 하드코딩**돼 둘 중 하나만 고쳐도 빌드 통과. 폼 라디오(`project-request-form.tsx:377-394`)는 **JSX 하드코딩**이라 타입 추가만으론 선택지가 안 생김.
- **방지**: ① 타입 + ② 상수 배열 + ③ 폼 라디오를 **한 커밋에 함께** 수정. 더 근본적으로 **폼 라디오를 `BUSINESS_UNITS.map()`으로 렌더**하도록 바꿔(목록 필터는 이미 그럼) 단일화 → 앞으로 사업부 추가 시 상수+타입 두 곳만.
- **테스트**: "BUSINESS_UNITS와 BusinessUnit이 일치" 단언 테스트(아래 T-A1).

### R2. 진행률 분모 고정 → AI 캠퍼스 100% 불가 (최우선)
- **위험**(조사 확인):
  - `dot-matrix-table.tsx:167-175`: `totalSteps = chapters × DETAIL_COLUMNS.length`(항상 **7**). 촬영·편집·자막을 빼면 분자가 거기 못 닿아 **영영 100% 미만**.
  - `work-status-tab.tsx:203-205,258`: 분모 `FILE_COLUMNS.length`(**6** 고정). AI 캠퍼스 챕터엔 촬영·편집 태스크가 없어 그 칸이 영영 미완 → **100% 불가**.
  - `chapter-pipeline.tsx:25-53`: **4슬롯 고정**. 교안 다음 검수로 점프 → 가운데 슬롯 빈 채 표시(시각 깨짐).
- **방지**(설계): **사업부별 단계 SSOT**를 만들고 — `getStagesForBusinessUnit(bu)` → 적용 단계 배열 반환 — **모든 진행률 분모를 "적용 단계 수"로** 바꾼다. 화면은 칸을 다 그리되 비활성 칸은 **빗금 + 진행률 분모에서 제외**.
- **추가 방지**: 태스크 **생성기 두 곳(`mock-data.ts:18`, `[id]/page.tsx:168,210`)을 사업부로 분기**해 AI 캠퍼스 챕터엔 촬영·편집·자막 태스크를 **아예 안 만든다**(분자/분모 양쪽 정합).
- **테스트**: AI 캠퍼스 강의가 모든 적용 단계 완료 시 **진행률 100%** 도달 단언(T-B2, T-B3, T-B4). KDT/KDC는 기존대로 7/6 분모 유지 단언(회귀, T-B1).

### R3. 파이프라인 빈 슬롯 → 사업부별 슬롯 수 분기
- **방지**: `chapter-pipeline`의 4슬롯을 `getStagesForBusinessUnit(bu)` 기반으로 그려, AI 캠퍼스는 적용 슬롯만(나머지 빗금). 진행률도 적용 슬롯 수 기준.

### R4. `as DetailColumn` 캐스트 런타임 크래시
- **위험**: `dot-matrix-table.tsx:123,171`에서 `getChapterDetailedStage(...) as DetailColumn` 후 `itemsByStage[stage].push`(`:163`). 헬퍼가 컬럼에 없는 문자열을 반환하면 **빌드 무음 → 런타임 크래시**.
- **방지**: `getChapterDetailedStage`가 AI 캠퍼스에서 **반드시 적용 단계 안의 값만** 반환하도록 분기. 방어적으로 `itemsByStage[stage]` 미존재 시 무시.
- **테스트**: AI 캠퍼스 프로젝트로 `getChapterDetailedStage` 호출 → 반환값이 적용 단계 집합에 속함 단언(T-B2).

### R5. 칸반/목록에서 사라짐 방지 → ProjectStatus enum은 그대로
- **위험**: `progress-table.tsx:29` "진행 중인 강의" 필터는 `STATUS_TO_KANBAN`/`getEffectiveKanbanColumn`에 의존. **status enum에서 "촬영"을 빼면** 매칭 실패로 AI 캠퍼스가 목록에서 통째로 사라질 수 있음.
- **방지**: **`ProjectStatus` enum(기획/교안/촬영/편집·검수/완료/중단)은 변경하지 않는다.** AI 캠퍼스는 단지 "촬영" status에 **진입하지 않을 뿐**, "편집·검수" status는 AI 캠퍼스에선 **검수** 의미로 표시. 단계 제거는 **태스크/표시 레이어에서만** 처리.
- **테스트**: AI 캠퍼스 프로젝트가 "진행 중인 강의" 필터(`getEffectiveKanbanColumn`)에 정상 포함 단언(T-B5).

### (선택) 죽은 코드 정리
- `STATUS_BADGE_VARIANT`(`constants.ts:76`), `TASK_TYPE_TO_KANBAN`(`process-helpers.ts:23`) 소비처 0 → 분기와 무관. 건드리지 않거나 별도 커밋으로만 정리(이번 범위 밖 권장).

---

> 아래 작업 항목: **무엇을 / 왜 / 영향 레이어 / 회귀 방지 / 검증** 순서. `개발자 메모`는 구현용.

---

# 0덩어리 — 검증 토대 (테스트 셋업) ⭐ 먼저

> "검증 가능한 테스트"를 위해 **제일 먼저** 테스트 환경을 깐다. 그래야 1~3덩어리를 매 단계 자동 검증할 수 있다.

- **무엇을**: 단위 테스트 러너 도입 + 타입체크 명령 추가
- **왜**: 현재 `npm run build/lint`만 있고 **테스트 러너·typecheck 스크립트 없음**(조사 확인). 회귀를 사람이 눈으로만 막는 건 위험.
- **어떻게**: vitest + jsdom + Testing Library 추가, `test`/`test:run`/`typecheck` 스크립트 추가
- **검증**: `npm run test:run` 통과(빈 테스트라도), `npm run typecheck` 통과
- `개발자 메모`:
  - devDep: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom` (Playwright 1.58은 이미 설치돼 있어 E2E는 추후 활용 가능)
  - `frontend/vitest.config.ts`(jsdom env, `@/*` alias), `frontend/vitest.setup.ts`(jest-dom)
  - `package.json` scripts: `"test":"vitest"`, `"test:run":"vitest run"`, `"typecheck":"tsc --noEmit"`
  - `.gitignore`에 `coverage/`
  - 첫 스모크 테스트로 기존 순수함수(`lib/utils.ts`의 `getDday`/`formatDday`/`getProgressPercent`) 검증 → 셋업 정상 확인

---

# 1덩어리 — 타입·상수·폼·샘플 데이터

## 1-1. AI 캠퍼스 사업부 + 트랙
- **무엇을**: 폼 사업부에 "AI 캠퍼스" + 선택 시 트랙 6종
- **영향 레이어**: `types.ts:9`, `constants.ts:23`, 폼 `:377-394,:397,:263`
- **회귀 방지(R1)**: 타입·상수·폼 라디오 동시 수정. 폼 라디오를 `BUSINESS_UNITS.map`으로 통일. 트랙 분기를 `tracksFor(bu)` 헬퍼로(KDT·AI 캠퍼스→각자 트랙, 그 외→없음)
- **검증**: T-A1(상수↔타입 일치), 폼 수동 QA(AI 캠퍼스 선택→트랙→제출)
- `개발자 메모`: `AI_CAMPUS_TRACKS` 상수 신설(`constants.ts`); 검증식 `:263`을 `["KDT","AI 캠퍼스"].includes(businessUnit) ? !!trackName : true`

## 1-2. 갈래(콘텐츠 형태) 드롭다운
- **무엇을**: 사업부·트랙 직후 `강의/과제/프로젝트/숙제` 드롭다운(분류 태그, 흐름 불변)
- **영향 레이어**: 폼 `FormData`(:29-56), 검증(:263-277), `:423` 뒤 UI, `types.ts Project.contentBranch?`
- **회귀 방지**: 선택적 필드로 추가 → 기존 프로젝트(값 없음)도 정상. 흐름·다른 사업부 영향 없음
- **검증**: 수동 QA(사업부 선택 시 드롭다운 노출·제출 반영)
- `개발자 메모`: `contentBranch: "강의"|"과제"|"프로젝트"|"숙제"|""`, 기본 `""`

## 1-3. 강의 8자리 코드 (표시·입력만)
- **무엇을**: `Project.courseCode?` 추가, 상세/폼에서 표시·입력. 발급 로직 없음(D2)
- **회귀 방지**: 선택적 필드 → 기존 데이터 무영향
- **검증**: 코드 입력·표시, 빈 값도 무방 (수동 QA)

## 1-4. AI 캠퍼스 샘플 데이터
- **무엇을**: 목 데이터에 AI 캠퍼스 강의 1~2개(촬영·편집·자막 태스크 없음)
- **영향 레이어**: `mock-data.ts` (`createChapterTasks` 분기와 함께, 2-3 참조)
- **검증**: 대시보드/상세에 노출 + 진행률 100% 도달(T-B2~B4)

---

# 2덩어리 — 단계 SSOT + 사업부 분기 + 진행률 교정 + 빗금 (가장 큼)

## 2-1. 단계 단일 기준 + 사업부 헬퍼
- **무엇을**: 흩어진 단계 목록을 한 곳으로, 사업부별 적용/비활성 단계 헬퍼 신설
- **영향 레이어**: `constants.ts`(+SSOT), `process-helpers.ts`(+헬퍼)
- **회귀 방지**: 새 헬퍼는 **추가**만(기존 함수 시그니처 유지). 기존 컴포넌트는 점진 이행
- `개발자 메모`:
  - `STAGE_FLOW` 단일 상수(기획·교안·촬영·편집·자막·검수·승인·완료)
  - `getDisabledTaskTypes(bu)` → AI 캠퍼스 `["촬영","편집","자막"]`, 그 외 `[]`
  - `getStagesForBusinessUnit(bu)` → 적용 단계 배열(진행률 분모용)
  - `isStageDisabled(bu, key)` → 빗금 판정
  - `DISABLED_STAGE_STYLE` 공용 빗금 + 툴팁 "AI 캠퍼스는 이 단계가 없어요"

```
backgroundImage:
  "repeating-linear-gradient(45deg, transparent 0 5px, rgba(120,120,120,0.10) 5px 6px)"
```

## 2-2. 태스크 생성기 2곳 분기 (R2 핵심)
- **무엇을**: AI 캠퍼스 챕터엔 촬영·편집·자막 태스크를 **생성하지 않음**
- **영향 레이어**: `mock-data.ts:18 createChapterTasks`, `[id]/page.tsx:168,210`(기획완료/장추가)
- **회귀 방지**: 둘 다 `getDisabledTaskTypes(bu)`로 필터 → **한쪽만 고치면 분모 어긋남**, 반드시 동시. KDT/KDC는 6공정 그대로
- **검증**: T-B2(생성된 태스크에 촬영·편집·자막 없음), T-B1(KDT는 6공정 유지)

## 2-3. 진행률 분모 교정 (R2)
- **무엇을**: 고정 분모(7/6/4)를 **적용 단계 수**로
- **영향 레이어**: `dot-matrix-table.tsx:167-175`, `work-status-tab.tsx:203-205,258`, `chapter-pipeline.tsx:25-53`
- **회귀 방지**: 분모를 `getStagesForBusinessUnit(bu).length`로. KDT/KDC는 값이 동일(7/6/4 그대로)이라 **무변화**, AI 캠퍼스만 줄어듦
- **검증**: T-B3(work-status 100%), T-B4(dot-matrix 100%), T-B1(KDT 회귀 동일)

## 2-4. 빗금 비활성 표시 (5곳)
- **무엇을**: 촬영·편집·자막 칸을 빗금 + 내용 비움, 칸 정렬 유지
- **영향 레이어**: dot-matrix(헤더 :343-357·도트 :249-300), work-status(헤더 :170-182·셀 :316-369, **project/businessUnit prop 추가 필요**), chapter-pipeline(:115-123), monday-board(StageChip :105-161, **businessUnit prop 추가 필요**)
- **회귀 방지**: prop 추가는 기본값으로 기존 호출부 무영향. `isStageDisabled`가 false면 기존과 동일 렌더
- **검증**: 수동 QA(AI 캠퍼스만 빗금, KDT/KDC 무변화) + 가능하면 컴포넌트 스냅샷

## 2-5. 자동 전이 (교안→검수)
- **무엇을**: AI 캠퍼스는 교안 등록 시 촬영·편집 건너뛰고 검수로 인식
- **영향 레이어**: `process-helpers.ts getChapterDetailedStage`(:46), `getEffectiveKanbanColumn`(:9)
- **회귀 방지(R4)**: AI 캠퍼스 분기에서 반환값이 적용 단계 집합 내로 한정. KDT/KDC 경로 불변
- **검증**: T-B2(반환 단계 유효), T-B5(칸반 노출 유지)

---

# 3덩어리 — 장 이름 편집 + 교안 링크 권한·교체·삭제

## 3-1. 장 이름 클릭 수정
- **무엇을**: "N장 + 제목" 클릭 → 인라인 편집 → 저장. 내부만(D4)
- **영향 레이어**: `work-status-tab.tsx:227-232`(헤더, **readOnly prop 없음→추가**), `monday-board.tsx:860-865`(readOnly 이미 있음 :78,721), `[id]/page.tsx chapterTitles`(:51,76,132, **업데이트 콜백 신설**)
- **회귀 방지**: `readOnly` 기본 false로 기존 동작 유지. 콜백은 추가만
- **검증**: 수동 QA(내부 수정 가능 / 외부 readOnly 비활성)

## 3-2. 교안 링크 업로드 + 교체/삭제
- **무엇을**: 대시보드 내 누구나 업로드, **교체/삭제** 추가(D5)
- **영향 레이어**: `work-status-cells.tsx DeliverableCell`(:51 입력, :104-122 표시→교체/삭제 버튼 추가), 저장 `[id]/page.tsx handleLectureUrlChange`(:149-159, field `lessonPlanUrl`), 삭제는 빈 문자열
- **회귀 방지**: 기존 업로드 흐름 유지하고 표시부에 액션 추가. 외부 뷰는 `readOnly`로 차단
- **검증**: 수동 QA(업로드→교체→삭제) + 가능하면 `handleLectureUrlChange` 단위 테스트(빈 문자열=삭제)

---

# 4. 정책 문서 기록 (각 덩어리와 함께)
- `ST-` AI 캠퍼스 단계 흐름(촬영·편집·자막 생략, 기획 유지)·교안→검수 자동전이
- `DT-` 8자리 코드(표시·입력만, 발급·매핑 백엔드)·갈래 분류
- `RL-` 교안 업로드/교체/삭제·장 이름 수정 권한(내부 전용)
- `BZ-` 비활성 단계 빗금 표시
- `docs/policies/README.md` 인덱스 + `백엔드-할일.md`(코드 자동발급·외부매핑·슬랙 분기) 갱신

---

## 🧪 테스트 계획 (검증 가능)

> 0덩어리에서 깐 vitest로 **순수 함수 + 진행률**을 자동 검증. 컴포넌트 시각/상호작용은 수동 QA(+선택적 RTL·Playwright).

### 단위·회귀 테스트 (자동) — `src/lib/__tests__/`

| ID | 대상 | 무엇을 보장 | 막는 회귀 |
| --- | --- | --- | --- |
| **T-A1** | `BUSINESS_UNITS` ↔ `BusinessUnit` | 상수 배열과 타입이 일치(누락 없음) | R1 (사업부 추가 누락) |
| **T-A2** | `tracksFor(bu)` | KDT·AI 캠퍼스는 트랙 배열, KDC·기타는 빈 배열 | 트랙 분기 오류 |
| **T-B1** | `getStagesForBusinessUnit("KDT"/"KDC")` | 기존대로 전체 단계(7/6 분모 불변) | R2 (KDT/KDC 진행률 변질) |
| **T-B2** | `getDisabledTaskTypes`, 생성기 분기, `getChapterDetailedStage(AI)` | AI 캠퍼스 태스크/단계에 촬영·편집·자막 없음 + 반환값 유효 | R2·R4 |
| **T-B3** | work-status 진행률 함수 | AI 캠퍼스 모든 적용단계 완료 → **100%** | R2 (100% 불가) |
| **T-B4** | dot-matrix 진행률 함수 | AI 캠퍼스 완료 시 **100%** + 잘못된 단계 push 없음 | R2·R4 |
| **T-B5** | `getEffectiveKanbanColumn(AI)` | AI 캠퍼스가 "진행 중" 필터에 포함 | R5 (목록에서 증발) |
| **T-C1** | `handleLectureUrlChange` 로직 | 빈 문자열=삭제, 새 값=교체 | 교안 교체/삭제 |

> 진행률 함수가 컴포넌트 내부에 묶여 있으면(예: dot-matrix `ProjectRow`), 테스트 가능하도록 **계산부를 `lib`의 순수 함수로 추출**(리팩토링)하고 컴포넌트는 그걸 호출 → 회귀 위험↓, 테스트 용이↑.

### 컴포넌트 테스트 (선택, RTL) — 여력 되면
- 작업현황/진척표에 AI 캠퍼스 프로젝트 주입 → 촬영·편집 칸에 빗금 스타일(`repeating-linear-gradient`) 존재, KDT엔 없음 단언.

### E2E (선택, Playwright 이미 설치됨)
- 폼: AI 캠퍼스 선택→트랙→갈래→제출 → 상세에서 4단계 흐름·빗금 확인.

### 게이트(매 커밋)
- `npm run typecheck` (tsc --noEmit) · `npm run lint` · `npm run test:run` · `npm run build` 모두 통과.

---

## 작업 순서 & 커밋

0. **테스트 토대** — vitest 셋업 + typecheck 스크립트 + 스모크 테스트
1. **타입·폼·샘플** — 1덩어리 + T-A1/T-A2 + 정책(DT-)
2. **단계 SSOT·분기·진행률·빗금** — 2덩어리 + T-B1~B5 + 정책(ST-/BZ-)
3. **장 이름·교안 권한/교체/삭제** — 3덩어리 + T-C1 + 정책(RL-)

각 커밋 전: `typecheck → lint → test:run → build` 순으로 통과 확인.

## 전체 검증 체크리스트

- [ ] `npm run typecheck` / `lint` / `test:run` / `build` 모두 통과
- [ ] T-A1: 사업부 상수↔타입 일치
- [ ] T-B1: KDT/KDC 진행률 분모(7/6) 회귀 없음
- [ ] T-B2~B4: AI 캠퍼스 진행률 **100% 도달**, 잘못된 단계 push 없음
- [ ] T-B5: AI 캠퍼스가 "진행 중인 강의" 목록에 보임
- [ ] T-C1: 교안 링크 교체/삭제 로직
- [ ] 수동: 폼 AI 캠퍼스→트랙→갈래→제출 정상
- [ ] 수동: AI 캠퍼스만 촬영·편집·자막 빗금, KDT/KDC 무변화
- [ ] 수동: 장 이름 내부 수정/외부 읽기전용, 교안 업로드·교체·삭제
- [ ] 정책 `docs/policies/`에 ID 기록 + README/백엔드-할일 갱신
