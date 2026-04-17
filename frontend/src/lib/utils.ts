import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, parseISO, format } from "date-fns";
import { ko } from "date-fns/locale";
import type { Project, ChapterTask, ProjectStatus, TaskType } from "./types";
import { DDAY_GROUPS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDday(rolloutDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseISO(rolloutDate);
  target.setHours(0, 0, 0, 0);
  return differenceInDays(target, today);
}

export function formatDday(dday: number): string {
  if (dday === 0) return "D-Day";
  if (dday > 0) return `D-${dday}`;
  return `D+${Math.abs(dday)}`;
}

export function getDdayColor(dday: number): string {
  if (dday < 0) return "text-red-500 font-semibold";
  if (dday <= 3) return "text-amber-500 font-semibold";
  return "text-neutral-500";
}

export function getDdayGroupLabel(dday: number): string {
  const group = DDAY_GROUPS.find((g) => dday >= g.min && dday <= g.max);
  return group?.label ?? "한 달 이상";
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "M월 d일", { locale: ko });
}

export function formatDateFull(dateStr: string): string {
  return format(parseISO(dateStr), "yyyy년 M월 d일", { locale: ko });
}

export function getProgressPercent(tasks: ChapterTask[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "완료").length;
  return Math.round((done / tasks.length) * 100);
}

export function getProgressText(tasks: ChapterTask[]): string {
  const done = tasks.filter((t) => t.status === "완료").length;
  return `${done}/${tasks.length}`;
}

export function isProjectActive(status: ProjectStatus): boolean {
  return !["완료", "중단"].includes(status);
}

export function isProjectOverdue(project: Project): boolean {
  return getDday(project.rolloutDate) < 0 && project.status !== "완료";
}

/* ------------------------------------------------------------------ */
/* 담당자 관련 공용 헬퍼 (에듀웍스/태스크 캘린더 등에서 공통 사용)      */
/* ------------------------------------------------------------------ */

/**
 * 역할별 담당 TaskType 목록.
 * 외부 관계자가 어떤 공정 태스크를 담당하는지 결정한다.
 */
export const ROLE_TASK_TYPES: Record<
  "tutor" | "editor" | "subtitleEditor" | "reviewer" | "curriculumManager",
  TaskType[]
> = {
  tutor: ["교안제작", "촬영"],
  editor: ["편집"],
  subtitleEditor: ["자막"],
  reviewer: ["검수"],
  curriculumManager: ["커리큘럼 기획", "승인"],
};

/** 쉼표 구분 담당자 문자열을 배열로 파싱 (복수 담당자 지원) */
export function parseAssigneeNames(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * 해당 이름이 프로젝트의 특정 역할에 배정되어 있는지 확인.
 * 쉼표 구분 복수 담당자 지원.
 */
export function isAssignedAs(
  project: Project,
  role: keyof typeof ROLE_TASK_TYPES | "pm",
  name: string,
): boolean {
  const field =
    role === "pm"
      ? project.pm
      : role === "tutor"
        ? project.tutor
        : role === "editor"
          ? project.editor
          : role === "subtitleEditor"
            ? project.subtitleEditor
            : role === "reviewer"
              ? project.reviewer
              : project.curriculumManager;
  return parseAssigneeNames(field).includes(name);
}

/**
 * 태스크가 해당 사람에게 배정된 것인지 확인.
 * 직접 assignee 매칭 또는 역할 기반 매칭.
 */
export function isTaskForPerson(
  task: ChapterTask,
  project: Project,
  person?: string,
): boolean {
  if (!person) return true;
  if (task.assignee === person) return true;
  for (const [role, taskTypes] of Object.entries(ROLE_TASK_TYPES) as [
    keyof typeof ROLE_TASK_TYPES,
    TaskType[],
  ][]) {
    if (
      isAssignedAs(project, role, person) &&
      taskTypes.includes(task.taskType)
    ) {
      return true;
    }
  }
  return false;
}

/** 태스크의 담당자 이름. task.assignee 우선, 없으면 역할 기반 추론. */
export function getTaskOwner(
  task: ChapterTask,
  project: Project,
): string | undefined {
  if (task.assignee) return task.assignee;
  switch (task.taskType) {
    case "커리큘럼 기획":
    case "승인":
      return project.curriculumManager;
    case "교안제작":
    case "촬영":
      return project.tutor;
    case "편집":
      return project.editor;
    case "자막":
      return project.subtitleEditor;
    case "검수":
      return project.reviewer;
    default:
      return undefined;
  }
}
