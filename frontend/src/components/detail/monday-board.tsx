"use client";

import { useMemo, useState, useCallback } from "react";
import {
  parseISO,
  format,
  differenceInDays,
  startOfDay,
  addDays,
  isToday,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronDown, Check, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChapterTask, TaskType } from "@/lib/types";

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

const STAGE_ORDER: TaskType[] = [
  "교안제작",
  "촬영",
  "편집",
  "자막",
  "검수",
  "승인",
];

const STAGE_SHORT: Record<string, string> = {
  교안제작: "교안",
  촬영: "촬영",
  편집: "편집",
  자막: "자막",
  검수: "검수",
  승인: "승인",
  "커리큘럼 기획": "커기",
  롤아웃: "롤아웃",
  업로드: "업로드",
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

/** 하나의 공정 스테이지 칩 */
function StageChip({
  task,
  chapterColor,
  onToggle,
}: {
  task: ChapterTask;
  chapterColor: string;
  onToggle: () => void;
}) {
  const isComplete = task.status === "완료";
  const isActive = task.status === "진행";
  const isReview = task.status === "리뷰";
  const isWaiting = task.status === "대기";
  const label = STAGE_SHORT[task.taskType] ?? task.taskType;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "relative flex items-center justify-center h-8 rounded-lg text-[11px] font-medium transition-all min-w-[52px] px-2",
        isComplete && "text-white shadow-sm",
        isActive && "ring-2 ring-offset-1 text-white shadow-md",
        isReview &&
          "bg-amber-100 text-amber-700 ring-2 ring-amber-300 ring-offset-1",
        isWaiting && "bg-neutral-100 text-neutral-400",
      )}
      style={{
        ...(isComplete ? { backgroundColor: chapterColor } : {}),
        ...(isActive
          ? {
              backgroundColor: chapterColor,
              "--tw-ring-color": chapterColor,
            }
          : {}),
      }}
      title={`${task.taskType}: ${task.status}${task.assignee ? ` (${task.assignee})` : ""}`}
    >
      {isComplete && <Check className="h-3 w-3 mr-0.5 shrink-0" />}
      {label}
    </button>
  );
}

/** 장 단위 진행률 바 */
function ProgressBar({
  completed,
  total,
  color,
}: {
  completed: number;
  total: number;
  color: string;
}) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] text-muted-foreground tabular-nums w-8">
        {pct}%
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini Gantt (장 펼침 시 타임라인)                                     */
/* ------------------------------------------------------------------ */

