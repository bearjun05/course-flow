"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  differenceInDays,
  parseISO,
  format,
  isToday,
  startOfDay,
  isBefore,
} from "date-fns";
import { ko } from "date-fns/locale";
import { AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChapterTask } from "@/lib/types";

type ZoomLevel = "1w" | "2w" | "1m";

interface GanttChartProps {
  tasks: ChapterTask[];
  zoom: ZoomLevel;
  onTaskToggle?: (taskId: string) => void;
  selectedIds?: Set<string>;
  onSelectToggle?: (taskId: string) => void;
}

function getZoomDays(zoom: ZoomLevel): number {
  if (zoom === "1w") return 7;
  if (zoom === "2w") return 14;
  return 30;
}

function taskLabel(t: ChapterTask): string {
  if (t.chapter === 0) return t.taskType;
  return `${t.chapter}장 ${t.taskType}`;
}

const CHAPTER_COLORS = [
  "bg-[#E4A0A0]/70", // CH0→CH1 분홍
  "bg-[#E4B89C]/70", // CH2 살구
  "bg-[#E4CC9C]/70", // CH3 주황
  "bg-[#E0D49C]/70", // CH4 노랑
  "bg-[#C8D89C]/70", // CH5 연두
  "bg-[#9CD4B0]/70", // CH6 초록
  "bg-[#9CCCC8]/70", // CH7 민트
  "bg-[#9CB8D8]/70", // CH8 하늘
  "bg-[#B0A8D8]/70", // CH9 보라
  "bg-[#D0A8C8]/70", // CH10 자주
  "bg-[#C8BCB0]/70", // CH11 베이지
];

