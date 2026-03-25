"use client";

import { cn } from "@/lib/utils";
import type { ReviewScore } from "@/lib/types";

interface ReviewQuestion {
  id: string;
  text: string;
  critical: boolean;
}

interface ReviewFormProps {
  title: string;
  questions: readonly ReviewQuestion[];
  scores: ReviewScore[];
  onChange: (scores: ReviewScore[]) => void;
  readOnly?: boolean;
}

const SCORE_LABELS = ["", "매우 미흡", "미흡", "보통", "좋음", "매우 좋음"];

export default function ReviewForm({
  title,
  questions,
  scores,
  onChange,
  readOnly,
}: ReviewFormProps) {
  const getScore = (qId: string) =>
    scores.find((s) => s.questionId === qId);

  const updateScore = (qId: string, value: number) => {
    const existing = scores.find((s) => s.questionId === qId);
    if (existing) {
      onChange(
        scores.map((s) =>
          s.questionId === qId ? { ...s, score: value } : s
        )
      );
    } else {
      onChange([...scores, { questionId: qId, score: value, comment: "" }]);
    }
  };

  const updateComment = (qId: string, comment: string) => {
    const existing = scores.find((s) => s.questionId === qId);
    if (existing) {
      onChange(
        scores.map((s) =>
          s.questionId === qId ? { ...s, comment } : s
        )
      );
    } else {
      onChange([...scores, { questionId: qId, score: 0, comment }]);
    }
  };

  const avg =
    scores.length > 0 && scores.every((s) => s.score > 0)
      ? +(scores.reduce((a, b) => a + b.score, 0) / scores.length).toFixed(1)
      : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        {avg !== null && (
          <span
            className={cn(
              "text-sm font-semibold",
              avg >= 4.3
                ? "text-chart-3"
                : avg >= 3.5
                  ? "text-chart-4"
                  : "text-destructive"
            )}
          >
            평균 {avg}점
          </span>
        )}
      </div>

      {questions.map((q, idx) => {
        const sc = getScore(q.id);
        return (
          <div key={q.id} className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground w-5 shrink-0 pt-0.5">
                Q{idx + 1}
              </span>
              <p className="text-xs leading-relaxed flex-1">
                {q.text}
                {q.critical && (
                  <span className="ml-1 text-destructive text-[10px] font-medium">
                    치명
                  </span>
                )}
              </p>
            </div>

            {/* Score radio */}
            <div className="flex items-center gap-1 ml-7">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  disabled={readOnly}
                  onClick={() => updateScore(q.id, v)}
                  className={cn(
                    "h-7 w-7 rounded-md text-xs font-medium transition-colors",
                    sc?.score === v
                      ? v >= 4
                        ? "bg-primary text-primary-foreground"
                        : v >= 3
                          ? "bg-chart-4 text-white"
                          : "bg-destructive text-white"
                      : "bg-muted hover:bg-accent text-muted-foreground"
                  )}
                  title={SCORE_LABELS[v]}
                >
                  {v}
                </button>
              ))}
              {sc?.score && (
                <span className="ml-2 text-[10px] text-muted-foreground">
                  {SCORE_LABELS[sc.score]}
                </span>
              )}
            </div>

            {/* Comment */}
            <div className="ml-7">
              <input
                type="text"
                readOnly={readOnly}
                placeholder="타임스탬프 코멘트 (예: 12:35 화면 전환 어색)"
                value={sc?.comment ?? ""}
                onChange={(e) => updateComment(q.id, e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-border bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
