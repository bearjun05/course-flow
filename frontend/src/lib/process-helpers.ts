import type { Project, TaskType, KanbanColumn } from "./types";
import { STATUS_TO_KANBAN } from "./constants";

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
  승인: "롤아웃",
  업로드: "롤아웃",
  롤아웃: "롤아웃",
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
