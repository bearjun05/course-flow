"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import {
  parseISO,
  format,
  differenceInDays,
  startOfDay,
  addDays,
  isToday,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronDown, Check, Plus, Rocket } from "lucide-react";
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
  "커리큘럼 기획": "목차",
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
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDateRange(task: ChapterTask): string | null {
  if (!task.startDate) return null;
  const s = format(parseISO(task.startDate), "M/d");
  if (!task.endDate) return `${s}~`;
  const e = format(parseISO(task.endDate), "M/d");
  return `${s}~${e}`;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** 하나의 공정 스테이지 칩 — 호버 시 기간 표시 */
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
  const isOverdue =
    !isComplete &&
    task.endDate &&
    differenceInDays(startOfDay(new Date()), parseISO(task.endDate)) > 0;
  const label = STAGE_SHORT[task.taskType] ?? task.taskType;
  const dateRange = formatDateRange(task);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "group/chip relative flex items-center justify-center h-8 rounded-lg text-[11px] font-medium transition-all min-w-[52px] px-2",
        isComplete && "bg-neutral-200 text-neutral-500",
        isOverdue && "bg-red-400/90 text-white shadow-sm",
        !isComplete && !isOverdue && isActive && "text-white shadow-sm",
        !isComplete &&
          !isOverdue &&
          isReview &&
          "bg-amber-100 text-amber-700 ring-2 ring-amber-300 ring-offset-1",
        isWaiting && !isOverdue && "bg-neutral-100 text-neutral-400",
      )}
      style={{
        ...(!isComplete && !isOverdue && isActive
          ? { backgroundColor: TODAY_COLOR }
          : {}),
      }}
    >
      {isComplete && (
        <Check className="h-3 w-3 mr-0.5 shrink-0 text-neutral-400" />
      )}
      {label}
      {/* 호버 시 기간 툴팁 — 글래스모피즘, 상단 */}
      {dateRange && (
        <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-white/70 backdrop-blur-md border border-white/50 px-3 py-1.5 text-xs font-semibold text-neutral-700 opacity-0 group-hover/chip:opacity-100 transition-opacity z-20 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          {dateRange}
        </span>
      )}
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
/*  Mini Gantt (장 펼침 시 타임라인) + 가로스크롤 + 드래그 리사이즈          */
/* ------------------------------------------------------------------ */

const COL_W = 44; // 날짜 열 1칸 폭 (px)
const TOTAL_RANGE = 60; // 전체 표시 범위 (일)
const TODAY_COLOR = "#8BA888"; // 오늘 색상 (빈티지 그린)

