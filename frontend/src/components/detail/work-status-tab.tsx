"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  Video,
  Scissors,
  Search,
  ThumbsUp,
  ExternalLink,
  Circle,
  HardDrive,
  Link as LinkIcon,
  Upload,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChapterTask, Lecture, TaskStatus } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WorkStatusTabProps {
  tasks: ChapterTask[];
  lectures: Lecture[];
  chapterCount: number;
  chapterTitles?: string[];
  chapterDriveLinks?: string[];
  onTaskStatusChange?: (
    chapter: number,
    taskType: string,
    status: TaskStatus,
  ) => void;
  onLectureUrlChange?: (lectureId: string, field: string, url: string) => void;
}

interface ChapterRow {
  chapter: number;
  label: string;
  title?: string;
  lectures: Lecture[];
  taskStatuses: Record<string, TaskStatus>;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FILE_COLUMNS = [
  { key: "교안제작", label: "교안", icon: FileText },
  { key: "촬영", label: "촬영", icon: Video },
  { key: "편집", label: "편집·자막", icon: Scissors },
  { key: "검수", label: "검수", icon: Search },
  { key: "승인", label: "승인", icon: ThumbsUp },
] as const;

const GROUP_COLORS = [
  "#909090",
  "#D07070",
  "#D08A6A",
  "#D0A858",
  "#C4A840",
  "#8AAE50",
  "#50B880",
  "#50AAAA",
  "#5090C0",
  "#8070C0",
  "#B870A0",
  "#A89070",
];

function getLectureDeliverableUrl(
  lecture: Lecture,
  taskKey: string,
): string | undefined {
  switch (taskKey) {
    case "교안제작":
      return lecture.lessonPlanUrl;
    case "촬영":
      return lecture.rawVideoUrl;
    case "편집":
      return lecture.editedVideoUrl ?? lecture.subtitleUrl;
    case "검수":
      return lecture.reviewUrl;
    default:
      return undefined;
  }
}

/* ------------------------------------------------------------------ */
/*  Grid                                                               */
/* ------------------------------------------------------------------ */

const GRID_COLS = "grid-cols-[200px_repeat(5,1fr)_100px]";

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** 강별 결과물 링크 셀 */
function DeliverableCell({
  lecture,
  taskKey,
  color,
  onUploadUrl,
}: {
  lecture: Lecture;
  taskKey: string;
  color: string;
  onUploadUrl?: (lectureId: string, field: string, url: string) => void;
}) {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const url = getLectureDeliverableUrl(lecture, taskKey);

  // 교안 링크 업로드 기능
  if (taskKey === "교안제작" && !url && onUploadUrl) {
    if (showInput) {
      return (
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-0.5">
            <input
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputValue.trim()) {
                  onUploadUrl(lecture.id, "lessonPlanUrl", inputValue.trim());
                  setShowInput(false);
                  setInputValue("");
                }
                if (e.key === "Escape") {
                  setShowInput(false);
                  setInputValue("");
                }
              }}
              placeholder="링크"
              className="w-16 h-6 text-[10px] px-1 rounded border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={() => {
                if (inputValue.trim()) {
                  onUploadUrl(lecture.id, "lessonPlanUrl", inputValue.trim());
                }
                setShowInput(false);
                setInputValue("");
              }}
              className="h-6 w-6 flex items-center justify-center rounded border border-neutral-200 hover:bg-neutral-50"
            >
              <Check className="h-3 w-3 text-neutral-500" />
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center">
        <button
          onClick={() => setShowInput(true)}
          className="inline-flex items-center gap-0.5 h-7 px-1.5 rounded-lg border-2 border-dashed text-[10px] font-medium transition-all hover:scale-105 hover:border-solid"
          style={{ borderColor: `${color}60`, color }}
          title="교안 링크 등록"
        >
          <LinkIcon className="h-3 w-3" />
        </button>
      </div>
    );
  }

  if (url) {
    return (
      <div className="flex items-center justify-center">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center h-7 w-7 rounded-lg border transition-all hover:scale-110"
          style={{
            backgroundColor: `${color}15`,
            borderColor: `${color}50`,
            color,
          }}
          title="결과물 보기"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg border-2 border-dashed border-neutral-200">
        <Circle className="h-2.5 w-2.5 text-neutral-300" />
      </span>
    </div>
  );
}

/** 상태 자동변경 셀 — 촬영/편집/검수 */
function StatusCell({
  taskKey,
  status,
  color,
  onToggle,
}: {
  taskKey: string;
  status?: TaskStatus;
  color: string;
  onToggle?: () => void;
}) {
  if (!onToggle || taskKey === "승인") return null;

  const isComplete = status === "완료";
  const statusLabel = status ?? "대기";

  return (
    <button
      onClick={onToggle}
      className={cn(
        "absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border text-[7px] font-bold flex items-center justify-center transition-all",
        isComplete
          ? "bg-emerald-500 border-emerald-400 text-white"
          : "bg-white border-neutral-300 text-neutral-400 hover:border-neutral-400",
      )}
      title={`${statusLabel} — 클릭하여 상태 변경`}
    >
      {isComplete ? "✓" : ""}
    </button>
  );
}

