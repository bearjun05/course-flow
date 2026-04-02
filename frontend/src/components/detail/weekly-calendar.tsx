"use client";

import { useMemo } from "react";
import {
  addDays,
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
  parseISO,
  isWithinInterval,
  isToday,
  isSameMonth,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChapterTask } from "@/lib/types";

const TODAY_COLOR = "#8BA888";

interface WeeklyCalendarProps {
  tasks: ChapterTask[];
  weekStart: Date;
  onWeekChange: (d: Date) => void;
  onTaskToggle?: (taskId: string) => void;
}

function taskLabel(t: ChapterTask): string {
  if (t.chapter === 0) return t.taskType;
  return `${t.chapter}장 ${t.taskType}`;
}

export default function WeeklyCalendar({
  tasks,
  weekStart,
  onWeekChange,
  onTaskToggle,
}: WeeklyCalendarProps) {
  const currentMonth = weekStart;

  // 달력에 표시할 날짜 배열 (월요일 시작, 6주 = 42칸)
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

  // 날짜별 태스크 매핑
  const tasksPerDay = useMemo(() => {
    return days.map((day) =>
      tasks.filter((t) => {
        if (!t.startDate) return false;
        const s = parseISO(t.startDate);
        const e = t.endDate ? parseISO(t.endDate) : s;
        return isWithinInterval(day, { start: s, end: e });
      }),
    );
  }, [days, tasks]);

  const monthLabel = format(currentMonth, "yyyy년 M월", { locale: ko });
  const weekDays = ["월", "화", "수", "목", "금", "토", "일"];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* 네비게이션 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onWeekChange(addMonths(currentMonth, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{monthLabel}</span>
          <button
            onClick={() => onWeekChange(new Date())}
            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#EEF4EE] text-[#7A9A72] hover:bg-[#E6F0E6] transition-colors"
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

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((wd) => (
          <div
            key={wd}
            className="text-center py-1.5 text-[11px] font-medium text-muted-foreground"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 divide-x divide-border">
        {days.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const todayFlag = isToday(day);
          const dayTasks = tasksPerDay[idx];
          const isWeekEnd = idx % 7 >= 5; // 토, 일

          return (
            <div
              key={idx}
              className={cn(
                "min-h-[100px] border-b border-border",
                !isCurrentMonth && "bg-neutral-50/50",
                todayFlag && "bg-[#8BA888]/[0.04]",
              )}
            >
              {/* 날짜 숫자 */}
              <div className="px-1.5 pt-1 pb-0.5 flex items-start justify-between">
                <div
                  className={cn(
                    "text-[11px]",
                    !isCurrentMonth && "text-neutral-300",
                    isCurrentMonth && !todayFlag && "text-neutral-500",
                    isWeekEnd && isCurrentMonth && "text-neutral-400",
                    todayFlag &&
                      "inline-flex items-center justify-center h-5 w-5 rounded-full text-white text-[11px] font-bold",
                  )}
                  style={todayFlag ? { backgroundColor: TODAY_COLOR } : {}}
                >
                  {format(day, "d")}
                </div>
              </div>

              {/* 태스크 카드 */}
              <div className="px-0.5 pb-1 space-y-0.5">
                {dayTasks.slice(0, 3).map((task) => {
                  const done = task.status === "완료";
                  return (
                    <button
                      key={task.id}
                      onClick={() => onTaskToggle?.(task.id)}
                      className={cn(
                        "w-full text-left text-[9px] leading-tight px-1 py-0.5 rounded transition-colors truncate",
                        done
                          ? "bg-neutral-100 text-neutral-400 line-through"
                          : "text-foreground hover:opacity-80",
                      )}
                      style={
                        !done
                          ? {
                              backgroundColor: `${TODAY_COLOR}18`,
                              color: "#5A7A55",
                            }
                          : {}
                      }
                    >
                      <div className="flex items-center gap-0.5">
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-sm border flex items-center justify-center shrink-0",
                            done
                              ? "border-neutral-300 bg-neutral-200 text-neutral-400"
                              : "border-[#8BA888]/40",
                          )}
                          style={
                            done ? {} : { backgroundColor: `${TODAY_COLOR}30` }
                          }
                        >
                          {done && <Check className="h-1.5 w-1.5" />}
                        </span>
                        <span className="truncate">{taskLabel(task)}</span>
                      </div>
                    </button>
                  );
                })}
                {dayTasks.length > 3 && (
                  <span className="text-[9px] text-muted-foreground px-1">
                    +{dayTasks.length - 3}건
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
