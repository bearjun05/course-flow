"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  Video,
  Scissors,
  Search,
  ThumbsUp,
  CheckCircle2,
  ExternalLink,
  Circle,
  HardDrive,
  Link as LinkIcon,
  Upload,
  Check,
  Plus,
  ClipboardCheck,
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
  planningComplete?: boolean;
  onPlanningComplete?: () => void;
  onAddChapter?: () => void;
  onReviewToggle?: (lectureId: string, reviewed: boolean) => void;
  onApprovalToggle?: (lectureId: string, approved: boolean) => void;
  onLectureUrlChange?: (lectureId: string, field: string, url: string) => void;
  hasCurriculumLink?: boolean;
  hasRolloutDate?: boolean;
  hasChapterDurations?: boolean;
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
  { key: "완료", label: "완료", icon: CheckCircle2 },
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

const GRID_COLS = "grid-cols-[minmax(240px,1.5fr)_repeat(6,1fr)_100px]";

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** 강별 결과물 링크 셀 */
function DeliverableCell({
  lecture,
  taskKey,
  color,
  taskStatus,
  onUploadUrl,
}: {
  lecture: Lecture;
  taskKey: string;
  color: string;
  taskStatus?: TaskStatus;
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

/** 승인 셀 — 강 단위 */
function ApprovalCell({
  lecture,
  color,
  onToggle,
}: {
  lecture: Lecture;
  chapter: number;
  lectureLabel: string;
  color: string;
  onToggle: (lectureId: string, approved: boolean) => void;
}) {
  const isApproved = lecture.approved === true;
  return (
    <div className="flex items-center justify-center">
      <button
        onClick={() => onToggle(lecture.id, !isApproved)}
        className={cn(
          "inline-flex items-center justify-center h-7 w-7 rounded-lg border transition-all hover:scale-110",
          isApproved ? "" : "border-2 border-dashed",
        )}
        style={{
          backgroundColor: isApproved ? `${color}20` : undefined,
          borderColor: isApproved ? `${color}50` : `${color}40`,
          color: isApproved ? color : `${color}80`,
        }}
        title={isApproved ? "승인 완료" : "승인 처리"}
      >
        {isApproved ? (
          <Check className="h-4 w-4" />
        ) : (
          <ThumbsUp className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

/** 검수 셀 — 강 단위 */
function ReviewCell({
  lecture,
  color,
  onToggle,
}: {
  lecture: Lecture;
  color: string;
  onToggle: (lectureId: string, reviewed: boolean) => void;
}) {
  const isReviewed = lecture.reviewed === true;
  return (
    <div className="flex items-center justify-center">
      <button
        onClick={() => onToggle(lecture.id, !isReviewed)}
        className={cn(
          "inline-flex items-center justify-center h-7 w-7 rounded-lg border transition-all hover:scale-110",
          isReviewed ? "" : "border-2 border-dashed",
        )}
        style={{
          backgroundColor: isReviewed ? `${color}20` : undefined,
          borderColor: isReviewed ? `${color}50` : `${color}40`,
          color: isReviewed ? color : `${color}80`,
        }}
        title={isReviewed ? "검수 완료" : "검수 처리"}
      >
        {isReviewed ? (
          <Check className="h-4 w-4" />
        ) : (
          <Search className="h-3.5 w-3.5" />
        )}
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

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function WorkStatusTab({
  tasks,
  lectures,
  chapterCount,
  chapterTitles,
  chapterDriveLinks,
  planningComplete,
  onPlanningComplete,
  onAddChapter,
  onReviewToggle,
  onApprovalToggle,
  onLectureUrlChange,
  hasCurriculumLink,
  hasRolloutDate,
  hasChapterDurations,
}: WorkStatusTabProps) {
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [checks, setChecks] = useState({
    curriculum: false,
    dates: false,
    durations: false,
  });
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

  const allChecked = checks.curriculum && checks.dates && checks.durations;

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white shadow-sm overflow-hidden">
      {/* 기획 행 */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 bg-neutral-50/70"
        style={{ borderLeft: "4px solid #7C8DBC" }}
      >
        <ClipboardCheck className="h-4 w-4 text-[#7C8DBC]" />
        <span className="text-sm font-semibold text-[#7C8DBC]">사전 준비</span>
        <div className="flex-1" />
        <span
          className={cn(
            "text-[11px] font-medium px-2.5 py-1 rounded-full",
            planningComplete
              ? "bg-emerald-50 text-emerald-600"
              : "bg-amber-50 text-amber-600",
          )}
        >
          {planningComplete ? "완료" : "진행 중"}
        </span>
        {!planningComplete && onPlanningComplete && (
          <button
            onClick={() => setShowPlanningModal(true)}
            className="h-7 px-3 rounded-lg border border-[#7C8DBC] text-[#7C8DBC] text-xs font-medium hover:bg-[#7C8DBC]/10 transition-colors"
          >
            완료하기
          </button>
        )}
      </div>

      {/* 기획 완료 모달 */}
      {showPlanningModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowPlanningModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-[400px] p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-base font-semibold">
                사전 준비를 완료하시겠습니까?
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                아래 항목을 확인해 주세요
              </p>
            </div>
            <div className="space-y-2">
              {[
                {
                  key: "curriculum" as const,
                  label: "커리큘럼 링크가 등록이 완료되었나요?",
                },
                {
                  key: "dates" as const,
                  label: "강의 롤아웃, 지급일이 잘 등록되었나요?",
                },
                {
                  key: "durations" as const,
                  label: "장별 분량이 잘 입력되었나요?",
                },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() =>
                    setChecks((prev) => ({
                      ...prev,
                      [item.key]: !prev[item.key],
                    }))
                  }
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left",
                    checks[item.key]
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-neutral-200 bg-white hover:bg-neutral-50",
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-colors",
                      checks[item.key]
                        ? "bg-emerald-500 text-white"
                        : "bg-neutral-200",
                    )}
                  >
                    {checks[item.key] && <Check className="h-3 w-3" />}
                  </div>
                  <span
                    className={cn(
                      "text-sm",
                      checks[item.key]
                        ? "text-emerald-700 font-medium"
                        : "text-neutral-600",
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowPlanningModal(false)}
                className="flex-1 h-9 rounded-lg border border-neutral-200 text-sm text-muted-foreground hover:bg-neutral-50"
              >
                취소
              </button>
              <button
                onClick={() => {
                  onPlanningComplete?.();
                  setShowPlanningModal(false);
                }}
                disabled={!allChecked}
                className={cn(
                  "flex-1 h-9 rounded-lg text-sm font-medium transition-colors",
                  allChecked
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-neutral-100 text-neutral-400 cursor-not-allowed",
                )}
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className={cn(
          "grid",
          GRID_COLS,
          "border-b border-neutral-100 bg-neutral-50/50",
          !planningComplete && "opacity-30 pointer-events-none",
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

      {/* Chapter rows (블러 처리: 기획 미완료 시) */}
      <div
        className={cn(
          !planningComplete && "opacity-30 pointer-events-none blur-[1px]",
        )}
      >
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
                  {driveLink && (
                    <a
                      href={driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 h-5 px-1.5 rounded border border-neutral-200 text-[10px] text-neutral-400 hover:text-neutral-600 hover:border-neutral-300 transition-colors shrink-0"
                      title="구글 드라이브"
                    >
                      <HardDrive className="h-2.5 w-2.5" />
                      드라이브
                    </a>
                  )}
                </div>
                {/* 6개 빈 칸 */}
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
                {/* 진행률 */}
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
              {chapter.lectures.map((lecture) => {
                // 현재 단계 판단: 가장 오른쪽에서 완료된 단계의 다음 단계가 현재
                const stageKeys = [
                  "교안제작",
                  "촬영",
                  "편집",
                  "검수",
                  "승인",
                  "완료",
                ];
                const isApproved = lecture.approved === true;
                const isReviewed = lecture.reviewed === true;
                const hasEditSubtitle = !!(
                  lecture.editedVideoUrl && lecture.subtitleUrl
                );
                const hasRawVideo = !!lecture.rawVideoUrl;
                const hasLessonPlan = !!lecture.lessonPlanUrl;

                let currentStageKey = "교안제작";
                if (isApproved) currentStageKey = "완료";
                else if (isReviewed) currentStageKey = "승인";
                else if (hasEditSubtitle) currentStageKey = "검수";
                else if (hasRawVideo) currentStageKey = "편집";
                else if (hasLessonPlan) currentStageKey = "촬영";

                return (
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
                      const isCurrentStage = col.key === currentStageKey;
                      return (
                        <div
                          key={col.key}
                          className={cn(
                            "px-1 py-1.5 rounded-sm",
                            isCurrentStage && "bg-accent/20",
                          )}
                        >
                          {col.key === "완료" ? (
                            <div className="flex items-center justify-center">
                              {isApproved ? (
                                <span
                                  className="inline-flex items-center justify-center h-7 w-7 rounded-lg"
                                  style={{
                                    backgroundColor: `${color}20`,
                                    color,
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg border-2 border-dashed border-neutral-200">
                                  <Circle className="h-2.5 w-2.5 text-neutral-300" />
                                </span>
                              )}
                            </div>
                          ) : col.key === "승인" && onApprovalToggle ? (
                            <ApprovalCell
                              lecture={lecture}
                              chapter={chapter.chapter}
                              lectureLabel={lecture.label}
                              color={color}
                              onToggle={onApprovalToggle}
                            />
                          ) : col.key === "검수" && onReviewToggle ? (
                            <ReviewCell
                              lecture={lecture}
                              color={color}
                              onToggle={onReviewToggle}
                            />
                          ) : (
                            <DeliverableCell
                              lecture={lecture}
                              taskKey={col.key}
                              color={color}
                              taskStatus={chapter.taskStatuses[col.key]}
                              onUploadUrl={onLectureUrlChange}
                            />
                          )}
                        </div>
                      );
                    })}
                    <div />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* 장 추가 버튼 */}
      {onAddChapter && planningComplete && (
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