/** 장 진행률 바 */
function ChapterProgress({
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
    <div className="flex items-center gap-1.5">
      <div className="w-10 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums w-7">
        {pct}%
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function WorkStatusTab({
  tasks,
  lectures,
  chapterCount,
  chapterTitles,
  chapterDriveLinks,
  onTaskStatusChange,
  onLectureUrlChange,
}: WorkStatusTabProps) {
  const chapters: ChapterRow[] = useMemo(() => {
    const rows: ChapterRow[] = [];

    for (let ch = 1; ch <= chapterCount; ch++) {
      const chTasks = tasks.filter((t) => t.chapter === ch);
      const chLectures = lectures
        .filter((l) => l.chapter === ch)
        .sort((a, b) => a.lectureNumber - b.lectureNumber);

      const taskStatuses: Record<string, TaskStatus> = {};
      for (const t of chTasks) {
        taskStatuses[t.taskType] = t.status;
      }
      // 편집·자막 합산: 둘 다 완료여야 완료
      if (taskStatuses["편집"] && taskStatuses["자막"]) {
        taskStatuses["편집"] =
          taskStatuses["편집"] === "완료" && taskStatuses["자막"] === "완료"
            ? "완료"
            : taskStatuses["편집"] === "완료" || taskStatuses["자막"] === "완료"
              ? "진행"
              : taskStatuses["편집"];
      }

      rows.push({
        chapter: ch,
        label: `${ch}장`,
        title: chapterTitles?.[ch - 1],
        lectures: chLectures,
        taskStatuses,
      });
    }

    return rows;
  }, [tasks, lectures, chapterCount, chapterTitles]);

  if (chapters.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-100 bg-white shadow-sm flex items-center justify-center h-32 text-sm text-muted-foreground">
        등록된 장이 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className={cn(
          "grid",
          GRID_COLS,
          "border-b border-neutral-100 bg-neutral-50/50",
        )}
      >
        <div className="px-4 py-2" />
        {FILE_COLUMNS.map((col) => (
          <div
            key={col.key}
            className="px-1 py-2 text-center text-[11px] font-medium text-neutral-400"
          >
            <div className="flex flex-col items-center gap-0.5">
              <col.icon className="h-3.5 w-3.5" />
              <span>{col.label}</span>
            </div>
          </div>
        ))}
        <div className="px-1 py-2" />
      </div>

      {/* Chapter rows */}
      {chapters.map((chapter) => {
        const color = GROUP_COLORS[chapter.chapter % GROUP_COLORS.length];
        const completedCount = FILE_COLUMNS.filter(
          (col) => chapter.taskStatuses[col.key] === "완료",
        ).length;
        const driveLink = chapterDriveLinks?.[chapter.chapter - 1];

        return (
          <div key={chapter.chapter}>
            {/* 장 헤더 */}
            <div
              className={cn(
                "grid",
                GRID_COLS,
                "items-center border-b border-neutral-200 bg-neutral-50/70",
              )}
              style={{ borderLeft: `3px solid ${color}` }}
            >
              <div className="px-4 py-2.5 flex items-center gap-2 min-w-0">
                <span
                  className="text-[13px] font-bold shrink-0"
                  style={{ color }}
                >
                  {chapter.label}
                </span>
                {chapter.title && (
                  <span className="text-[12px] font-semibold text-neutral-700 truncate">
                    {chapter.title}
                  </span>
                )}
              </div>
              {/* 5개 빈 칸 */}
              <div />
              <div />
              <div />
              <div />
              <div />
              {/* 진행률 + 드라이브 링크 */}
              <div className="px-2 py-2.5 flex items-center justify-end gap-2">
                {driveLink && (
                  <a
                    href={driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-6 w-6 rounded-md border border-neutral-200 text-neutral-400 hover:text-neutral-600 hover:border-neutral-300 transition-colors"
                    title="구글 드라이브"
                  >
                    <HardDrive className="h-3 w-3" />
                  </a>
                )}
                <ChapterProgress
                  completed={completedCount}
                  total={FILE_COLUMNS.length}
                  color={color}
                />
                <span className="text-[10px] text-neutral-400 shrink-0">
                  {chapter.lectures.length}강
                </span>
              </div>
            </div>

            {/* 강별 행 */}
            {chapter.lectures.map((lecture) => (
              <div
                key={lecture.id}
                className={cn(
                  "grid",
                  GRID_COLS,
                  "items-center border-b border-neutral-100/50 hover:bg-accent/10 transition-colors",
                )}
                style={{ borderLeft: `3px solid ${color}20` }}
              >
                <div className="px-4 pl-7 py-2 flex items-center gap-2 min-w-0">
                  <span
                    className="text-[12px] font-medium shrink-0"
                    style={{ color }}
                  >
                    {lecture.label}
                  </span>
                  {lecture.title && (
                    <span className="text-[11px] text-neutral-500 truncate">
                      {lecture.title}
                    </span>
                  )}
                </div>
                {FILE_COLUMNS.map((col) => {
                  const taskStatus = chapter.taskStatuses[col.key];
                  return (
                    <div key={col.key} className="px-1 py-1.5">
                      <div className="relative inline-flex w-full justify-center">
                        <DeliverableCell
                          lecture={lecture}
                          taskKey={col.key}
                          color={color}
                          onUploadUrl={onLectureUrlChange}
                        />
                        {onTaskStatusChange &&
                          col.key !== "교안제작" &&
                          col.key !== "승인" && (
                            <StatusCell
                              taskKey={col.key}
                              status={taskStatus}
                              color={color}
                              onToggle={() =>
                                onTaskStatusChange(
                                  chapter.chapter,
                                  col.key,
                                  taskStatus === "완료" ? "대기" : "완료",
                                )
                              }
                            />
                          )}
                      </div>
                    </div>
                  );
                })}
                <div />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
