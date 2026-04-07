"use client";

import { useMemo } from "react";
import {
  FileText,
  Video,
  Scissors,
  Subtitles,
  Search,
  ThumbsUp,
  ExternalLink,
  Circle,
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
  { key: "편집", label: "편집", icon: Scissors },
  { key: "자막", label: "자막", icon: Subtitles },
  { key: "검수", label: "검수", icon: Search },
  { key: "승인", label: "승인", icon: ThumbsUp },
] as const;

const GROUP_COLORS = [
  "#B0B0B0",
  "#E4A0A0",
  "#E4B89C",
  "#E4CC9C",
  "#E0D49C",
  "#C8D89C",
  "#9CD4B0",
  "#9CCCC8",
  "#9CB8D8",
  "#B0A8D8",
  "#D0A8C8",
  "#C8BCB0",
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
      return lecture.editedVideoUrl;
    case "자막":
      return lecture.subtitleUrl;
    case "검수":
      return lecture.reviewUrl;
    default:
      return undefined;
  }
}

/* ------------------------------------------------------------------ */
/*  Grid                                                               */
/* ------------------------------------------------------------------ */

const GRID_COLS =
  "grid-cols-[minmax(200px,2fr)_60px_repeat(6,minmax(50px,1fr))]";

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** 강별 결과물 링크 셀 — 업로드 완료/대기 강조 */
function DeliverableCell({
  lecture,
  taskKey,
  color,
}: {
  lecture: Lecture;
  taskKey: string;
  color: string;
}) {
  const url = getLectureDeliverableUrl(lecture, taskKey);

  if (url) {
    return (
      <div className="flex items-center justify-center">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center h-6 w-6 rounded-lg transition-all hover:scale-110 shadow-sm"
          style={{ backgroundColor: color, color: "white" }}
          title="결과물 보기"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  // 업로드 대기 — 빈 원형 점선
  return (
    <div className="flex items-center justify-center">
      <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg border-2 border-dashed border-neutral-200">
        <Circle className="h-2 w-2 text-neutral-300" />
      </span>
    </div>
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
        <div className="px-4 py-2 text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
          목차
        </div>
        <div className="px-1 py-2 text-center text-[11px] font-medium text-neutral-400">
          진행률
        </div>
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
      </div>

      {/* Chapter rows */}
      {chapters.map((chapter) => {
        const color = GROUP_COLORS[chapter.chapter % GROUP_COLORS.length];
        const completedCount = FILE_COLUMNS.filter(
          (col) => chapter.taskStatuses[col.key] === "완료",
        ).length;

        return (
          <div key={chapter.chapter}>
            {/* 장 헤더 — 굵은 구분 행 (공정 상태 없음) */}
            <div
              className="flex items-center border-b border-neutral-200 bg-neutral-50/70"
              style={{ borderLeft: `3px solid ${color}` }}
            >
              <div className="flex-1 px-4 py-2.5 flex items-center gap-2 min-w-0">
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
              <div className="px-4 py-2.5 flex items-center gap-3 shrink-0">
                <ChapterProgress
                  completed={completedCount}
                  total={FILE_COLUMNS.length}
                  color={color}
                />
                <span className="text-[10px] text-neutral-400">
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
                <div />
                {FILE_COLUMNS.map((col) => (
                  <div key={col.key} className="px-1 py-1.5">
                    <DeliverableCell
                      lecture={lecture}
                      taskKey={col.key}
                      color={color}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
