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
import type { ChapterTask, Lecture } from "@/lib/types";
import { CHAPTER_COLORS as GROUP_COLORS } from "@/lib/constants";

const STAGE_SHORT: Record<string, string> = {
  교안제작: "교안",
  촬영: "촬영",
  편집: "편집",
  자막: "자막",
  검수: "검수",
  승인: "승인",
  "커리큘럼 기획": "기획",
};

interface WeeklyCalendarProps {
  tasks: ChapterTask[];
  lectures?: Lecture[];
  weekStart: Date;
  onWeekChange: (d: Date) => void;
  onTaskToggle?: (taskId: string) => void;
  projectStartDate?: string;
  paymentDate?: string;
  tutor?: string;
  pm?: string;
  /** 읽기 전용 (에듀웍스에서 검수자가 아닌 경우 등) */
  readOnly?: boolean;
}

interface TaskBar {
  task: ChapterTask;
  startCol: number;
  span: number;
  isStart: boolean;
  isEnd: boolean;
  color: string;
  label: string;
  /** 업로드 완료 강 수 / 전체 강 수 */
  uploadedCount: number;
  totalCount: number;
  /** 시간 기반 진행률 — 오늘까지 경과 비율 (0~1) */
  timeProgress: number;
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

/** 공정별 강 업로드 URL 키 매핑 */
function getDeliverableKey(taskType: string): string | null {
  switch (taskType) {
    case "교안제작":
      return "lessonPlanUrl";
    case "촬영":
      return "rawVideoUrl";
    case "편집":
      return "editedVideoUrl";
    case "자막":
      return "subtitleUrl";
    case "검수":
      return "reviewUrl";
    default:
      return null;
  }
}

export default function WeeklyCalendar({
  tasks,
  lectures = [],
  weekStart,
  onWeekChange,
  onTaskToggle,
  tutor,
  pm,
  readOnly = false,
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

      // 강별 업로드 현황
      const urlKey = getDeliverableKey(task.taskType);
      let uploadedCount = 0;
      let totalCount = 0;
      if (urlKey && task.chapter > 0) {
        const chLectures = lectures.filter((l) => l.chapter === task.chapter);
        totalCount = chLectures.length;
        uploadedCount = chLectures.filter(
          (l) => !!(l as unknown as Record<string, unknown>)[urlKey],
        ).length;
      }

      // 시간 기반 진행률: 완료면 100%, 아니면 오늘까지 경과 비율
      const today = startOfDay(new Date());
      let timeProgress: number;
      if (
        task.status === "완료" ||
        (totalCount > 0 && uploadedCount >= totalCount)
      ) {
        timeProgress = 1;
      } else if (isBefore(today, tStart)) {
        timeProgress = 0; // 아직 시작 전
      } else if (isAfter(today, tEnd)) {
        timeProgress = 1; // 마감 지남
      } else {
        const totalDays = differenceInDays(tEnd, tStart) + 1;
        const elapsed = differenceInDays(today, tStart) + 1;
        timeProgress = Math.min(1, elapsed / totalDays);
      }

      result.push({
        task,
        startCol,
        span,
        isStart: isSameDay(visStart, tStart),
        isEnd: isSameDay(visEnd, tEnd),
        color,
        label,
        uploadedCount,
        totalCount,
        timeProgress,
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
                todayFlag && "bg-[#F5F3F0]/50",
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
            className="absolute top-0 bottom-0 bg-[#F5F3F0]/30"
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
                disabled={readOnly}
                className={cn(
                  "absolute truncate flex items-center transition-all overflow-hidden border rounded-md",
                  readOnly
                    ? "cursor-default"
                    : "hover:bg-neutral-50 cursor-pointer",
                  done && "opacity-35 line-through",
                )}
                style={{
                  left: `calc(${leftPct}% + 3px)`,
                  width: `calc(${widthPct}% - 6px)`,
                  top: `${rowIdx * ROW_H + 6}px`,
                  height: `${ROW_H - 6}px`,
                  backgroundColor: "white",
                  borderColor: `${bar.color}80`,
                  borderLeftWidth: bar.isStart ? "3px" : "1px",
                  borderLeftColor: bar.isStart ? bar.color : `${bar.color}80`,
                }}
                title={`${bar.label} (${bar.task.status}) ${bar.uploadedCount}/${bar.totalCount}${bar.task.assignee ? ` · ${bar.task.assignee}` : ""}`}
              >
                {/* 시간 진행 게이지 (오늘까지 색칠) */}
                {bar.timeProgress > 0 && (
                  <div
                    className="absolute left-0 top-0 bottom-0 opacity-12 rounded-l-sm"
                    style={{
                      width: `${Math.round(bar.timeProgress * 100)}%`,
                      backgroundColor: bar.color,
                    }}
                  />
                )}
                {/* 왼쪽: 라벨 · 담당자 */}
                <span
                  className="relative z-[1] px-2 text-[12px] font-extrabold truncate"
                  style={{ color: bar.color }}
                >
                  {bar.label}
                  {(() => {
                    const type = bar.task.taskType;
                    const person =
                      type === "교안제작" || type === "촬영"
                        ? tutor
                        : type === "승인"
                          ? pm
                          : bar.task.assignee;
                    return person ? (
                      <span className="font-normal opacity-70">
                        {" "}
                        · {person}
                      </span>
                    ) : null;
                  })()}
                </span>
                {/* 오른쪽: 완료강/전체강 */}
                {bar.totalCount > 0 && (
                  <span
                    className="relative z-[1] text-[11px] font-medium ml-auto pr-2 shrink-0 tabular-nums"
                    style={{ color: bar.color }}
                  >
                    {bar.uploadedCount}/{bar.totalCount}
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
