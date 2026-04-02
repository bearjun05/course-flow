import type { Project, TaskType, KanbanColumn } from "./types";
import { STATUS_TO_KANBAN, KANBAN_COLUMNS } from "./constants";

export interface ProcessInfo {
  activeChapters: number[];
  doneCount: number;
  total: number;
  allDone: boolean;
  noneStarted: boolean;
}

export function getProcessInfo(
  project: Project,
  taskType: TaskType,
): ProcessInfo | null {
  const tasks = project.tasks.filter(
    (t) => t.chapter > 0 && t.taskType === taskType,
  );
  if (tasks.length === 0) return null;

  const activeChapters = tasks
    .filter((t) => t.status === "진행" || t.status === "리뷰")
    .map((t) => t.chapter)
    .sort((a, b) => a - b);

  const doneCount = tasks.filter((t) => t.status === "완료").length;
  const total = tasks.length;

  return {
    activeChapters,
    doneCount,
    total,
    allDone: doneCount === total,
    noneStarted: doneCount === 0 && activeChapters.length === 0,
  };
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
 * 특정 장의 현재 공정 단계를 칸반 열로 매핑한다.
 * chapter-pipeline.tsx의 getChapterProgress와 동일한 역순 탐색 로직 사용.
 */
export function getChapterKanbanColumn(
  project: Project,
  chapter: number,
): KanbanColumn {
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
      return TASK_TYPE_TO_KANBAN[taskType];
    }
  }

  return "교안";
}

/**
 * 프로젝트의 모든 장을 칸반 열별로 그룹화하여 반환한다.
 */
export function getChaptersGroupedByColumn(
  project: Project,
): Record<KanbanColumn, number[]> {
  const result: Record<KanbanColumn, number[]> = {
    교안: [],
    촬영: [],
    "편집·검수": [],
    롤아웃: [],
  };

  for (let ch = 1; ch <= project.chapterCount; ch++) {
    const col = getChapterKanbanColumn(project, ch);
    result[col].push(ch);
  }

  return result;
}

/**
 * 장의 현재 세부 공정명을 반환한다.
 * 편집·검수 퍼널에서는 편집/자막/검수 중 실제 진행 단계를 구분한다.
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
      if (taskType === "승인") return "승인";
      if (taskType === "편집") return "편집";
      if (taskType === "자막") return "자막";
      if (taskType === "검수") return "검수";
      if (taskType === "교안제작") return "교안";
      return taskType;
    }
  }

  return "교안";
}
