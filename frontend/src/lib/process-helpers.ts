import type { BusinessUnit, Project, TaskType, KanbanColumn } from "./types";
import { STATUS_TO_KANBAN } from "./constants";

/* ── 사업부별 단계 분기 (단일 기준) ──
 * AI 캠퍼스 강의는 영상이 없어 촬영·편집·자막 공정이 없다.
 * 태스크 생성기·진척 계산·표시(빗금)가 모두 이 함수 하나를 기준으로 분기한다. */

/** 사업부에서 제외되는 공정(TaskType) 목록. AI 캠퍼스 = 촬영·편집·자막 없음. */
export function getDisabledTaskTypes(bu: BusinessUnit): TaskType[] {
  if (bu === "AI 캠퍼스") return ["촬영", "편집", "자막"];
  return [];
}

/** 해당 공정이 사업부에서 비활성(제외)인지. 빗금/스킵 판정용. */
export function isTaskTypeDisabled(
  bu: BusinessUnit,
  taskType: TaskType,
): boolean {
  return getDisabledTaskTypes(bu).includes(taskType);
}

/**
 * 표시 컬럼 키가 사업부에서 비활성인지 (빗금 판정).
 * 공정 키("촬영"/"편집"/"자막")뿐 아니라 표시용 합본 키 "편집·자막"도 처리한다.
 */
export function isStageDisabled(bu: BusinessUnit, key: string): boolean {
  const disabled = getDisabledTaskTypes(bu);
  if (disabled.length === 0) return false;
  if (key === "편집·자막")
    return disabled.includes("편집") || disabled.includes("자막");
  return (disabled as string[]).includes(key);
}

/** 작업현황 표의 단계 컬럼 키 (완료 컬럼 포함) */
const FILE_COLUMN_KEYS = [
  "교안제작",
  "촬영",
  "편집",
  "검수",
  "승인",
  "완료",
] as const;

/**
 * 장(章) 단위 진행률 (작업현황 표).
 * 사업부에서 비활성인 단계(AI 캠퍼스=촬영·편집)는 분모에서 제외해,
 * 누락 단계 때문에 진행률이 영영 못 차는 문제(R2)를 막는다.
 */
export function getChapterFileProgress(
  taskStatuses: Record<string, string | undefined>,
  bu: BusinessUnit,
): { completed: number; total: number } {
  const applicable = FILE_COLUMN_KEYS.filter((k) => !isStageDisabled(bu, k));
  const completed = applicable.filter((k) => taskStatuses[k] === "완료").length;
  return { completed, total: applicable.length };
}

/**
 * 칸반 배치 열을 결정한다.
 * [ST-007] 프로젝트 상태가 "촬영"이더라도 어느 챕터든 편집 태스크가
 * 대기 외 상태(진행/리뷰/완료)이면 "편집·검수" 열에 배치한다.
 */
export function getEffectiveKanbanColumn(
  project: Project,
): KanbanColumn | undefined {
  if (project.status === "촬영") {
    const editingStarted = project.tasks.some(
      (t) => t.chapter > 0 && t.taskType === "편집" && t.status !== "대기",
    );
    if (editingStarted) return "편집·검수";
  }
  return STATUS_TO_KANBAN[project.status];
}

/* ── 장별 공정→칸반 열 매핑 ── */

const TASK_TYPE_TO_KANBAN: Record<TaskType, KanbanColumn> = {
  교안제작: "교안",
  "커리큘럼 기획": "교안",
  촬영: "촬영",
  편집: "편집·검수",
  자막: "편집·검수",
  검수: "편집·검수",
  승인: "편집·검수",
};

const CHAPTER_TASK_TYPES: TaskType[] = [
  "교안제작",
  "촬영",
  "편집",
  "자막",
  "검수",
  "승인",
];

/**
 * 진척표 컬럼 매핑용 (6단계): 교안 → 촬영 → 편집·자막 → 검수 → 승인 → 완료
 * 승인 태스크가 "완료"면 → "완료", 그 외(진행/리뷰) → "승인"
 */
export function getChapterDetailedStage(
  project: Project,
  chapter: number,
): string {
  const tasks = project.tasks.filter((t) => t.chapter === chapter);
  if (tasks.length === 0) return "교안";

  for (let i = CHAPTER_TASK_TYPES.length - 1; i >= 0; i--) {
    const taskType = CHAPTER_TASK_TYPES[i];
    const task = tasks.find((t) => t.taskType === taskType);
    if (
      task &&
      (task.status === "완료" ||
        task.status === "진행" ||
        task.status === "리뷰")
    ) {
      if (taskType === "승인") return task.status === "완료" ? "완료" : "승인";
      if (taskType === "검수") return "검수";
      if (taskType === "편집" || taskType === "자막") return "편집·자막";
      if (taskType === "촬영") return "촬영";
      if (taskType === "교안제작") return "교안";
      return "교안";
    }
  }

  return "교안";
}
