"use client";

import { useMemo } from "react";
import {
  addDays,
  startOfWeek,
  startOfDay,
  differenceInDays,
  format,
  parseISO,
  isToday,
  isTomorrow,
  isBefore,
  isAfter,
  isSameDay,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChapterTask } from "@/lib/types";

const TODAY_COLOR = "#6BA3DE";

const GROUP_COLORS = [
  "#B0B0B0",
  "#E4A0A0",
  "#E4B89C",
  "#E4CC9C",
  "#E0D49C",
  "#C8D89C",
  "#9CD4B0",
  "#9CCCC8",
  "#9CB8D8",
  "#B0A8D8",
  "#D0A8C8",
  "#C8BCB0",
];

const STAGE_SHORT: Record<string, string> = {
  교안제작: "교안",
  촬영: "촬영",
  편집: "편집",
  자막: "자막",
  검수: "검수",
  승인: "승인",
  "커리큘럼 기획": "기획",
  롤아웃: "롤아웃",
  업로드: "업로드",
};

interface WeeklyCalendarProps {
  tasks: ChapterTask[];
  weekStart: Date;
  onWeekChange: (d: Date) => void;
  onTaskToggle?: (taskId: string) => void;
  projectStartDate?: string;
  paymentDate?: string;
}

interface TaskBar {
  task: ChapterTask;
  startCol: number;
  span: number;
  isStart: boolean;
  isEnd: boolean;
  color: string;
  label: string;
}

/** 태스크 바를 겹치지 않는 행으로 배치 */
function layoutBars(bars: TaskBar[]): TaskBar[][] {
  const rows: TaskBar[][] = [];
  for (const bar of bars) {
    let placed = false;
    for (const row of rows) {
      const last = row[row.length - 1];
      if (last.startCol + last.span <= bar.startCol) {
        row.push(bar);
        placed = true;
        break;
      }
    }
    if (!placed) rows.push([bar]);
  }
  return rows;
}

