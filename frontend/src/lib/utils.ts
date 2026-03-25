import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, parseISO, format } from "date-fns";
import { ko } from "date-fns/locale";
import type { Project, ChapterTask, ProjectStatus } from "./types";
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
  return !["완료", "중단", "기획"].includes(status);
}

export function isProjectOverdue(project: Project): boolean {
  return getDday(project.rolloutDate) < 0 && project.status !== "완료";
}

export function getAutoTrafficLight(project: Project): Project["trafficLight"] {
  const dday = getDday(project.rolloutDate);
  if (dday < 0) return "red";
  return project.trafficLight;
}
