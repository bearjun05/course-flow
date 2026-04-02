"use client";

import { useMemo, useState, useCallback } from "react";
import { parseISO, format, differenceInDays, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import {
  ChevronDown,
  Check,
  AlertTriangle,
  GripVertical,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChapterTask, TaskStatus } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const GROUP_COLORS = [
  "#B0B0B0", // CH0 사전 (neutral)
  "#E4A0A0", // CH1 분홍
  "#E4B89C", // CH2 살구
  "#E4CC9C", // CH3 주황
  "#E0D49C", // CH4 노랑
  "#C8D89C", // CH5 연두
  "#9CD4B0", // CH6 초록
  "#9CCCC8", // CH7 민트
  "#9CB8D8", // CH8 하늘
  "#B0A8D8", // CH9 보라
  "#D0A8C8", // CH10 자주
  "#C8BCB0", // CH11 베이지
];

const STATUS_STYLES: Record<TaskStatus, { bg: string; text: string }> = {
  완료: { bg: "bg-[#6ECC9A]", text: "text-white" },
  진행: { bg: "bg-[#8AAE50]", text: "text-white" },
  리뷰: { bg: "bg-[#F5C842]", text: "text-white" },
  대기: { bg: "bg-neutral-200", text: "text-neutral-500" },
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MondayBoardProps {
  tasks: ChapterTask[];
  onTasksChange: (tasks: ChapterTask[]) => void;
  onAddChapter?: () => void;
}

interface ChapterGroup {
  chapter: number;
  label: string;
  color: string;
  tasks: ChapterTask[];
  completedCount: number;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatusCell({
  status,
  onToggle,
}: {
  status: TaskStatus;
  onToggle: () => void;
}) {
  const style = STATUS_STYLES[status];
  return (
    <button
      onClick={onToggle}
      className={cn(
        "h-full w-full flex items-center justify-center text-[11px] font-medium transition-opacity hover:opacity-80",
        style.bg,
        style.text,
      )}
    >
      {status}
    </button>
  );
}

function TimelineBar({ task }: { task: ChapterTask }) {
  if (!task.startDate) {
    return <span className="text-[11px] text-muted-foreground/50">—</span>;
  }

  const start = parseISO(task.startDate);
  const end = task.endDate ? parseISO(task.endDate) : start;
  const today = startOfDay(new Date());
  const totalDays = Math.max(differenceInDays(end, start) + 1, 1);
  const elapsed = Math.max(
    Math.min(differenceInDays(today, start) + 1, totalDays),
    0,
  );
  const pct =
    task.status === "완료" ? 100 : Math.round((elapsed / totalDays) * 100);

  const isOverdue =
    task.endDate &&
    differenceInDays(today, parseISO(task.endDate)) > 0 &&
    task.status !== "완료";

  const barColor = isOverdue
    ? "bg-[#F47A8A]"
    : task.status === "완료"
      ? "bg-[#6ECC9A]"
      : "bg-[#8AAE50]";

  const startStr = format(start, "M/d", { locale: ko });
  const endStr = format(end, "M/d", { locale: ko });

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-5 rounded-full bg-[#F0F0F0] overflow-hidden relative">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-neutral-600">
          {startStr} – {endStr}
        </span>
      </div>
      {isOverdue && (
        <AlertTriangle className="h-3.5 w-3.5 text-[#E2445C] shrink-0" />
      )}
    </div>
  );
}

function GroupSummaryBar({ group }: { group: ChapterGroup }) {
  const pct =
    group.tasks.length === 0
      ? 0
      : Math.round((group.completedCount / group.tasks.length) * 100);

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-14 h-1.5 rounded-full bg-[#F0F0F0] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#00C875] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums">
        {group.completedCount}/{group.tasks.length}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Board                                                         */
/* ------------------------------------------------------------------ */

export default function MondayBoard({
  tasks,
  onTasksChange,
  onAddChapter,
}: MondayBoardProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(
    new Set(),
  );

  const groups: ChapterGroup[] = useMemo(() => {
    const map = new Map<number, ChapterTask[]>();
    for (const t of tasks) {
      if (!map.has(t.chapter)) map.set(t.chapter, []);
      map.get(t.chapter)!.push(t);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([ch, chTasks]) => ({
        chapter: ch,
        label: ch === 0 ? "사전 준비" : `${ch}장`,
        color: GROUP_COLORS[ch % GROUP_COLORS.length],
        tasks: chTasks,
        completedCount: chTasks.filter((t) => t.status === "완료").length,
      }));
  }, [tasks]);

  const toggleGroup = useCallback((ch: number) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(ch)) next.delete(ch);
      else next.add(ch);
      return next;
    });
  }, []);

  const toggleTask = useCallback(
    (taskId: string) => {
      onTasksChange(
        tasks.map((t) =>
          t.id === taskId
            ? { ...t, status: t.status === "완료" ? "진행" : "완료" }
            : t,
        ),
      );
    },
    [tasks, onTasksChange],
  );

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white shadow-sm overflow-hidden">
      {/* Column headers */}
      <div className="grid grid-cols-[minmax(220px,2fr)_90px_100px_minmax(160px,1fr)] border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
        <div className="px-4 py-2">공정</div>
        <div className="px-2 py-2 text-center">상태</div>
        <div className="px-2 py-2 text-center">담당자</div>
        <div className="px-3 py-2">타임라인</div>
      </div>

      {/* Groups */}
      {groups.map((group) => {
        const collapsed = collapsedGroups.has(group.chapter);
        return (
          <div key={group.chapter}>
            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.chapter)}
              className="w-full grid grid-cols-[minmax(220px,2fr)_90px_100px_minmax(160px,1fr)] items-center border-b border-neutral-100 hover:bg-accent/30 transition-colors"
              style={{ borderLeft: `3px solid ${group.color}` }}
            >
              <div className="px-4 py-2 flex items-center gap-2">
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform",
                    collapsed && "-rotate-90",
                  )}
                />
                <span
                  className="text-xs font-semibold"
                  style={{ color: group.color }}
                >
                  {group.label}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {group.tasks.length}개 공정
                </span>
              </div>
              <div />
              <div />
              <div className="px-3 py-2">
                <GroupSummaryBar group={group} />
              </div>
            </button>

            {/* Tasks */}
            {!collapsed &&
              group.tasks.map((task) => (
                <div
                  key={task.id}
                  className="grid grid-cols-[minmax(220px,2fr)_90px_100px_minmax(160px,1fr)] items-center border-b border-neutral-100/50 hover:bg-accent/20 transition-colors group"
                  style={{ borderLeft: `3px solid ${group.color}20` }}
                >
                  {/* Task name */}
                  <div className="px-4 py-1.5 flex items-center gap-2">
                    <GripVertical className="h-3 w-3 text-transparent group-hover:text-muted-foreground/40 transition-colors shrink-0" />
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                        task.status === "완료"
                          ? "bg-[#6ECC9A] border-[#6ECC9A] text-white"
                          : "border-neutral-300 hover:border-[#00C875]",
                      )}
                    >
                      {task.status === "완료" && <Check className="h-3 w-3" />}
                    </button>
                    <span
                      className={cn(
                        "text-sm",
                        task.status === "완료" &&
                          "line-through text-muted-foreground",
                      )}
                    >
                      {task.taskType}
                    </span>
                  </div>

                  {/* Status cell */}
                  <div className="h-8">
                    <StatusCell
                      status={task.status}
                      onToggle={() => toggleTask(task.id)}
                    />
                  </div>

                  {/* Assignee */}
                  <div className="px-2 py-1.5 text-center">
                    {task.assignee ? (
                      <span className="inline-flex items-center h-6 px-2 rounded-full bg-[#F0F0F0] text-[11px] font-medium">
                        {task.assignee}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/40">
                        —
                      </span>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="px-3 py-1.5">
                    <TimelineBar task={task} />
                  </div>
                </div>
              ))}
          </div>
        );
      })}

      {tasks.length === 0 && (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
          등록된 공정이 없습니다.
        </div>
      )}

      {/* 장 추가 버튼 */}
      {onAddChapter && (
        <button
          onClick={onAddChapter}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors border-t border-dashed border-neutral-200"
        >
          <Plus className="h-3.5 w-3.5" />장 추가
        </button>
      )}
    </div>
  );
}
