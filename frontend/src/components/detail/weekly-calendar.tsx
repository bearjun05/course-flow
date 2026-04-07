"use client";

import { useMemo } from "react";
import {
  addDays,
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  differenceInDays,
  format,
  parseISO,
  isToday,
  isSameDay,
  isSameMonth,
  isBefore,
  isAfter,
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

/** 태스크가 해당 주(week row)에 걸치는 부분 계산 */
interface TaskBar {
  task: ChapterTask;
  /** 주 내에서 시작 칼럼 (0~6) */
  startCol: number;
  /** 칸 수 (1~7) */
  span: number;
  /** 왼쪽 끝이 태스크 실제 시작인지 */
  isStart: boolean;
  /** 오른쪽 끝이 태스크 실제 끝인지 */
  isEnd: boolean;
  color: string;
  label: string;
}

export default function WeeklyCalendar({
  tasks,
  weekStart,
  onWeekChange,
  onTaskToggle,
  projectStartDate,
  paymentDate,
}: WeeklyCalendarProps) {
  const currentMonth = weekStart;

  const projectRange = useMemo(() => {
    const rangeStart = projectStartDate
      ? startOfDay(parseISO(projectStartDate))
      : null;
    const rangeEnd = paymentDate
      ? addDays(startOfDay(parseISO(paymentDate)), 7)
      : null;
    return { start: rangeStart, end: rangeEnd };
  }, [projectStartDate, paymentDate]);

  const canGoPrev = useMemo(() => {
    if (!projectRange.start) return true;
    const prevMonth = addMonths(currentMonth, -1);
    return !isBefore(endOfMonth(prevMonth), startOfMonth(projectRange.start));
  }, [currentMonth, projectRange.start]);

  // 달력 날짜 배열
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const result: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      result.push(day);
      day = addDays(day, 1);
    }
    return result;
  }, [currentMonth]);

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  // 일정 있는 태스크만
  const scheduled = useMemo(() => tasks.filter((t) => t.startDate), [tasks]);

  // 주별 태스크 바 계산
  const weekBars = useMemo(() => {
    return weeks.map((week) => {
      const weekStart = week[0];
      const weekEnd = week[6];
      const bars: TaskBar[] = [];

      for (const task of scheduled) {
        const tStart = startOfDay(parseISO(task.startDate!));
        const tEnd = task.endDate ? startOfDay(parseISO(task.endDate)) : tStart;

        // 이 주와 겹치는지
        if (isAfter(tStart, weekEnd) || isBefore(tEnd, weekStart)) continue;

        const visStart = isBefore(tStart, weekStart) ? weekStart : tStart;
        const visEnd = isAfter(tEnd, weekEnd) ? weekEnd : tEnd;

        const startCol = differenceInDays(visStart, weekStart);
        const span = differenceInDays(visEnd, visStart) + 1;
        const color = GROUP_COLORS[task.chapter % GROUP_COLORS.length];
        const shortType = STAGE_SHORT[task.taskType] ?? task.taskType;
        const label =
          task.chapter === 0 ? shortType : `${task.chapter}장 ${shortType}`;

        bars.push({
          task,
          startCol,
          span,
          isStart: isSameDay(visStart, tStart),
          isEnd: isSameDay(visEnd, tEnd),
          color,
          label,
        });
      }

      // 장→공정 순 정렬
      bars.sort((a, b) => {
        if (a.task.chapter !== b.task.chapter)
          return a.task.chapter - b.task.chapter;
        return a.startCol - b.startCol;
      });

      return bars;
    });
  }, [weeks, scheduled]);

  const monthLabel = format(currentMonth, "yyyy년 M월", { locale: ko });
  const weekDayLabels = ["월", "화", "수", "목", "금", "토", "일"];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* 네비게이션 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 w-7 p-0",
            !canGoPrev && "opacity-30 pointer-events-none",
          )}
          onClick={() => canGoPrev && onWeekChange(addMonths(currentMonth, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{monthLabel}</span>
          <button
            onClick={() => onWeekChange(new Date())}
            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
          >
            오늘
          </button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onWeekChange(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 프로젝트 범위 */}
      {(projectRange.start || projectRange.end) && (
        <div className="flex items-center justify-center gap-3 px-4 py-1.5 border-b border-border bg-neutral-50/50 text-[11px] text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#6BA3DE]" />
            프로젝트 기간
          </span>
          <span className="tabular-nums">
            {projectRange.start ? format(projectRange.start, "yy.MM.dd") : "—"}
            {" ~ "}
            {projectRange.end ? format(projectRange.end, "yy.MM.dd") : "—"}
          </span>
        </div>
      )}

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDayLabels.map((wd) => (
          <div
            key={wd}
            className="text-center py-1.5 text-[11px] font-medium text-muted-foreground"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* 주별 행 */}
      {weeks.map((week, weekIdx) => {
        const bars = weekBars[weekIdx];

        return (
          <div key={weekIdx} className="border-b border-border">
            {/* 날짜 숫자 행 */}
            <div className="grid grid-cols-7">
              {week.map((day, dayIdx) => {
                const todayFlag = isToday(day);
                const inRange =
                  projectRange.start && projectRange.end
                    ? !isBefore(day, projectRange.start) &&
                      !isAfter(day, projectRange.end)
                    : true;
                const isMonth = isSameMonth(day, currentMonth);

                return (
                  <div
                    key={dayIdx}
                    className={cn(
                      "px-1.5 pt-1.5 pb-0.5 border-r border-border last:border-r-0",
                      !inRange && "bg-neutral-50/60",
                      todayFlag && "bg-[#6BA3DE]/[0.06]",
                    )}
                  >
                    <div
                      className={cn(
                        "text-[11px]",
                        todayFlag
                          ? "inline-flex items-center justify-center h-5 w-5 rounded-full text-white font-bold"
                          : inRange && isMonth
                            ? "text-neutral-700 font-medium"
                            : "text-neutral-300",
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
                minHeight:
                  bars.length > 0 ? `${bars.length * 22 + 4}px` : "24px",
              }}
            >
              {bars.map((bar, barIdx) => {
                const done = bar.task.status === "완료";
                const leftPct = (bar.startCol / 7) * 100;
                const widthPct = (bar.span / 7) * 100;

                return (
                  <button
                    key={bar.task.id}
                    onClick={() => onTaskToggle?.(bar.task.id)}
                    className={cn(
                      "absolute text-[9px] font-medium truncate px-1.5 h-[18px] flex items-center transition-opacity hover:opacity-80",
                      bar.isStart ? "rounded-l-md" : "rounded-l-none",
                      bar.isEnd ? "rounded-r-md" : "rounded-r-none",
                      done && "opacity-50 line-through",
                    )}
                    style={{
                      left: `calc(${leftPct}% + 2px)`,
                      width: `calc(${widthPct}% - 4px)`,
                      top: `${barIdx * 22 + 2}px`,
                      backgroundColor: `${bar.color}25`,
                      color: bar.color,
                      borderLeft: bar.isStart
                        ? `3px solid ${bar.color}`
                        : undefined,
                    }}
                    title={`${bar.label} (${bar.task.status})`}
                  >
                    {bar.span >= 2 ? bar.label : ""}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