export default function WeeklyCalendar({
  tasks,
  weekStart,
  onWeekChange,
  onTaskToggle,
}: WeeklyCalendarProps) {
  // 월요일 시작 주간
  const week = useMemo(() => {
    const monday = startOfWeek(weekStart, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [weekStart]);

  const monday = week[0];

  const scheduled = useMemo(() => tasks.filter((t) => t.startDate), [tasks]);

  // 주간 태스크 바
  const bars = useMemo(() => {
    const weekEnd = week[6];
    const result: TaskBar[] = [];

    for (const task of scheduled) {
      const tStart = startOfDay(parseISO(task.startDate!));
      const tEnd = task.endDate ? startOfDay(parseISO(task.endDate)) : tStart;
      if (isAfter(tStart, weekEnd) || isBefore(tEnd, monday)) continue;

      const visStart = isBefore(tStart, monday) ? monday : tStart;
      const visEnd = isAfter(tEnd, weekEnd) ? weekEnd : tEnd;
      const startCol = differenceInDays(visStart, monday);
      const span = differenceInDays(visEnd, visStart) + 1;
      const color = GROUP_COLORS[task.chapter % GROUP_COLORS.length];
      const shortType = STAGE_SHORT[task.taskType] ?? task.taskType;
      const label =
        task.chapter === 0 ? shortType : `${task.chapter}장 ${shortType}`;

      result.push({
        task,
        startCol,
        span,
        isStart: isSameDay(visStart, tStart),
        isEnd: isSameDay(visEnd, tEnd),
        color,
        label,
      });
    }

    result.sort((a, b) => {
      if (a.task.chapter !== b.task.chapter)
        return a.task.chapter - b.task.chapter;
      return a.startCol - b.startCol;
    });

    return result;
  }, [week, monday, scheduled]);

  const barRows = useMemo(() => layoutBars(bars), [bars]);

  // 오늘/내일 할일
  const todayTasks = useMemo(() => {
    const today = startOfDay(new Date());
    return scheduled.filter((t) => {
      const s = startOfDay(parseISO(t.startDate!));
      const e = t.endDate ? startOfDay(parseISO(t.endDate)) : s;
      return !isBefore(today, s) && !isAfter(today, e) && t.status !== "완료";
    });
  }, [scheduled]);

  const tomorrowTasks = useMemo(() => {
    const tmr = addDays(startOfDay(new Date()), 1);
    return scheduled.filter((t) => {
      const s = startOfDay(parseISO(t.startDate!));
      const e = t.endDate ? startOfDay(parseISO(t.endDate)) : s;
      return !isBefore(tmr, s) && !isAfter(tmr, e) && t.status !== "완료";
    });
  }, [scheduled]);

  const weekLabel = `${format(monday, "M.d")} ~ ${format(week[6], "M.d")}`;
  const weekDayLabels = ["월", "화", "수", "목", "금", "토", "일"];
  const ROW_H = 28;

  return (
    <div className="space-y-3">
      {/* 오늘 / 내일 할일 요약 */}
      <div className="grid grid-cols-2 gap-3">
        <TaskSummaryCard
          title="오늘 할 일"
          tasks={todayTasks}
          accentColor={TODAY_COLOR}
          onToggle={onTaskToggle}
        />
        <TaskSummaryCard
          title="내일 할 일"
          tasks={tomorrowTasks}
          accentColor="#9CA3AF"
          onToggle={onTaskToggle}
        />
      </div>

      {/* 주간 캘린더 */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* 네비게이션 */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onWeekChange(addDays(monday, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{weekLabel}</span>
            <button
              onClick={() => onWeekChange(new Date())}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
            >
              이번 주
            </button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onWeekChange(addDays(monday, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* 요일 + 날짜 헤더 */}
        <div className="grid grid-cols-7 border-b border-border">
          {week.map((day, i) => {
            const todayFlag = isToday(day);
            const tomorrowFlag = isTomorrow(day);
            return (
              <div
                key={i}
                className={cn(
                  "text-center py-2 border-r border-border last:border-r-0",
                  todayFlag && "bg-[#6BA3DE]/[0.06]",
                )}
              >
                <div className="text-[10px] text-neutral-400">
                  {weekDayLabels[i]}
                </div>
                <div
                  className={cn(
                    "text-[13px] font-semibold mt-0.5",
                    todayFlag
                      ? "inline-flex items-center justify-center h-6 w-6 rounded-full text-white mx-auto"
                      : tomorrowFlag
                        ? "text-neutral-600"
                        : "text-neutral-500",
                  )}
                  style={todayFlag ? { backgroundColor: TODAY_COLOR } : {}}
                >
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>

        {/* 태스크 바 영역 */}
        <div
          className="relative"
          style={{
            height: `${Math.max(barRows.length, 3) * ROW_H + 8}px`,
          }}
        >
          {/* 오늘 세로선 */}
          {week.some((d) => isToday(d)) && (
            <div
              className="absolute top-0 bottom-0 w-px z-[1]"
              style={{
                left: `${((differenceInDays(startOfDay(new Date()), monday) + 0.5) / 7) * 100}%`,
                backgroundColor: `${TODAY_COLOR}30`,
              }}
            />
          )}

          {/* 날짜 구분선 */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-border/30"
              style={{ left: `${(i / 7) * 100}%` }}
            />
          ))}

          {barRows.map((row, rowIdx) =>
            row.map((bar) => {
              const done = bar.task.status === "완료";
              const leftPct = (bar.startCol / 7) * 100;
              const widthPct = (bar.span / 7) * 100;

              return (
                <button
                  key={bar.task.id}
                  onClick={() => onTaskToggle?.(bar.task.id)}
                  className={cn(
                    "absolute text-[11px] font-medium truncate px-2 flex items-center transition-opacity hover:opacity-80",
                    bar.isStart ? "rounded-l-md" : "",
                    bar.isEnd ? "rounded-r-md" : "",
                    done && "opacity-40 line-through",
                  )}
                  style={{
                    left: `calc(${leftPct}% + 2px)`,
                    width: `calc(${widthPct}% - 4px)`,
                    top: `${rowIdx * ROW_H + 4}px`,
                    height: `${ROW_H - 4}px`,
                    backgroundColor: `${bar.color}20`,
                    color: bar.color,
                    borderLeft: bar.isStart
                      ? `3px solid ${bar.color}`
                      : undefined,
                  }}
                  title={`${bar.label} (${bar.task.status})${bar.task.assignee ? ` · ${bar.task.assignee}` : ""}`}
                >
                  {bar.label}
                  {bar.task.assignee && bar.span >= 3 && (
                    <span className="ml-1.5 opacity-60 text-[10px]">
                      {bar.task.assignee}
                    </span>
                  )}
                </button>
              );
            }),
          )}

          {bars.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-[12px] text-neutral-300">
              이번 주 일정이 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** 오늘/내일 할일 요약 카드 */
function TaskSummaryCard({
  title,
  tasks,
  accentColor,
  onToggle,
}: {
  title: string;
  tasks: ChapterTask[];
  accentColor: string;
  onToggle?: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
        <span className="text-[12px] font-semibold text-neutral-700">
          {title}
        </span>
        <span className="text-[11px] text-neutral-400 ml-auto">
          {tasks.length}건
        </span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-[11px] text-neutral-300 py-1">할 일이 없어요</p>
      ) : (
        <div className="space-y-1">
          {tasks.slice(0, 5).map((t) => {
            const color = GROUP_COLORS[t.chapter % GROUP_COLORS.length];
            const shortType = STAGE_SHORT[t.taskType] ?? t.taskType;
            const label =
              t.chapter === 0 ? shortType : `${t.chapter}장 ${shortType}`;
            return (
              <button
                key={t.id}
                onClick={() => onToggle?.(t.id)}
                className="w-full flex items-center gap-2 text-left text-[11px] py-1 px-2 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium truncate" style={{ color }}>
                  {label}
                </span>
                {t.assignee && (
                  <span className="text-neutral-400 shrink-0 ml-auto">
                    {t.assignee}
                  </span>
                )}
              </button>
            );
          })}
          {tasks.length > 5 && (
            <p className="text-[10px] text-neutral-400 px-2">
              +{tasks.length - 5}건 더
            </p>
          )}
        </div>
      )}
    </div>
  );
}
