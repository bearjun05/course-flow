"use client";

import { useMemo } from "react";
import {
  FileText,
  Video,
  Scissors,
  Subtitles,
  CheckCircle2,
  Search,
  ThumbsUp,
  Upload,
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
}

interface ChapterRow {
  chapter: number;
  label: string;
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

const STATUS_INDICATOR: Record<
  TaskStatus,
  { color: string; bg: string; label: string }
> = {
  완료: { color: "text-[#6ECC9A]", bg: "bg-[#6ECC9A]/10", label: "완료" },
  진행: { color: "text-[#8AAE50]", bg: "bg-[#8AAE50]/10", label: "진행" },
  리뷰: { color: "text-[#F5C842]", bg: "bg-[#F5C842]/10", label: "리뷰" },
  대기: { color: "text-neutral-300", bg: "bg-neutral-50", label: "대기" },
};

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

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatusDot({ status }: { status: TaskStatus | undefined }) {
  if (!status) {
    return (
      <div className="flex items-center justify-center">
        <span className="text-neutral-200">—</span>
      </div>
    );
  }

  const s = STATUS_INDICATOR[status];

  if (status === "완료") {
    return (
      <div className="flex items-center justify-center">
        <CheckCircle2 className={cn("h-4.5 w-4.5", s.color)} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <span
        className={cn(
          "inline-flex items-center h-5 px-1.5 rounded text-[10px] font-medium",
          s.bg,
          s.color,
        )}
      >
        {s.label}
      </span>
    </div>
  );
}

function ChapterProgress({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 rounded-full bg-[#F0F0F0] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#00C875] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums">
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
        lectures: chLectures,
        taskStatuses,
      });
    }

    return rows;
  }, [tasks, lectures, chapterCount]);

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
      <div className="grid grid-cols-[minmax(200px,2fr)_repeat(6,minmax(60px,1fr))_80px] border-b border-neutral-100 bg-neutral-50/50">
        <div className="px-4 py-2 text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
          목차
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
        <div className="px-2 py-2 text-center text-[11px] font-medium text-neutral-400">
          진행률
        </div>
      </div>

      {/* Chapter rows */}
      {chapters.map((chapter) => {
        const color = GROUP_COLORS[chapter.chapter % GROUP_COLORS.length];
        const completedCount = FILE_COLUMNS.filter(
          (col) => chapter.taskStatuses[col.key] === "완료",
        ).length;
        return (
          <div key={chapter.chapter}>
            {/* Chapter header row */}
            <div
              className="grid grid-cols-[minmax(200px,2fr)_repeat(6,minmax(60px,1fr))_80px] items-center border-b border-neutral-100 bg-white hover:bg-accent/20 transition-colors"
              style={{ borderLeft: `3px solid ${color}` }}
            >
              <div className="px-4 py-2.5">
                <span className="text-xs font-semibold" style={{ color }}>
                  {chapter.label}
                </span>
                <span className="ml-2 text-[11px] text-muted-foreground">
                  {chapter.lectures.length}강
                </span>
              </div>
              {FILE_COLUMNS.map((col) => (
                <div key={col.key} className="px-1 py-2.5">
                  <StatusDot
                    status={chapter.taskStatuses[col.key] as TaskStatus}
                  />
                </div>
              ))}
              <div className="px-2 py-2.5 flex items-center justify-center">
                <ChapterProgress
                  completed={completedCount}
                  total={FILE_COLUMNS.length}
                />
              </div>
            </div>

            {/* Lecture sub-rows */}
            {chapter.lectures.map((lecture) => (
              <div
                key={lecture.id}
                className="grid grid-cols-[minmax(200px,2fr)_repeat(6,minmax(60px,1fr))_80px] items-center border-b border-neutral-100/50 hover:bg-accent/10 transition-colors"
                style={{ borderLeft: `3px solid ${color}20` }}
              >
                <div className="px-4 pl-8 py-1.5 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {lecture.label}강
                  </span>
                  {lecture.videoUrls.length > 0 && (
                    <span className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded bg-blue-50 text-[10px] font-medium text-blue-600">
                      <Upload className="h-3 w-3" />
                      영상 {lecture.videoUrls.length}개
                    </span>
                  )}
                </div>
                {FILE_COLUMNS.map((col) => (
                  <div key={col.key} className="px-1 py-1.5">
                    {/* Lecture-level status inherits from chapter task */}
                    {col.key === "촬영" ? (
                      <div className="flex items-center justify-center">
                        {lecture.videoUrls.length > 0 ? (
                          <CheckCircle2 className="h-4 w-4 text-[#6ECC9A]" />
                        ) : (
                          <span className="text-neutral-200">—</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span className="text-neutral-100">·</span>
                      </div>
                    )}
                  </div>
                ))}
                <div />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
