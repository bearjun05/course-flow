"use client";

import { useState, useCallback } from "react";
import { startOfWeek } from "date-fns";
import { BarChart3, CalendarDays, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChapterTask } from "@/lib/types";
import GanttChart from "./gantt-chart";
import WeeklyCalendar from "./weekly-calendar";

type ViewMode = "gantt" | "calendar";
type ZoomLevel = "1w" | "2w" | "1m";

interface ScheduleTaskTabProps {
  tasks: ChapterTask[];
  onTasksChange: (tasks: ChapterTask[]) => void;
}

export default function ScheduleTaskTab({
  tasks,
  onTasksChange,
}: ScheduleTaskTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("gantt");
  const [zoom, setZoom] = useState<ZoomLevel>("2w");
  const [weekStart, setWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleTask = useCallback(
    (taskId: string) => {
      onTasksChange(
        tasks.map((t) =>
          t.id === taskId
            ? { ...t, status: t.status === "완료" ? "진행" : "완료" }
            : t
        )
      );
    },
    [tasks, onTasksChange]
  );

  const toggleSelect = useCallback((taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const bulkComplete = useCallback(() => {
    if (selectedIds.size === 0) return;
    onTasksChange(
      tasks.map((t) =>
        selectedIds.has(t.id) ? { ...t, status: "완료" } : t
      )
    );
    setSelectedIds(new Set());
  }, [selectedIds, tasks, onTasksChange]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 bg-muted/30">
          <Button
            variant={viewMode === "gantt" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setViewMode("gantt")}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            간트
          </Button>
          <Button
            variant={viewMode === "calendar" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setViewMode("calendar")}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            캘린더
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={bulkComplete}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              {selectedIds.size}건 완료 처리
            </Button>
          )}

          {viewMode === "gantt" && (
            <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 bg-muted/30">
              {(["1w", "2w", "1m"] as const).map((z) => (
                <Button
                  key={z}
                  variant={zoom === z ? "secondary" : "ghost"}
                  size="sm"
                  className={cn("h-7 text-xs px-2")}
                  onClick={() => setZoom(z)}
                >
                  {z === "1w" ? "1주" : z === "2w" ? "2주" : "1개월"}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View content */}
      {viewMode === "gantt" ? (
        <GanttChart
          tasks={tasks}
          zoom={zoom}
          onTaskToggle={toggleTask}
          selectedIds={selectedIds}
          onSelectToggle={toggleSelect}
        />
      ) : (
        <WeeklyCalendar
          tasks={tasks}
          weekStart={weekStart}
          onWeekChange={setWeekStart}
          onTaskToggle={toggleTask}
        />
      )}
    </div>
  );
}
