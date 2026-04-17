"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isToday,
  isSameDay,
  parseISO,
  format,
  isBefore,
  isAfter,
  eachDayOfInterval,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Project, ChapterTask } from "@/lib/types";
import { isProjectActive } from "@/lib/utils";

/** 시작~마감 구간을 포함하는 태스크 바 */
interface TaskBar {
  task: ChapterTask;
  project: Project;
  startDate: Date;
  endDate: Date;
  isDone: boolean;
  isOverdue: boolean;
}

/** 특정 날짜에 걸치는 이벤트 (시작/중간/마감 구분) */
interface DayEvent {
  bar: TaskBar;
  type: "start" | "middle" | "end" | "single";
}

/** 챕터 색상 — WorkStatusTab의 GROUP_COLORS와 동일 */
const CHAPTER_COLORS = [
  "#909090",
  "#D07070",
  "#D08A6A",
  "#D0A858",
  "#C4A840",
  "#8AAE50",
  "#50B880",
  "#50AAAA",
  "#5090C0",
  "#8070C0",
  "#B870A0",
  "#A89070",
];

const TASK_TYPE_SHORT: Record<string, string> = {
  "커리큘럼 기획": "기획",
  교안제작: "교안",
  촬영: "촬영",
  편집: "편집",
  자막: "자막",
  검수: "검수",
  승인: "승인",
  업로드: "업로드",
  롤아웃: "롤아웃",
};

function getChapterColor(chapter: number): string {
  return CHAPTER_COLORS[chapter % CHAPTER_COLORS.length];
}

/** 태스크가 해당 사람에게 배정된 것인지 확인 */
function isTaskForPerson(
  task: ChapterTask,
  project: Project,
  person?: string,
): boolean {
  if (!person) return true; // 필터 없으면 모두 표시
  // 직접 assignee
  if (task.assignee === person) return true;
  // 튜터 → 교안제작, 촬영
  if (
    project.tutor === person &&
    (task.taskType === "교안제작" || task.taskType === "촬영")
  )
    return true;
  // 편집자 → 편집
  if (project.editor === person && task.taskType === "편집") return true;
  // 자막자 → 자막
  if (project.subtitleEditor === person && task.taskType === "자막")
    return true;
  // 검수자 → 검수
  if (project.reviewer === person && task.taskType === "검수") return true;
  // 커기매 → 커리큘럼 기획, 승인
  if (
    project.curriculumManager === person &&
    (task.taskType === "커리큘럼 기획" || task.taskType === "승인")
  )
    return true;
  return false;
}

interface TaskCalendarProps {
  projects: Project[];
  basePath?: string;
  selectedPerson?: string;
}

