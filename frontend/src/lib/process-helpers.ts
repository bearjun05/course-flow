import type { Project, TaskType } from "./types";

export interface ProcessInfo {
  activeChapters: number[];
  doneCount: number;
  total: number;
  allDone: boolean;
  noneStarted: boolean;
}

export function getProcessInfo(
  project: Project,
  taskType: TaskType
): ProcessInfo | null {
  const tasks = project.tasks.filter(
    (t) => t.chapter > 0 && t.taskType === taskType
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