function MiniGantt({
  tasks,
  chapterColor,
  onToggle,
  onTaskDateChange,
}: {
  tasks: ChapterTask[];
  chapterColor: string;
  onToggle: (taskId: string) => void;
  onTaskDateChange: (
    taskId: string,
    startDate: string,
    endDate: string,
  ) => void;
}) {
  const today = startOfDay(new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const scheduled = tasks.filter((t) => t.startDate);
  const unscheduled = tasks.filter((t) => !t.startDate);

  // 오늘 기준 앞뒤로 넉넉하게 범위 설정
  const minDate = useMemo(() => addDays(today, -20), [today]);
  const totalDays = TOTAL_RANGE;

  const dates = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => addDays(minDate, i)),
    [minDate, totalDays],
  );

  const todayIndex = differenceInDays(today, minDate);

  // 오늘을 1/3 위치에 놓도록 초기 스크롤
  const scrollToToday = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const viewW = el.clientWidth;
    const targetLeft = todayIndex * COL_W - viewW / 3;
    el.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
  }, [todayIndex]);

  // 마운트 시 + 오늘 위치 세팅
  useState(() => {
    // setTimeout으로 DOM 렌더 후 스크롤
    setTimeout(() => scrollToToday(), 50);
  });

  // 스크롤 시 화살표 표시 여부 판단
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const viewW = el.clientWidth;
    const todayLeft = todayIndex * COL_W;
    const scrollLeft = el.scrollLeft;
    const scrollRight = scrollLeft + viewW;

    // 오늘이 뷰포트 밖이면 화살표 표시
    setShowLeftArrow(todayLeft < scrollLeft);
    setShowRightArrow(todayLeft > scrollRight - COL_W);
  }, [todayIndex]);

  /** 드래그 공통 */
  const handleDragStart = useCallback(
    (
      e: React.MouseEvent,
      task: ChapterTask,
      mode: "left" | "right" | "move",
    ) => {
      e.stopPropagation();
      e.preventDefault();

      const origStart = parseISO(task.startDate!);
      const origEnd = task.endDate ? parseISO(task.endDate) : origStart;
      const startX = e.clientX;

      const onMove = (ev: MouseEvent) => {
        let newStart = origStart;
        let newEnd = origEnd;
        const deltaDays = Math.round((ev.clientX - startX) / COL_W);

        if (mode === "move") {
          newStart = addDays(origStart, deltaDays);
          newEnd = addDays(origEnd, deltaDays);
        } else if (mode === "left") {
          const candidate = addDays(origStart, deltaDays);
          newStart = candidate <= origEnd ? candidate : origEnd;
        } else {
          const candidate = addDays(origEnd, deltaDays);
          newEnd = candidate >= origStart ? candidate : origStart;
        }

        onTaskDateChange(
          task.id,
          format(newStart, "yyyy-MM-dd"),
          format(newEnd, "yyyy-MM-dd"),
        );
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [onTaskDateChange],
  );

  const contentWidth = totalDays * COL_W;

  return (
    <div className="px-4 pl-10 pb-3 pt-1 relative" ref={containerRef}>
      {/* 왼쪽 화살표: 오늘로 이동 */}
      {showLeftArrow && (
        <button
          onClick={scrollToToday}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-neutral-200 shadow-md flex items-center justify-center hover:bg-white transition-colors"
          title="오늘로 이동"
        >
          <ChevronDown className="h-4 w-4 rotate-90 text-[#8BA888]" />
        </button>
      )}
      {/* 오른쪽 화살표 */}
      {showRightArrow && (
        <button
          onClick={scrollToToday}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-neutral-200 shadow-md flex items-center justify-center hover:bg-white transition-colors"
          title="오늘로 이동"
        >
          <ChevronDown className="h-4 w-4 -rotate-90 text-[#8BA888]" />
        </button>
      )}

      <div className="rounded-xl border border-neutral-100 bg-white overflow-hidden">
        <div className="flex">
          {/* 고정 라벨 열 */}
          <div className="w-20 shrink-0 z-10 bg-white">
            {/* 헤더 빈칸 */}
            <div className="h-12 border-b border-neutral-100 bg-neutral-50/50" />
            {/* 공정 라벨들 */}
            {scheduled.map((task) => {
              const isComplete = task.status === "완료";
              const isActive = task.status === "진행";
              const label = STAGE_SHORT[task.taskType] ?? task.taskType;
              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center h-10 px-2 gap-1.5 border-b border-neutral-50",
                    isComplete && "opacity-50",
                  )}
                >
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
              );
            })}
            {/* 일정 미정 라벨 */}
            {unscheduled.map((task) => {
              const isComplete = task.status === "완료";
              const label = STAGE_SHORT[task.taskType] ?? task.taskType;
              return (
                <div
                  key={task.id}
                  className="flex items-center h-9 px-2 gap-1.5 border-b border-neutral-50 last:border-b-0"
                >
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
                  <span className="text-xs text-muted-foreground truncate">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 스크롤 가능한 타임라인 영역 */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onScroll={handleScroll}
          >
            <div style={{ width: contentWidth, minWidth: contentWidth }}>
              {/* 날짜 헤더 */}
              <div className="flex border-b border-neutral-100 bg-neutral-50/50 h-12 relative">
                {dates.map((d, i) => {
                  const isTodayCol = isToday(d);
                  return (
                    <div
                      key={i}
                      className={cn(
                        "text-center text-[11px] py-1 border-l border-neutral-100/50 relative",
                        isTodayCol && "bg-[#6B8DE3]/[0.06]",
                      )}
                      style={{ width: COL_W }}
                    >
                      {isTodayCol && (
                        <span
                          className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-[7px] font-bold tracking-wider uppercase"
                          style={{ color: TODAY_COLOR }}
                        >
                          today
                        </span>
                      )}
                      <div
                        className={cn("mt-1")}
                        style={isTodayCol ? {} : undefined}
                      >
                        {isTodayCol ? (
                          <span
                            className="inline-flex items-center justify-center h-5 w-5 rounded-full text-white text-[11px] font-bold"
                            style={{ backgroundColor: TODAY_COLOR }}
                          >
                            {format(d, "d", { locale: ko })}
                          </span>
                        ) : (
                          format(d, "d", { locale: ko })
                        )}
                      </div>
                      <div
                        className={cn(
                          "text-[10px]",
                          isTodayCol ? "font-semibold" : "text-neutral-400",
                        )}
                        style={isTodayCol ? { color: TODAY_COLOR } : {}}
                      >
                        {format(d, "EEE", { locale: ko })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 공정별 바 */}
              {scheduled.map((task) => {
                const s = parseISO(task.startDate!);
                const e = task.endDate ? parseISO(task.endDate) : s;
                const startOff = differenceInDays(s, minDate);
                const span = differenceInDays(e, s) + 1;
                const leftPx = startOff * COL_W;
                const widthPx = span * COL_W;

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
                      "relative border-b border-neutral-50 h-10 group hover:bg-neutral-50/30",
                      isComplete && "opacity-50",
                    )}
                  >
                    {/* 오늘 세로선 */}
                    <div
                      className="absolute top-0 bottom-0 w-px z-10"
                      style={{
                        left: todayIndex * COL_W + COL_W / 2,
                        backgroundColor: `${TODAY_COLOR}40`,
                      }}
                    />
                    {/* 간트 바 */}
                    <div
                      className={cn(
                        "absolute top-1.5 h-7 rounded-md flex items-center justify-center text-[11px] font-medium transition-shadow group/bar",
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
                        left: leftPx,
                        width: Math.max(widthPx, COL_W * 0.6),
                        ...(isComplete || isActive
                          ? {
                              backgroundColor: isOverdue
                                ? undefined
                                : chapterColor,
                            }
                          : {}),
                        ...(isActive ? { opacity: 0.9 } : {}),
                      }}
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-10 opacity-0 group-hover/bar:opacity-100 transition-opacity rounded-l-md hover:bg-black/10"
                        onMouseDown={(ev) => handleDragStart(ev, task, "left")}
                      />
                      <div
                        className="absolute left-2 right-2 top-0 bottom-0 cursor-grab active:cursor-grabbing flex items-center justify-center"
                        onMouseDown={(ev) => handleDragStart(ev, task, "move")}
                      >
                        <span className="truncate px-1 pointer-events-none select-none">
                          {widthPx > COL_W * 2 ? (task.assignee ?? label) : ""}
                        </span>
                      </div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-10 opacity-0 group-hover/bar:opacity-100 transition-opacity rounded-r-md hover:bg-black/10"
                        onMouseDown={(ev) => handleDragStart(ev, task, "right")}
                      />
                    </div>
                  </div>
                );
              })}

              {/* 일정 미정 */}
              {unscheduled.map((task) => (
                <div
                  key={task.id}
                  className="relative h-9 border-b border-neutral-50 last:border-b-0 cursor-pointer group/unsch hover:bg-neutral-50/50"
                  onClick={(e) => {
                    // 클릭한 위치의 날짜를 계산해서 3일짜리 일정 생성
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const dayIndex = Math.floor(x / COL_W);
                    const clickedDate = addDays(minDate, dayIndex);
                    const endDate = addDays(clickedDate, 2);
                    onTaskDateChange(
                      task.id,
                      format(clickedDate, "yyyy-MM-dd"),
                      format(endDate, "yyyy-MM-dd"),
                    );
                  }}
                >
                  <div
                    className="absolute top-0 bottom-0 w-px"
                    style={{
                      left: todayIndex * COL_W + COL_W / 2,
                      backgroundColor: `${TODAY_COLOR}40`,
                    }}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-300 group-hover/unsch:hidden">
                    일정 미정
                  </span>
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-500 hidden group-hover/unsch:inline">
                    클릭하여 일정 지정
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
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

  // 사전 준비에서 롤아웃 분리
  const { groups, rolloutTask } = useMemo(() => {
    const map = new Map<number, ChapterTask[]>();
    let rollout: ChapterTask | null = null;

    for (const t of tasks) {
      // 롤아웃은 따로 빼기
      if (t.taskType === "롤아웃") {
        rollout = t;
        continue;
      }
      if (!map.has(t.chapter)) map.set(t.chapter, []);
      map.get(t.chapter)!.push(t);
    }

    const grps: ChapterGroup[] = Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([ch, chTasks]) => ({
        chapter: ch,
        label: ch === 0 ? "사전 준비" : `${ch}장`,
        color: GROUP_COLORS[ch % GROUP_COLORS.length],
        tasks: chTasks,
        completedCount: chTasks.filter((t) => t.status === "완료").length,
      }));

    return { groups: grps, rolloutTask: rollout };
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

  const handleTaskDateChange = useCallback(
    (taskId: string, startDate: string, endDate: string) => {
      onTasksChange(
        tasks.map((t) => (t.id === taskId ? { ...t, startDate, endDate } : t)),
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
      {/* 장별 행 */}
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

              <div className="flex items-center gap-1 flex-1 min-w-0 relative">
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
                onTaskDateChange={handleTaskDateChange}
              />
            )}
          </div>
        );
      })}

      {/* 장 추가 버튼 */}
      {onAddChapter && (
        <button
          onClick={onAddChapter}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors border-b border-dashed border-neutral-200"
        >
          <Plus className="h-3.5 w-3.5" />장 추가
        </button>
      )}

      {/* 강의 롤아웃 (맨 하단 고정) */}
      {rolloutTask && (
        <div
          className="flex items-center gap-3 px-4 py-3 border-t border-neutral-100 bg-neutral-50/30"
          style={{ borderLeft: "4px solid #7C8DBC" }}
        >
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-[#7C8DBC]" />
            <span className="text-sm font-semibold text-[#7C8DBC]">
              강의 롤아웃
            </span>
          </div>
          <div className="flex-1" />
          <span
            className={cn(
              "text-[11px] font-medium px-2.5 py-1 rounded-full",
              rolloutTask.status === "완료"
                ? "bg-emerald-50 text-emerald-600"
                : rolloutTask.status === "진행"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-neutral-100 text-neutral-400",
            )}
          >
            {rolloutTask.status}
          </span>
          {rolloutTask.startDate && (
            <span className="text-[11px] text-muted-foreground">
              {formatDateRange(rolloutTask)}
            </span>
          )}
          <button
            onClick={() => toggleTask(rolloutTask.id)}
            className={cn(
              "h-6 w-6 rounded-md border flex items-center justify-center shrink-0 transition-colors",
              rolloutTask.status === "완료"
                ? "bg-[#7C8DBC] border-[#7C8DBC] text-white"
                : "border-neutral-300 hover:border-[#7C8DBC]",
            )}
          >
            {rolloutTask.status === "완료" && <Check className="h-4 w-4" />}
          </button>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
          등록된 공정이 없습니다.
        </div>
      )}
    </div>
  );
}
