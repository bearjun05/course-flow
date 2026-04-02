"use client";

import { useMemo, useState, useCallback } from "react";
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

/** 공정 순서 (파이프라인 표시 순서) */
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
              ringColor: chapterColor,
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

/** 펼쳤을 때 보이는 상세 행 */
function TaskDetailRow({
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

  return (
    <div className="flex items-center gap-3 py-1.5 px-4 pl-12 border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
      {/* 상태 아이콘 */}
      <button
        onClick={onToggle}
        className={cn(
          "h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
          isComplete
            ? "text-white border-transparent"
            : isActive
              ? "border-2"
              : isReview
                ? "border-amber-400 bg-amber-50"
                : "border-neutral-200",
        )}
        style={{
          ...(isComplete ? { backgroundColor: chapterColor } : {}),
          ...(isActive ? { borderColor: chapterColor } : {}),
        }}
      >
        {isComplete && <Check className="h-3 w-3" />}
        {isActive && (
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: chapterColor }}
          />
        )}
      </button>

      {/* 공정명 */}
      <span
        className={cn(
          "text-xs w-16 shrink-0",
          isComplete && "text-muted-foreground line-through",
          isActive && "font-semibold",
        )}
      >
        {task.taskType}
      </span>

      {/* 상태 뱃지 */}
      <span
        className={cn(
          "text-[10px] font-medium px-2 py-0.5 rounded-full",
          isComplete && "bg-emerald-50 text-emerald-600",
          isActive && "text-white",
          isReview && "bg-amber-50 text-amber-600",
          !isComplete &&
            !isActive &&
            !isReview &&
            "bg-neutral-100 text-neutral-400",
        )}
        style={isActive ? { backgroundColor: chapterColor } : {}}
      >
        {task.status}
      </span>

      {/* 담당자 */}
      {task.assignee && (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
          <User className="h-3 w-3" />
          {task.assignee}
        </span>
      )}
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

  /** 현재 진행 중인 단계 텍스트 */
  function getCurrentStage(groupTasks: ChapterTask[]): string | null {
    // 진행 or 리뷰 상태인 공정 찾기
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

        // 공정 순서대로 정렬
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
            {/* 메인 행: 장 라벨 + 파이프라인 + 진행률 */}
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-3 border-b border-neutral-100 transition-colors hover:bg-neutral-50/50 cursor-pointer",
                allDone && "opacity-60",
              )}
              style={{ borderLeft: `4px solid ${group.color}` }}
              onClick={() => toggleExpand(group.chapter)}
            >
              {/* 장 라벨 */}
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

              {/* 파이프라인 칩들 */}
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
                      onToggle={() => {
                        // 클릭 이벤트 전파 방지 (부모의 expand 토글 방지는 StageChip 내부에서)
                        toggleTask(task.id);
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* 현재 단계 + 진행률 */}
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

            {/* 펼침: 상세 공정 목록 */}
            {expanded && (
              <div className="bg-white">
                {orderedTasks.map((task) => (
                  <TaskDetailRow
                    key={task.id}
                    task={task}
                    chapterColor={group.color}
                    onToggle={() => toggleTask(task.id)}
                  />
                ))}
              </div>
            )}
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
          className="w-full flex items-center justify-center gap-1.5 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors border-t border-dashed border-neutral-200"
        >
          <Plus className="h-3.5 w-3.5" />장 추가
        </button>
      )}
    </div>
  );
}