export default function GanttChart({
  tasks,
  zoom,
  onTaskToggle,
  selectedIds,
  onSelectToggle,
}: GanttChartProps) {
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  const { scheduledTasks, unscheduledTasks, startDate, totalDays, dates } =
    useMemo(() => {
      const zoomDays = getZoomDays(zoom);
      const today = startOfDay(new Date());

      const scheduled = tasks.filter((t) => t.startDate);
      const unscheduled = tasks.filter((t) => !t.startDate);

      if (scheduled.length === 0) {
        const ds = Array.from({ length: zoomDays }, (_, i) =>
          addDays(today, i - Math.floor(zoomDays / 2)),
        );
        return {
          scheduledTasks: [],
          unscheduledTasks: unscheduled,
          startDate: ds[0],
          totalDays: zoomDays,
          dates: ds,
        };
      }

      const allStarts = scheduled.map((t) => parseISO(t.startDate!));
      const allEnds = scheduled
        .filter((t) => t.endDate)
        .map((t) => parseISO(t.endDate!));

      let minDate = allStarts.reduce((a, b) => (a < b ? a : b));
      let maxDate = [...allStarts, ...allEnds].reduce((a, b) =>
        a > b ? a : b,
      );

      minDate = addDays(minDate, -2);
      maxDate = addDays(maxDate, 2);
      const rangeDays = Math.max(
        differenceInDays(maxDate, minDate) + 1,
        zoomDays,
      );

      const ds = Array.from({ length: rangeDays }, (_, i) =>
        addDays(minDate, i),
      );

      const sorted = [...scheduled].sort((a, b) => {
        const da = parseISO(a.startDate!);
        const db = parseISO(b.startDate!);
        return da.getTime() - db.getTime();
      });

      return {
        scheduledTasks: sorted,
        unscheduledTasks: unscheduled,
        startDate: minDate,
        totalDays: rangeDays,
        dates: ds,
      };
    }, [tasks, zoom]);

  const todayIdx = useMemo(() => {
    const today = startOfDay(new Date());
    return differenceInDays(today, startDate);
  }, [startDate]);

  const COL_W = zoom === "1m" ? 28 : 40;

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <div
        className="relative min-w-max"
        style={{ width: `${200 + totalDays * COL_W}px` }}
      >
        {/* Date header */}
        <div className="flex border-b border-border sticky top-0 bg-card z-10">
          <div className="w-[200px] shrink-0 px-3 py-2 text-xs font-medium text-muted-foreground border-r border-border">
            태스크
          </div>
          <div className="flex">
            {dates.map((d, i) => (
              <div
                key={i}
                className={cn(
                  "text-center text-[10px] py-2 border-r border-border/50",
                  isToday(d) && "bg-primary/5 font-semibold text-primary",
                )}
                style={{ width: `${COL_W}px` }}
              >
                <div>{format(d, "d", { locale: ko })}</div>
                <div className="text-muted-foreground/60">
                  {format(d, "EEE", { locale: ko })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today line */}
        {todayIdx >= 0 && todayIdx < totalDays && (
          <div
            className="absolute top-0 bottom-0 w-px bg-destructive/60 z-[5] pointer-events-none"
            style={{ left: `${200 + todayIdx * COL_W + COL_W / 2}px` }}
          />
        )}

        {/* Task rows */}
        {scheduledTasks.map((task) => {
          const s = parseISO(task.startDate!);
          const e = task.endDate ? parseISO(task.endDate) : s;
          const startCol = differenceInDays(s, startDate);
          const span = differenceInDays(e, s) + 1;
          const isComplete = task.status === "완료";
          const isOverdue =
            task.endDate &&
            isBefore(parseISO(task.endDate), new Date()) &&
            !isComplete;
          const colorClass =
            CHAPTER_COLORS[task.chapter % CHAPTER_COLORS.length];

          return (
            <div
              key={task.id}
              className={cn(
                "flex items-center border-b border-border/50 h-9 group",
                isComplete && "opacity-40",
                hoveredTask === task.id && "bg-accent/30",
              )}
              onMouseEnter={() => setHoveredTask(task.id)}
              onMouseLeave={() => setHoveredTask(null)}
            >
              {/* Label */}
              <div className="w-[200px] shrink-0 px-3 flex items-center gap-2 text-xs border-r border-border">
                {onSelectToggle && (
                  <input
                    type="checkbox"
                    checked={selectedIds?.has(task.id) ?? false}
                    onChange={() => onSelectToggle(task.id)}
                    className="h-3.5 w-3.5 rounded accent-primary"
                  />
                )}
                <button
                  onClick={() => onTaskToggle?.(task.id)}
                  className={cn(
                    "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                    isComplete
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border hover:border-primary",
                  )}
                >
                  {isComplete && <Check className="h-3 w-3" />}
                </button>
                <span className="truncate">{taskLabel(task)}</span>
                {task.assignee && (
                  <span className="text-muted-foreground truncate">
                    {task.assignee}
                  </span>
                )}
              </div>

              {/* Bar area */}
              <div className="relative flex-1 h-full">
                {startCol >= 0 && (
                  <div
                    className={cn(
                      "absolute top-1.5 h-6 rounded-md flex items-center px-1.5 text-[10px] text-white cursor-pointer transition-shadow hover:shadow-md",
                      isOverdue ? "bg-destructive/80" : colorClass,
                    )}
                    style={{
                      left: `${startCol * COL_W + 2}px`,
                      width: `${Math.max(span * COL_W - 4, 16)}px`,
                    }}
                    title={`${task.startDate} ~ ${task.endDate ?? "진행 중"}`}
                  >
                    {isOverdue && (
                      <AlertTriangle className="h-3 w-3 mr-0.5 shrink-0" />
                    )}
                    {span * COL_W > 50 && (
                      <span className="truncate">{taskLabel(task)}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Unscheduled tasks */}
        {unscheduledTasks.length > 0 && (
          <>
            <div className="flex items-center h-8 border-b border-border/50 bg-muted/30 px-3 text-xs font-medium text-muted-foreground">
              미정 ({unscheduledTasks.length}건)
            </div>
            {unscheduledTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "flex items-center border-b border-border/50 h-9",
                  task.status === "완료" && "opacity-40",
                )}
              >
                <div className="w-[200px] shrink-0 px-3 flex items-center gap-2 text-xs border-r border-border">
                  {onSelectToggle && (
                    <input
                      type="checkbox"
                      checked={selectedIds?.has(task.id) ?? false}
                      onChange={() => onSelectToggle(task.id)}
                      className="h-3.5 w-3.5 rounded accent-primary"
                    />
                  )}
                  <button
                    onClick={() => onTaskToggle?.(task.id)}
                    className={cn(
                      "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                      task.status === "완료"
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border hover:border-primary",
                    )}
                  >
                    {task.status === "완료" && <Check className="h-3 w-3" />}
                  </button>
                  <span className="truncate">{taskLabel(task)}</span>
                </div>
                <div className="flex-1 px-3 text-[10px] text-muted-foreground">
                  일정 미정
                </div>
              </div>
            ))}
          </>
        )}

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            등록된 태스크가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
