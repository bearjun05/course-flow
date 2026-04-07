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
  isBefore,
  isAfter,
  isSameDay,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChapterTask } from "@/lib/types";

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
  const week = useMemo(() => {
    const monday = startOfWeek(weekStart, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [weekStart]);

  const monday = week[0];
  const scheduled = useMemo(() => tasks.filter((t) => t.startDate), [tasks]);

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

  const weekLabel = `${format(monday, "M.d")} ~ ${format(week[6], "M.d")}`;
  const weekDayLabels = ["월", "화", "수", "목", "금", "토", "일"];
  const ROW_H = 32;

  // 오늘이 이번 주에 있는지
  const todayColIdx = week.findIndex((d) => isToday(d));

  return (
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
          return (
            <div
              key={i}
              className={cn(
                "text-center py-2.5 border-r border-border last:border-r-0",
                todayFlag && "bg-[#F0EDE8]",
              )}
            >
              <div
                className={cn(
                  "text-[10px]",
                  todayFlag
                    ? "text-neutral-600 font-semibold"
                    : "text-neutral-400",
                )}
              >
                {weekDayLabels[i]}
              </div>
              <div
                className={cn(
                  "text-[15px] font-bold mt-0.5",
                  todayFlag ? "text-neutral-800" : "text-neutral-500",
                )}
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
          height: `${Math.max(barRows.length, 3) * ROW_H + 12}px`,
        }}
      >
        {/* 오늘 배경 칼럼 */}
        {todayColIdx >= 0 && (
          <div
            className="absolute top-0 bottom-0 bg-[#F0EDE8]/60"
            style={{
              left: `${(todayColIdx / 7) * 100}%`,
              width: `${(1 / 7) * 100}%`,
            }}
          />
        )}

        {/* 날짜 구분선 */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px bg-border/40"
            style={{ left: `${(i / 7) * 100}%` }}
          />
        ))}

        {/* 태스크 바 */}
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
                  "absolute text-[12px] font-semibold truncate px-2.5 flex items-center transition-all hover:brightness-95",
                  bar.isStart ? "rounded-l-lg" : "",
                  bar.isEnd ? "rounded-r-lg" : "",
                  done && "opacity-35 line-through",
                )}
                style={{
                  left: `calc(${leftPct}% + 3px)`,
                  width: `calc(${widthPct}% - 6px)`,
                  top: `${rowIdx * ROW_H + 6}px`,
                  height: `${ROW_H - 6}px`,
                  backgroundColor: `${bar.color}35`,
                  color: bar.color,
                  borderLeft: bar.isStart
                    ? `3px solid ${bar.color}`
                    : undefined,
                }}
                title={`${bar.label} (${bar.task.status})${bar.task.assignee ? ` · ${bar.task.assignee}` : ""}`}
              >
                {bar.label}
                {bar.task.assignee && bar.span >= 3 && (
                  <span className="ml-1.5 opacity-70 text-[11px]">
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
  );
}