export function TaskCalendar({
  projects,
  basePath = "/eduworks",
  selectedPerson,
}: TaskCalendarProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const activeProjects = useMemo(
    () => projects.filter((p) => isProjectActive(p.status)),
    [projects],
  );

  // 모든 태스크 바 수집
  const taskBars = useMemo(() => {
    const bars: TaskBar[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const project of activeProjects) {
      // 롤아웃 마감
      const rollout = parseISO(project.rolloutDate);
      bars.push({
        task: {
          id: `${project.id}-rollout`,
          projectId: project.id,
          chapter: 0,
          taskType: "롤아웃",
          status: project.status === "롤아웃" ? "진행" : "대기",
        },
        project,
        startDate: rollout,
        endDate: rollout,
        isDone: false,
        isOverdue: isBefore(rollout, today) && project.status !== "완료",
      });

      for (const task of project.tasks) {
        if (!task.startDate && !task.endDate) continue;
        if (!isTaskForPerson(task, project, selectedPerson)) continue;
        const start = task.startDate
          ? parseISO(task.startDate)
          : parseISO(task.endDate!);
        const end = task.endDate ? parseISO(task.endDate) : start;
        const isDone = task.status === "완료";
        bars.push({
          task,
          project,
          startDate: start,
          endDate: end,
          isDone,
          isOverdue: !isDone && isBefore(end, today),
        });
      }
    }

    return bars;
  }, [activeProjects, selectedPerson]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = calStart;
    while (!isAfter(day, calEnd)) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  // 날짜별 이벤트 맵
  const eventsByDate = useMemo(() => {
    const map = new Map<string, DayEvent[]>();

    for (const bar of taskBars) {
      const days = eachDayOfInterval({
        start: bar.startDate,
        end: bar.endDate,
      });
      const isSingle = days.length === 1;

      for (const day of days) {
        const key = format(day, "yyyy-MM-dd");
        if (!map.has(key)) map.set(key, []);
        let type: DayEvent["type"];
        if (isSingle) {
          type = "single";
        } else if (isSameDay(day, bar.startDate)) {
          type = "start";
        } else if (isSameDay(day, bar.endDate)) {
          type = "end";
        } else {
          type = "middle";
        }
        map.get(key)!.push({ bar, type });
      }
    }

    return map;
  }, [taskBars]);

  // 선택된 날짜의 이벤트 (중복 태스크는 한 번만)
  const selectedEvents = useMemo(() => {
    const key = format(selectedDate, "yyyy-MM-dd");
    const events = eventsByDate.get(key) ?? [];
    // 태스크 ID 기준 중복 제거
    const seen = new Set<string>();
    const unique: DayEvent[] = [];
    for (const e of events) {
      if (!seen.has(e.bar.task.id)) {
        seen.add(e.bar.task.id);
        unique.push(e);
      }
    }
    return unique.sort((a, b) => {
      if (a.bar.isDone !== b.bar.isDone) return a.bar.isDone ? 1 : -1;
      if (a.bar.isOverdue !== b.bar.isOverdue) return a.bar.isOverdue ? -1 : 1;
      return a.bar.project.title.localeCompare(b.bar.project.title);
    });
  }, [selectedDate, eventsByDate]);

  const weekDays = ["월", "화", "수", "목", "금", "토", "일"];

  return (
    <div>
      <div className="flex gap-4">
        {/* 캘린더 */}
        <div className="flex-1 rounded-xl border border-border bg-card">
          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {format(currentMonth, "yyyy년 M월", { locale: ko })}
              </span>
              <button
                onClick={() => {
                  setCurrentMonth(new Date());
                  setSelectedDate(new Date());
                }}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
              >
                오늘
              </button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-border">
            {weekDays.map((d) => (
              <div
                key={d}
                className="text-center py-2 text-[11px] font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {/* 날짜 셀 */}
          <div className="grid grid-cols-7 overflow-visible">
            {calendarDays.map((day, i) => {
              const key = format(day, "yyyy-MM-dd");
              const events = eventsByDate.get(key) ?? [];
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const selected = isSameDay(day, selectedDate);

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative min-h-[80px] border-b border-r border-border/50 text-left transition-colors hover:bg-neutral-50 cursor-pointer overflow-visible",
                    !inMonth && "bg-neutral-50/50",
                    selected &&
                      "bg-[#F5F3F0] ring-1 ring-inset ring-neutral-300",
                    today && !selected && "bg-[#FAFAF5]",
                  )}
                >
                  <div className="px-1.5 pt-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center text-[12px] w-6 h-6 rounded-full",
                        !inMonth && "text-neutral-300",
                        inMonth && "text-neutral-600",
                        today && "bg-neutral-800 text-white font-bold",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  {/* 이벤트 바 — 셀 전체 너비 사용, 중간 바는 경계 없이 이어짐 */}
                  <div className="mt-0.5 space-y-[1px] pb-1">
                    {events.slice(0, 4).map((e, idx) => {
                      const color = e.bar.isDone
                        ? "#A0A0A0"
                        : e.bar.isOverdue
                          ? "#DC2626"
                          : getChapterColor(e.bar.task.chapter);
                      const shortType =
                        TASK_TYPE_SHORT[e.bar.task.taskType] ??
                        e.bar.task.taskType;
                      const chPrefix =
                        e.bar.task.chapter === 0
                          ? ""
                          : `${e.bar.task.chapter}장 `;

                      const isLeft = e.type === "start" || e.type === "single";
                      const isRight = e.type === "end" || e.type === "single";

                      return (
                        <div
                          key={idx}
                          className="h-[14px] flex items-center"
                          style={{
                            marginLeft: isLeft ? 4 : -1,
                            marginRight: isRight ? 4 : -1,
                            borderRadius: `${isLeft ? "3px" : "0"} ${isRight ? "3px" : "0"} ${isRight ? "3px" : "0"} ${isLeft ? "3px" : "0"}`,
                            backgroundColor: e.bar.isDone
                              ? "#E8E8E8"
                              : `${color}30`,
                          }}
                        >
                          {isLeft && (
                            <div
                              className="w-[3px] h-full shrink-0"
                              style={{
                                backgroundColor: color,
                                borderRadius: "3px 0 0 3px",
                              }}
                            />
                          )}
                          {(e.type === "start" || e.type === "single") && (
                            <span
                              className={cn(
                                "text-[8px] font-semibold truncate px-0.5",
                                e.bar.isDone && "line-through",
                              )}
                              style={{ color }}
                            >
                              {chPrefix}
                              {shortType}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {events.length > 4 && (
                      <span className="text-[8px] text-muted-foreground px-1.5">
                        +{events.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 사이드 패널 */}
        <div className="w-80 shrink-0 rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold">
              {format(selectedDate, "M월 d일 (EEEE)", { locale: ko })}
            </span>
            {isToday(selectedDate) && (
              <span className="ml-2 text-[10px] font-medium text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                오늘
              </span>
            )}
          </div>

          <div className="p-3 overflow-y-auto max-h-[500px]">
            {selectedEvents.length === 0 ? (
              <p className="text-[12px] text-muted-foreground text-center py-8">
                이 날에는 일정이 없습니다
              </p>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map((event, idx) => {
                  const color = event.bar.isDone
                    ? "#A0A0A0"
                    : getChapterColor(event.bar.task.chapter);
                  const shortType =
                    TASK_TYPE_SHORT[event.bar.task.taskType] ??
                    event.bar.task.taskType;
                  const chLabel =
                    event.bar.task.chapter === 0
                      ? ""
                      : `${event.bar.task.chapter}장 `;

                  // 오늘이 시작/마감/중간 어디인지
                  const isStart =
                    event.type === "start" || event.type === "single";
                  const isEnd = event.type === "end" || event.type === "single";

                  return (
                    <button
                      key={`${event.bar.task.id}-${idx}`}
                      onClick={() =>
                        router.push(
                          `${basePath}/${event.bar.project.id}?tab=work-status${selectedPerson ? `&person=${encodeURIComponent(selectedPerson)}` : ""}`,
                        )
                      }
                      className={cn(
                        "w-full text-left rounded-lg border p-2.5 transition-colors hover:bg-accent/30",
                        event.bar.isDone
                          ? "border-neutral-200 bg-neutral-50"
                          : event.bar.isOverdue
                            ? "border-red-200 bg-red-50/50"
                            : "border-border",
                      )}
                    >
                      {/* 프로젝트명 */}
                      <div
                        className={cn(
                          "text-[11px] truncate mb-1",
                          event.bar.isDone
                            ? "text-neutral-400 line-through"
                            : "text-muted-foreground",
                        )}
                      >
                        {event.bar.project.title}
                      </div>

                      {/* 태스크 정보 */}
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span
                          className={cn(
                            "text-[12px] font-semibold",
                            event.bar.isDone && "line-through",
                          )}
                          style={{ color }}
                        >
                          {chLabel}
                          {shortType}
                        </span>
                        <span
                          className={cn(
                            "ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded",
                            event.bar.isDone
                              ? "bg-neutral-100 text-neutral-400"
                              : event.bar.isOverdue
                                ? "bg-red-100 text-red-600"
                                : isEnd && !isStart
                                  ? "bg-amber-100 text-amber-700"
                                  : isStart && !isEnd
                                    ? "bg-blue-50 text-blue-600"
                                    : "bg-neutral-100 text-neutral-600",
                          )}
                        >
                          {event.bar.isDone
                            ? "완료"
                            : event.bar.isOverdue
                              ? "마감 초과"
                              : isStart && isEnd
                                ? "당일"
                                : isStart
                                  ? "시작"
                                  : isEnd
                                    ? "마감"
                                    : "진행 중"}
                        </span>
                      </div>

                      {/* 기간 & 상태 */}
                      <div className="flex items-center gap-2 mt-1.5">
                        {event.bar.task.startDate && event.bar.task.endDate && (
                          <span
                            className={cn(
                              "text-[10px] flex items-center gap-0.5",
                              event.bar.isDone
                                ? "text-neutral-400"
                                : "text-muted-foreground",
                            )}
                          >
                            <Clock className="w-3 h-3" />
                            {format(
                              parseISO(event.bar.task.startDate),
                              "M.d",
                            )}{" "}
                            ~ {format(parseISO(event.bar.task.endDate), "M.d")}
                          </span>
                        )}
                        <span
                          className={cn(
                            "text-[10px] ml-auto",
                            event.bar.task.status === "완료"
                              ? "text-neutral-400"
                              : event.bar.task.status === "진행"
                                ? "text-blue-500"
                                : "text-muted-foreground",
                          )}
                        >
                          {event.bar.task.status}
                        </span>
                      </div>

                      {/* 담당자 */}
                      {event.bar.task.assignee && (
                        <div
                          className={cn(
                            "text-[10px] mt-1",
                            event.bar.isDone
                              ? "text-neutral-400"
                              : "text-muted-foreground",
                          )}
                        >
                          담당: {event.bar.task.assignee}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
