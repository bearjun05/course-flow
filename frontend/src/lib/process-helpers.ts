import type { Project, TaskType, KanbanColumn } from "./types";
import { STATUS_TO_KANBAN } from "./constants";

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
