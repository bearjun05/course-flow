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
  onDeleteChapter?: (chapter: number) => void;
  /** 프로젝트 생성일 또는 사용자 지정 시작일 */
  projectStartDate?: string;
  /** 강의 지급일 */
  paymentDate?: string;
  /** 튜터명 (교안/촬영 바에 표시) */
  tutor?: string;
  /** PM명 (승인 바에 표시) */
  pm?: string;
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
    >
      {isComplete && <Check className="h-3 w-3 mr-0.5 shrink-0" />}
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
const MIN_RANGE = 60; // 최소 표시 범위 (일)
const RANGE_PADDING = 7; // 양쪽 여유 (일)
const TODAY_COLOR = "#A8C8E8"; // 오늘 색상 (연한 블루)

function MiniGantt({
  tasks,
  chapterColor,
  onToggle,
  onTaskDateChange,
  onTaskDateClear,
  projectStartDate,
  paymentDate,
  tutor,
  pm,
}: {
  tasks: ChapterTask[];
  chapterColor: string;
  onToggle: (taskId: string) => void;
  onTaskDateChange: (
    taskId: string,
    startDate: string,
    endDate: string,
  ) => void;
  onTaskDateClear?: (taskId: string) => void;
  projectStartDate?: string;
  paymentDate?: string;
  tutor?: string;
  pm?: string;
}) {
  const today = startOfDay(new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // STAGE_ORDER 순서 유지: 일정 유무와 관계없이 항상 고정 순서
  const allTasks = tasks; // 이미 orderedTasks로 정렬된 상태
  const scheduled = allTasks.filter((t) => t.startDate);
  const unscheduled = allTasks.filter((t) => !t.startDate);

  // 프로젝트 시작일~지급일+7일 기반 범위 + 태스크 날짜 포함
  const { minDate, totalDays, todayIndex, earliestTaskIndex, latestTaskIndex } =
    useMemo(() => {
      // 기본 앵커: 프로젝트 시작일, 지급일+7, 오늘 (모두 로컬 자정으로 통일)
      const anchors: Date[] = [today];
      if (projectStartDate)
        anchors.push(startOfDay(parseISO(projectStartDate)));
      if (paymentDate)
        anchors.push(addDays(startOfDay(parseISO(paymentDate)), 7));

      // 태스크 날짜도 포함 (범위 밖 태스크도 보이도록)
      for (const t of scheduled) {
        if (t.startDate) anchors.push(startOfDay(parseISO(t.startDate)));
        if (t.endDate) anchors.push(startOfDay(parseISO(t.endDate)));
      }

      const earliest = anchors.reduce((a, b) => (a < b ? a : b));
      const latest = anchors.reduce((a, b) => (a > b ? a : b));

      let rangeStart = addDays(earliest, -RANGE_PADDING);
      let rangeEnd = addDays(latest, RANGE_PADDING);
      let days = differenceInDays(rangeEnd, rangeStart) + 1;

      // 최소 범위 보장 (빈 프로젝트에서도 클릭으로 일정 지정 가능)
      if (days < MIN_RANGE) {
        const extra = Math.ceil((MIN_RANGE - days) / 2);
        rangeStart = addDays(rangeStart, -extra);
        days = MIN_RANGE;
      }

      // 태스크 랜드마크 인덱스
      let eIdx = -1;
      let lIdx = -1;
      if (scheduled.length > 0) {
        const taskStarts = scheduled.map((t) => parseISO(t.startDate!));
        const taskEnds = scheduled
          .filter((t) => t.endDate)
          .map((t) => parseISO(t.endDate!));
        const taskEarliest = taskStarts.reduce((a, b) => (a < b ? a : b));
        const allTaskDates = [...taskStarts, ...taskEnds];
        const taskLatest = allTaskDates.reduce((a, b) => (a > b ? a : b));
        eIdx = differenceInDays(taskEarliest, rangeStart);
        lIdx = differenceInDays(taskLatest, rangeStart);
      }

      return {
        minDate: rangeStart,
        totalDays: days,
        todayIndex: differenceInDays(today, rangeStart),
        earliestTaskIndex: eIdx,
        latestTaskIndex: lIdx,
      };
    }, [today, scheduled]);

  const dates = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => addDays(minDate, i)),
    [minDate, totalDays],
  );

  // 특정 인덱스 위치로 스크롤 (뷰포트 1/3 지점에 배치)
  const scrollToIndex = useCallback(
    (idx: number, behavior: ScrollBehavior = "smooth") => {
      const el = scrollRef.current;
      if (!el) return;
      const viewW = el.clientWidth;
      el.scrollTo({ left: Math.max(0, idx * COL_W - viewW / 3), behavior });
    },
    [],
  );

  // 마운트 시 오늘 위치로 스크롤
  const mountedRef = useRef(false);
  if (!mountedRef.current) {
    mountedRef.current = true;
    setTimeout(() => scrollToIndex(todayIndex, "instant"), 50);
  }

  // 스크롤 시 화살표 표시 여부 + 이동 대상 판단
  const [leftTarget, setLeftTarget] = useState<number | null>(null);
  const [rightTarget, setRightTarget] = useState<number | null>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const viewLeft = el.scrollLeft;
    const viewRight = viewLeft + el.clientWidth;

    // 왼쪽에 가려진 랜드마크 중 가장 가까운 것
    const landmarks = [
      earliestTaskIndex >= 0 ? earliestTaskIndex : null,
      todayIndex,
      latestTaskIndex >= 0 ? latestTaskIndex : null,
    ].filter((v): v is number => v !== null);

    const offLeft = landmarks
      .filter((idx) => idx * COL_W < viewLeft)
      .sort((a, b) => b - a);
    const offRight = landmarks
      .filter((idx) => idx * COL_W > viewRight - COL_W)
      .sort((a, b) => a - b);

    setShowLeftArrow(offLeft.length > 0);
    setLeftTarget(offLeft.length > 0 ? offLeft[0] : null);
    setShowRightArrow(offRight.length > 0);
    setRightTarget(offRight.length > 0 ? offRight[0] : null);
  }, [todayIndex, earliestTaskIndex, latestTaskIndex]);

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
      {/* 왼쪽 화살표: 가려진 랜드마크로 이동 */}
      {showLeftArrow && leftTarget !== null && (
        <button
          onClick={() => scrollToIndex(leftTarget)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-neutral-200 shadow-md flex items-center justify-center hover:bg-white transition-colors"
          title={leftTarget === todayIndex ? "오늘로 이동" : "일정으로 이동"}
        >
          <ChevronDown className="h-4 w-4 rotate-90 text-[#6BA3DE]" />
        </button>
      )}
      {/* 오른쪽 화살표: 가려진 랜드마크로 이동 */}
      {showRightArrow && rightTarget !== null && (
        <button
          onClick={() => scrollToIndex(rightTarget)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-neutral-200 shadow-md flex items-center justify-center hover:bg-white transition-colors"
          title={rightTarget === todayIndex ? "오늘로 이동" : "일정으로 이동"}
        >
          <ChevronDown className="h-4 w-4 -rotate-90 text-[#6BA3DE]" />
        </button>
      )}

      <div className="rounded-xl border border-neutral-100 bg-white overflow-hidden">
        <div className="flex">
          {/* 고정 라벨 열 — STAGE_ORDER 순서 고정 */}
          <div className="w-20 shrink-0 z-10 bg-white">
            {/* 헤더 빈칸 */}
            <div className="h-12 border-b border-neutral-100 bg-neutral-50/50" />
            {/* 공정 라벨들 (일정 유무 관계없이 고정 순서) */}
            {allTasks.map((task) => {
              const isComplete = task.status === "완료";
              const isActive = task.status === "진행";
              const hasDate = !!task.startDate;
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
                      !hasDate && !isComplete && "text-muted-foreground",
                      isActive && "font-semibold",
                    )}
                  >
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
                  const isFirstOfMonth = d.getDate() === 1;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "text-center text-[11px] py-1 border-l border-neutral-100/50 relative",
                        isTodayCol && "bg-[#6B8DE3]/[0.06]",
                        isFirstOfMonth && !isTodayCol && "border-l-neutral-300",
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
                      <div className={cn("mt-1")}>
                        {isTodayCol ? (
                          <span
                            className="inline-flex items-center justify-center h-5 w-5 rounded-full text-white text-[11px] font-bold"
                            style={{ backgroundColor: TODAY_COLOR }}
                          >
                            {format(d, "d", { locale: ko })}
                          </span>
                        ) : isFirstOfMonth ? (
                          <span className="font-bold text-neutral-600">
                            {format(d, "M/d")}
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

              {/* 공정별 행 — STAGE_ORDER 순서 고정 */}
              {allTasks.map((task) => {
                const hasDate = !!task.startDate;
                const label = STAGE_SHORT[task.taskType] ?? task.taskType;

                if (hasDate) {
                  // 일정 있는 태스크 → 간트 바
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

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "relative border-b border-neutral-50 h-10 group hover:bg-neutral-50/30",
                        isComplete && "opacity-50",
                      )}
                    >
                      <div
                        className="absolute top-0 bottom-0 w-px z-10"
                        style={{
                          left: todayIndex * COL_W + COL_W / 2,
                          backgroundColor: `${TODAY_COLOR}40`,
                        }}
                      />
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
                          onMouseDown={(ev) =>
                            handleDragStart(ev, task, "left")
                          }
                        />
                        <div
                          className="absolute left-2 right-2 top-0 bottom-0 cursor-grab active:cursor-grabbing flex items-center justify-center"
                          onMouseDown={(ev) =>
                            handleDragStart(ev, task, "move")
                          }
                        >
                          <span className="truncate px-1 pointer-events-none select-none">
                            {widthPx > COL_W * 2
                              ? (() => {
                                  const type = task.taskType;
                                  const person =
                                    type === "교안제작" || type === "촬영"
                                      ? tutor
                                      : type === "승인"
                                        ? pm
                                        : task.assignee;
                                  return person
                                    ? `${label} · ${person}`
                                    : label;
                                })()
                              : ""}
                          </span>
                        </div>
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-10 opacity-0 group-hover/bar:opacity-100 transition-opacity rounded-r-md hover:bg-black/10"
                          onMouseDown={(ev) =>
                            handleDragStart(ev, task, "right")
                          }
                        />
                        {onTaskDateClear && (
                          <button
                            className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-white border border-neutral-300 text-neutral-400 text-[10px] leading-none flex items-center justify-center opacity-0 group-hover/bar:opacity-100 transition-opacity hover:bg-red-50 hover:border-red-300 hover:text-red-500 z-20"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskDateClear(task.id);
                            }}
                            title="일정 삭제"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                // 일정 미정 → 일정 배정 바
                const yesterdayIdx = todayIndex - 1;
                const barLeftPx = Math.max(0, yesterdayIdx) * COL_W;
                const barWidthPx = COL_W * 3;
                return (
                  <div
                    key={task.id}
                    className="relative h-10 border-b border-neutral-50 cursor-pointer group/unsch hover:bg-neutral-50/50"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const dayIdx = Math.floor(x / COL_W);
                      const clickedDate = addDays(minDate, dayIdx);
                      const endDate = addDays(clickedDate, 2);
                      onTaskDateChange(
                        task.id,
                        format(clickedDate, "yyyy-MM-dd"),
                        format(endDate, "yyyy-MM-dd"),
                      );
                    }}
                  >
                    <div
                      className="absolute top-0 bottom-0 w-px pointer-events-none"
                      style={{
                        left: todayIndex * COL_W + COL_W / 2,
                        backgroundColor: `${TODAY_COLOR}40`,
                      }}
                    />
                    <div
                      className="absolute top-1.5 h-7 rounded-md border-2 border-dashed border-neutral-300 flex items-center justify-center group-hover/unsch:border-neutral-400 transition-colors z-[2] cursor-pointer"
                      style={{ left: barLeftPx, width: barWidthPx }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const todayDate = startOfDay(new Date());
                        const endDate = addDays(todayDate, 2);
                        onTaskDateChange(
                          task.id,
                          format(todayDate, "yyyy-MM-dd"),
                          format(endDate, "yyyy-MM-dd"),
                        );
                      }}
                    >
                      <span className="text-[10px] text-neutral-400 group-hover/unsch:text-neutral-500 whitespace-nowrap pointer-events-none">
                        일정 배정
                      </span>
                    </div>
                  </div>
                );
              })}
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
  onDeleteChapter,
  projectStartDate,
  paymentDate,
  tutor,
  pm,
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

  const handleTaskDateClear = useCallback(
    (taskId: string) => {
      onTasksChange(
        tasks.map((t) =>
          t.id === taskId
            ? { ...t, startDate: undefined, endDate: undefined }
            : t,
        ),
      );
    },
    [tasks, onTasksChange],
  );

  function getChapterStatus(groupTasks: ChapterTask[]): {
    label: string | null;
    type: "done" | "active" | "overdue" | null;
  } {
    const today = startOfDay(new Date());
    const allDone = groupTasks.every((t) => t.status === "완료");
    if (allDone && groupTasks.length > 0)
      return { label: "완료", type: "done" };

    // 지연 체크: 진행/리뷰/대기인데 마감이 지난 공정이 있으면 지연
    const overdue = groupTasks.find(
      (t) =>
        t.status !== "완료" &&
        t.endDate &&
        differenceInDays(today, parseISO(t.endDate)) > 0,
    );

    const active = groupTasks.find(
      (t) => t.status === "진행" || t.status === "리뷰",
    );

    if (active) {
      const stageLabel = active.status === "리뷰" ? "리뷰 중" : "진행 중";
      return {
        label: stageLabel,
        type: overdue ? "overdue" : "active",
      };
    }

    return { label: null, type: null };
  }

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white shadow-sm overflow-hidden">
      {/* 장별 행 */}
      {groups.map((group) => {
        const expanded = expandedGroups.has(group.chapter);
        const allDone =
          group.tasks.length > 0 &&
          group.tasks.every((t) => t.status === "완료");
        const chapterStatus = getChapterStatus(group.tasks);

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
                {chapterStatus.label && (
                  <span
                    className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-md whitespace-nowrap",
                      chapterStatus.type === "done" &&
                        "bg-neutral-100 text-neutral-400",
                      chapterStatus.type === "active" &&
                        "bg-[#EEF4EE] text-[#7A9A72]",
                      chapterStatus.type === "overdue" &&
                        "bg-[#F5E0E0] text-[#9A4A4A]",
                    )}
                  >
                    {chapterStatus.label}
                  </span>
                )}
                <ProgressBar
                  completed={group.completedCount}
                  total={group.tasks.length}
                  color={group.color}
                />
              </div>
            </div>

            {/* 펼침: 미니 간트 타임라인 + 장 삭제 */}
            {expanded && (
              <>
                <MiniGantt
                  tasks={orderedTasks}
                  chapterColor={group.color}
                  onToggle={toggleTask}
                  onTaskDateChange={handleTaskDateChange}
                  onTaskDateClear={handleTaskDateClear}
                  projectStartDate={projectStartDate}
                  paymentDate={paymentDate}
                  tutor={tutor}
                  pm={pm}
                />
                {onDeleteChapter && group.chapter > 0 && (
                  <div className="px-4 pl-10 pb-2 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChapter(group.chapter);
                      }}
                      className="text-[11px] text-neutral-400 hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-red-50"
                    >
                      {group.label} 삭제
                    </button>
                  </div>
                )}
              </>
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