function MiniGantt({
  tasks,
  chapterColor,
  onToggle,
}: {
  tasks: ChapterTask[];
  chapterColor: string;
  onToggle: (taskId: string) => void;
}) {
  const today = startOfDay(new Date());

  // 날짜가 있는 태스크만 타임라인에 표시
  const scheduled = tasks.filter((t) => t.startDate);
  const unscheduled = tasks.filter((t) => !t.startDate);

  // 전체 날짜 범위 계산
  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (scheduled.length === 0) {
      // 일정이 없으면 오늘 기준 ±7일
      return {
        minDate: addDays(today, -3),
        maxDate: addDays(today, 11),
        totalDays: 15,
      };
    }
    const starts = scheduled.map((t) => parseISO(t.startDate!));
    const ends = scheduled
      .filter((t) => t.endDate)
      .map((t) => parseISO(t.endDate!));
    const allDates = [...starts, ...ends, today];
    let mn = allDates.reduce((a, b) => (a < b ? a : b));
    let mx = allDates.reduce((a, b) => (a > b ? a : b));
    mn = addDays(mn, -1);
    mx = addDays(mx, 2);
    const days = Math.max(differenceInDays(mx, mn) + 1, 7);
    return { minDate: mn, maxDate: mx, totalDays: days };
  }, [scheduled, today]);

  // 날짜 헤더 배열
  const dates = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => addDays(minDate, i)),
    [minDate, totalDays],
  );

  // 오늘 위치 (%)
  const todayOffset = differenceInDays(today, minDate);
  const todayPct = (todayOffset / totalDays) * 100;

  return (
    <div className="px-4 pl-10 pb-3 pt-1">
      <div className="rounded-xl border border-neutral-100 bg-white overflow-hidden">
        {/* 날짜 헤더 */}
        <div className="flex border-b border-neutral-100 bg-neutral-50/50 relative">
          <div className="w-20 shrink-0 px-2 py-1.5 text-xs text-neutral-400 font-medium">
            공정
          </div>
          <div className="flex-1 relative">
            <div className="flex">
              {dates.map((d, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 text-center text-[11px] py-1.5 border-l border-neutral-100/50",
                    isToday(d) && "bg-blue-50/50 font-semibold text-blue-600",
                  )}
                >
                  <div>{format(d, "d", { locale: ko })}</div>
                  <div className="text-neutral-400">
                    {format(d, "EEE", { locale: ko })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 공정별 바 */}
        {scheduled.map((task) => {
          const s = parseISO(task.startDate!);
          const e = task.endDate ? parseISO(task.endDate) : s;
          const startOffset = differenceInDays(s, minDate);
          const span = differenceInDays(e, s) + 1;
          const leftPct = (startOffset / totalDays) * 100;
          const widthPct = (span / totalDays) * 100;

          const isComplete = task.status === "완료";
          const isActive = task.status === "진행";
          const isReview = task.status === "리뷰";
          const isOverdue =
            task.endDate &&
            differenceInDays(today, parseISO(task.endDate)) > 0 &&
            !isComplete;
          const label = STAGE_SHORT[task.taskType] ?? task.taskType;

          return (
            <div
              key={task.id}
              className={cn(
                "flex items-center border-b border-neutral-50 h-10 group hover:bg-neutral-50/30",
                isComplete && "opacity-50",
              )}
            >
              {/* 공정 라벨 */}
              <div className="w-20 shrink-0 px-2 flex items-center gap-1.5">
                <button
                  onClick={() => onToggle(task.id)}
                  className={cn(
                    "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                    isComplete
                      ? "text-white border-transparent"
                      : "border-neutral-300",
                  )}
                  style={isComplete ? { backgroundColor: chapterColor } : {}}
                >
                  {isComplete && <Check className="h-3 w-3" />}
                </button>
                <span
                  className={cn(
                    "text-xs truncate",
                    isComplete && "line-through text-muted-foreground",
                    isActive && "font-semibold",
                  )}
                >
                  {label}
                </span>
              </div>

              {/* 바 영역 */}
              <div className="flex-1 relative h-full">
                {/* 오늘 표시선 */}
                {todayPct >= 0 && todayPct <= 100 && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-blue-400/40 z-10"
                    style={{ left: `${todayPct}%` }}
                  />
                )}
                <div
                  className={cn(
                    "absolute top-1.5 h-7 rounded-md flex items-center justify-center text-[11px] font-medium transition-shadow cursor-pointer",
                    isOverdue
                      ? "bg-red-400/80 text-white"
                      : isReview
                        ? "bg-amber-300 text-amber-800"
                        : isComplete
                          ? "text-white/90"
                          : isActive
                            ? "text-white shadow-sm"
                            : "bg-neutral-200 text-neutral-500",
                  )}
                  style={{
                    left: `${Math.max(leftPct, 0)}%`,
                    width: `${Math.max(widthPct, 3)}%`,
                    ...(isComplete || isActive
                      ? {
                          backgroundColor: isOverdue ? undefined : chapterColor,
                        }
                      : {}),
                    ...(isActive ? { opacity: 0.9 } : {}),
                  }}
                  onClick={() => onToggle(task.id)}
                  title={`${task.taskType}: ${format(s, "M/d")} ~ ${format(e, "M/d")} (${task.status})`}
                >
                  {widthPct > 8 && (
                    <span className="truncate px-1">{task.assignee ?? ""}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* 일정 미정 태스크 */}
        {unscheduled.length > 0 && (
          <div className="border-t border-neutral-100">
            {unscheduled.map((task) => {
              const isComplete = task.status === "완료";
              const label = STAGE_SHORT[task.taskType] ?? task.taskType;
              return (
                <div
                  key={task.id}
                  className="flex items-center h-9 border-b border-neutral-50 last:border-b-0"
                >
                  <div className="w-20 shrink-0 px-2 flex items-center gap-1.5">
                    <button
                      onClick={() => onToggle(task.id)}
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                        isComplete
                          ? "text-white border-transparent"
                          : "border-neutral-300",
                      )}
                      style={
                        isComplete ? { backgroundColor: chapterColor } : {}
                      }
                    >
                      {isComplete && <Check className="h-3 w-3" />}
                    </button>
                    <span className="text-xs text-muted-foreground truncate">
                      {label}
                    </span>
                  </div>
                  <div className="flex-1 px-2 relative">
                    {todayPct >= 0 && todayPct <= 100 && (
                      <div
                        className="absolute top-0 bottom-0 w-px bg-blue-400/40"
                        style={{ left: `${todayPct}%` }}
                      />
                    )}
                    <span className="text-[11px] text-neutral-300">
                      일정 미정
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
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
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

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

  const toggleExpand = useCallback((ch: number) => {
    setExpandedGroups((prev) => {
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

  function getCurrentStage(groupTasks: ChapterTask[]): string | null {
    const active = groupTasks.find(
      (t) => t.status === "진행" || t.status === "리뷰",
    );
    if (active)
      return `${STAGE_SHORT[active.taskType] ?? active.taskType} ${active.status === "리뷰" ? "리뷰 중" : "진행 중"}`;
    const allDone = groupTasks.every((t) => t.status === "완료");
    if (allDone && groupTasks.length > 0) return "완료";
    return null;
  }

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white shadow-sm overflow-hidden">
      {groups.map((group) => {
        const expanded = expandedGroups.has(group.chapter);
        const allDone =
          group.tasks.length > 0 &&
          group.tasks.every((t) => t.status === "완료");
        const currentStage = getCurrentStage(group.tasks);

        const orderedTasks = [...group.tasks].sort((a, b) => {
          const ai = STAGE_ORDER.indexOf(a.taskType);
          const bi = STAGE_ORDER.indexOf(b.taskType);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });

        return (
          <div
            key={group.chapter}
            className={cn(expanded && "bg-neutral-50/30")}
          >
            {/* 메인 행 */}
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-3 border-b border-neutral-100 transition-colors hover:bg-neutral-50/50 cursor-pointer",
                allDone && "opacity-60",
              )}
              style={{ borderLeft: `4px solid ${group.color}` }}
              onClick={() => toggleExpand(group.chapter)}
            >
              <div className="flex items-center gap-2 w-20 shrink-0">
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform",
                    !expanded && "-rotate-90",
                  )}
                />
                <span
                  className="text-sm font-semibold whitespace-nowrap"
                  style={{ color: group.color }}
                >
                  {group.label}
                </span>
              </div>

              <div className="flex items-center gap-1 flex-1 min-w-0">
                {orderedTasks.map((task, i) => (
                  <div key={task.id} className="flex items-center">
                    {i > 0 && (
                      <div
                        className="w-2 h-px mx-0.5"
                        style={{
                          backgroundColor:
                            task.status === "완료" ||
                            orderedTasks[i - 1].status === "완료"
                              ? group.color
                              : "#E5E5E5",
                        }}
                      />
                    )}
                    <StageChip
                      task={task}
                      chapterColor={group.color}
                      onToggle={() => toggleTask(task.id)}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {currentStage && (
                  <span
                    className={cn(
                      "text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
                      allDone
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-neutral-100 text-neutral-500",
                    )}
                  >
                    {currentStage}
                  </span>
                )}
                <ProgressBar
                  completed={group.completedCount}
                  total={group.tasks.length}
                  color={group.color}
                />
              </div>
            </div>

            {/* 펼침: 미니 간트 타임라인 */}
            {expanded && (
              <MiniGantt
                tasks={orderedTasks}
                chapterColor={group.color}
                onToggle={toggleTask}
              />
            )}
          </div>
        );
      })}

      {tasks.length === 0 && (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
          등록된 공정이 없습니다.
        </div>
      )}

      {onAddChapter && (
        <button
          onClick={onAddChapter}
          className="w-full flex items-center justify-center gap-1.5 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors border-t border-dashed border-neutral-200"
        >
          <Plus className="h-3.5 w-3.5" />장 추가
        </button>
      )}
    </div>
  );
}
