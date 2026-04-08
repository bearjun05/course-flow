"use client";

import { useMemo } from "react";
import {
  FileText,
  Video,
  Scissors,
  Subtitles,
  Search,
  ThumbsUp,
  Upload,
  ExternalLink,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project, ChapterTask, Lecture, TaskStatus } from "@/lib/types";

interface UploadTabProps {
  project: Project;
  person: string;
}

interface ChapterRow {
  chapter: number;
  label: string;
  title?: string;
  lectures: Lecture[];
  taskStatuses: Record<string, TaskStatus>;
}

const FILE_COLUMNS = [
  { key: "교안제작", label: "교안", icon: FileText },
  { key: "촬영", label: "촬영", icon: Video },
  { key: "편집", label: "편집", icon: Scissors },
  { key: "자막", label: "자막", icon: Subtitles },
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

/** 해당 공정이 이 사람에게 배정된 것인지 */
function isMyTask(taskKey: string, project: Project, person: string): boolean {
  // 직접 assignee 체크
  const task = project.tasks.find(
    (t) => t.taskType === taskKey && t.chapter > 0,
  );
  if (task?.assignee === person) return true;

  // 역할 기반 매핑
  if (
    project.tutor === person &&
    (taskKey === "교안제작" || taskKey === "촬영")
  )
    return true;
  if (project.editor === person && taskKey === "편집") return true;
  if (project.reviewer === person && taskKey === "검수") return true;
  if (
    project.curriculumManager === person &&
    (taskKey === "커리큘럼 기획" || taskKey === "승인")
  )
    return true;
  return false;
}

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

const GRID_COLS = "grid-cols-[200px_repeat(6,1fr)_100px]";

/** 결과물 셀 — 내 담당이면 업로드/확인 버튼, 아니면 비활성 */
function DeliverableCell({
  lecture,
  taskKey,
  color,
  isMine,
}: {
  lecture: Lecture;
  taskKey: string;
  color: string;
  isMine: boolean;
}) {
  const url = getLectureDeliverableUrl(lecture, taskKey);

  // 내 담당이 아니면 비활성 표시
  if (!isMine) {
    if (url) {
      return (
        <div className="flex items-center justify-center">
          <span
            className="inline-flex items-center justify-center h-7 w-7 rounded-lg border"
            style={{
              backgroundColor: `${color}10`,
              borderColor: `${color}30`,
            }}
          >
            <CheckCircle2 className="h-3.5 w-3.5" style={{ color }} />
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center">
        <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-neutral-50 border border-neutral-100">
          <Lock className="h-3 w-3 text-neutral-200" />
        </span>
      </div>
    );
  }

  // 내 담당 — 이미 업로드됨
  if (url) {
    return (
      <div className="flex items-center justify-center">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 h-7 px-2 rounded-lg border text-[10px] font-medium transition-all hover:scale-105"
          style={{
            backgroundColor: `${color}25`,
            borderColor: `${color}80`,
            color,
          }}
          title="결과물 확인"
        >
          <CheckCircle2 className="h-3 w-3" />
          확인
        </a>
      </div>
    );
  }

  // 내 담당 — 업로드 대기
  return (
    <div className="flex items-center justify-center">
      <button
        className="inline-flex items-center gap-1 h-7 px-2 rounded-lg border-2 border-dashed text-[10px] font-medium transition-all hover:scale-105 hover:border-solid"
        style={{
          borderColor: `${color}90`,
          color,
        }}
        onClick={(e) => {
          e.stopPropagation();
          // TODO: 실제 업로드 기능 연결
          alert("업로드 기능은 백엔드 연결 후 사용할 수 있습니다.");
        }}
        title="결과물 업로드"
      >
        <Upload className="h-3 w-3" />
        업로드
      </button>
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

export default function UploadTab({ project, person }: UploadTabProps) {
  const chapters: ChapterRow[] = useMemo(() => {
    const rows: ChapterRow[] = [];

    for (let ch = 1; ch <= project.chapterCount; ch++) {
      const chTasks = project.tasks.filter((t) => t.chapter === ch);
      const chLectures = project.lectures
        .filter((l) => l.chapter === ch)
        .sort((a, b) => a.lectureNumber - b.lectureNumber);

      const taskStatuses: Record<string, TaskStatus> = {};
      for (const t of chTasks) {
        taskStatuses[t.taskType] = t.status;
      }

      rows.push({
        chapter: ch,
        label: `${ch}장`,
        title: project.chapterTitles?.[ch - 1],
        lectures: chLectures,
        taskStatuses,
      });
    }

    return rows;
  }, [project]);

  // 내 담당 공정 목록
  const myTaskKeys = useMemo(
    () =>
      FILE_COLUMNS.filter((col) => isMyTask(col.key, project, person)).map(
        (col) => col.key,
      ),
    [project, person],
  );

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
        {FILE_COLUMNS.map((col) => {
          const mine = myTaskKeys.includes(col.key);
          return (
            <div
              key={col.key}
              className={cn(
                "px-1 py-2 text-center text-[11px] font-medium",
                mine ? "text-neutral-600" : "text-neutral-300",
              )}
            >
              <div className="flex flex-col items-center gap-0.5">
                <col.icon className="h-3.5 w-3.5" />
                <span>{col.label}</span>
                {mine && (
                  <span className="text-[8px] font-bold text-emerald-500">
                    내 작업
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div className="px-1 py-2" />
      </div>

      {/* Chapter rows */}
      {chapters.map((chapter) => {
        const color = GROUP_COLORS[chapter.chapter % GROUP_COLORS.length];
        const completedCount = FILE_COLUMNS.filter(
          (col) => chapter.taskStatuses[col.key] === "완료",
        ).length;

        return (
          <div key={chapter.chapter}>
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
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
              <div className="px-2 py-2.5 flex items-center justify-end gap-2">
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
                  const mine = myTaskKeys.includes(col.key);
                  return (
                    <div key={col.key} className="px-1 py-1.5">
                      <DeliverableCell
                        lecture={lecture}
                        taskKey={col.key}
                        color={color}
                        isMine={mine}
                      />
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
