"use client";

import { useState } from "react";
import {
  ExternalLink,
  Circle,
  Link as LinkIcon,
  Check,
  ThumbsUp,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lecture, TaskStatus } from "@/lib/types";

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

/** 강별 결과물 링크 셀 (교안 링크 업로드도 포함) */
export function DeliverableCell({
  lecture,
  taskKey,
  color,
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

  // 교안 링크 업로드
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

/** 승인 셀 — 강 단위 (PM만 토글 가능) */
export function ApprovalCell({
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

/** 검수 셀 — 강 단위 (검수자만 토글 가능) */
export function ReviewCell({
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

/** 장 진행률 바 (강 승인 완료 수 / 전체 강 수) */
export function ChapterProgress({
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
