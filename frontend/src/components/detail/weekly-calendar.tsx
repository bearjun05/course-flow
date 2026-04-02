"use client";

import { useMemo } from "react";
import {
  addDays,
  startOfWeek,
  format,
  parseISO,
  isWithinInterval,
  isToday,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChapterTask } from "@/lib/types";

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
  const days = useMemo(() => {
    const ws = startOfWeek(weekStart, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  }, [weekStart]);

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

  const weekLabel = `${format(days[0], "M/d", { locale: ko })} ~ ${format(days[6], "M/d", { locale: ko })}`;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onWeekChange(addDays(weekStart, -7))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{weekLabel}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onWeekChange(addDays(weekStart, 7))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7 divide-x divide-border">
        {days.map((day, idx) => (
          <div key={idx} className="min-h-[140px]">
            <div
              className={cn(
                "text-center py-1.5 border-b border-border text-xs",
                isToday(day) && "bg-primary/5",
              )}
            >
              <div
                className={cn("font-medium", isToday(day) && "text-primary")}
              >
                {format(day, "EEE", { locale: ko })}
              </div>
              <div
                className={cn(
                  isToday(day)
                    ? "bg-primary text-primary-foreground rounded-full inline-flex items-center justify-center h-5 w-5 text-[10px]"
                    : "text-muted-foreground",
                )}
              >
                {format(day, "d")}
              </div>
            </div>
            <div className="p-1 space-y-1">
              {tasksPerDay[idx].map((task) => {
                const done = task.status === "완료";
                return (
                  <button
                    key={task.id}
                    onClick={() => onTaskToggle?.(task.id)}
                    className={cn(
                      "w-full text-left text-[10px] leading-tight px-1.5 py-1 rounded-md transition-colors",
                      done
                        ? "bg-muted text-muted-foreground line-through opacity-50"
                        : "bg-primary/10 text-foreground hover:bg-primary/20",
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <span
                        className={cn(
                          "h-3 w-3 rounded border flex items-center justify-center shrink-0",
                          done
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border",
                        )}
                      >
                        {done && <Check className="h-2 w-2" />}
                      </span>
                      <span className="truncate">{taskLabel(task)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
