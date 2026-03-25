"use client";

import { useMemo } from "react";
import { Copy, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReviewScore, FeedbackVerdict } from "@/lib/types";
import { PM_QUESTIONS, CM_QUESTIONS } from "@/lib/types";

const PM_TEMPLATES: Record<string, Record<number, string>> = {
  "pm-q1": {
    5: "음성 전달이 전반적으로 매우 안정적이어서 수강에 불편함이 없습니다.",
    4: "음성 전달은 전반적으로 안정적입니다. 다만 일부 구간에서 톤이나 볼륨 편차가 있다면 조금만 더 다듬어주시면 좋겠습니다.",
    3: "음성 전달은 전반적으로 무난하지만, 일부 구간에서 발음이나 볼륨이 또렷하지 않아 보완이 필요합니다.",
    2: "음성 전달에서 불명확한 구간이 있어 수강 경험에 영향을 줄 수 있습니다. 발음, 볼륨, 잡음 여부를 중심으로 보완이 필요합니다.",
    1: "음성 품질 이슈가 커서 현재 상태로는 수강 진행이 어렵습니다. 재녹음 또는 재촬영이 필요합니다.",
  },
  "pm-q2": {
    5: "화면 구성과 정보 배치가 명확하여 학습 흐름을 따라가기 좋습니다.",
    3: "화면 구성은 이해 가능한 수준이지만, 강조 요소나 자료 가독성 측면에서 일부 보완이 필요합니다.",
    1: "화면 구성과 자료 가독성이 떨어져 학습 집중에 방해가 될 수 있습니다.",
  },
  "pm-q4": {
    5: "진행 속도와 호흡이 자연스러워 몰입감 있게 시청할 수 있습니다.",
    3: "전체 진행은 무난하지만, 일부 구간에서 템포가 다소 빠르거나 느리게 느껴질 수 있습니다.",
    1: "진행 속도와 호흡이 일정하지 않아 전달력이 떨어집니다.",
  },
};

const CM_TEMPLATES: Record<string, Record<number, string>> = {
  "cm-q1": {
    5: "이번 수업에서 의도한 학습 목표가 영상에 충분히 반영되어 있습니다.",
    4: "전반적으로 학습 목표는 잘 반영되어 있습니다. 다만 일부 메시지는 조금 더 선명하게 드러나면 좋겠습니다.",
    3: "핵심 학습 목표는 담겨 있으나, 수강생이 명확하게 인지하기에는 보완이 필요한 부분이 있습니다.",
    2: "학습 목표가 영상에서 충분히 드러나지 않아 의도 전달이 약합니다.",
    1: "이번 수업의 핵심 목표가 충분히 반영되지 않아 재구성이 필요합니다.",
  },
  "cm-q2": {
    5: "설명이 정확하고 명료하여 오해 없이 학습할 수 있습니다.",
    3: "전반적인 설명은 가능하지만, 일부 표현은 오해 소지가 있어 다듬는 것이 좋겠습니다.",
    1: "설명 정확성 측면에서 보완이 필요합니다.",
  },
  "cm-q3": {
    5: "수강생 입장에서 이해하기 쉽게 설명되어 있어 학습 진입 장벽이 낮습니다.",
    3: "설명은 가능하지만 초심자 기준에서는 일부 구간이 어렵게 느껴질 수 있습니다.",
    1: "수강생 관점에서 설명의 난이도와 친절도가 다소 부족합니다.",
  },
};

function getTemplateText(
  templates: Record<string, Record<number, string>>,
  qId: string,
  score: number
): string {
  const t = templates[qId];
  if (!t) return "";
  if (t[score]) return t[score];
  const keys = Object.keys(t)
    .map(Number)
    .sort((a, b) => a - b);
  for (const k of keys) {
    if (score <= k) return t[k];
  }
  return t[keys[keys.length - 1]] ?? "";
}

function generateFeedbackText(
  pmScores: ReviewScore[],
  cmScores: ReviewScore[]
): string {
  const lines: string[] = [];

  const goodPm = pmScores.filter((s) => s.score >= 4);
  const badPm = pmScores.filter((s) => s.score <= 3 && s.score > 0);
  const goodCm = cmScores.filter((s) => s.score >= 4);
  const badCm = cmScores.filter((s) => s.score <= 3 && s.score > 0);

  if (goodPm.length > 0 || goodCm.length > 0) {
    lines.push("--- 잘한 점 ---");
    goodPm.forEach((s) => {
      const txt = getTemplateText(PM_TEMPLATES, s.questionId, s.score);
      if (txt) lines.push(`- ${txt}`);
    });
    goodCm.forEach((s) => {
      const txt = getTemplateText(CM_TEMPLATES, s.questionId, s.score);
      if (txt) lines.push(`- ${txt}`);
    });
  }

  if (badPm.length > 0 || badCm.length > 0) {
    lines.push("");
    lines.push("--- 보완 필요 ---");
    badPm.forEach((s) => {
      let txt = getTemplateText(PM_TEMPLATES, s.questionId, s.score);
      if (s.comment) txt += ` 특히 ${s.comment}`;
      if (txt) lines.push(`- ${txt}`);
    });
    badCm.forEach((s) => {
      let txt = getTemplateText(CM_TEMPLATES, s.questionId, s.score);
      if (s.comment) txt += ` 특히 ${s.comment}`;
      if (txt) lines.push(`- ${txt}`);
    });
  }

  return lines.join("\n");
}

interface FeedbackVerdictProps {
  pmScores: ReviewScore[];
  cmScores: ReviewScore[];
}

export default function FeedbackVerdictPanel({
  pmScores,
  cmScores,
}: FeedbackVerdictProps) {
  const { verdict, avgPm, avgCm } = useMemo(() => {
    const pmFilled = pmScores.filter((s) => s.score > 0);
    const cmFilled = cmScores.filter((s) => s.score > 0);
    if (pmFilled.length < 6 || cmFilled.length < 6) {
      return { verdict: null as FeedbackVerdict, avgPm: 0, avgCm: 0 };
    }

    const ap = +(pmFilled.reduce((a, b) => a + b.score, 0) / pmFilled.length).toFixed(1);
    const ac = +(cmFilled.reduce((a, b) => a + b.score, 0) / cmFilled.length).toFixed(1);
    const totalAvg = +((ap + ac) / 2).toFixed(1);

    const pmCritical = PM_QUESTIONS.filter((q) => q.critical);
    const cmCritical = CM_QUESTIONS.filter((q) => q.critical);
    const hasCriticalFail = [
      ...pmCritical.map((q) => pmScores.find((s) => s.questionId === q.id)),
      ...cmCritical.map((q) => cmScores.find((s) => s.questionId === q.id)),
    ].some((s) => s && s.score <= 2);

    let v: FeedbackVerdict;
    if (hasCriticalFail) {
      v = totalAvg >= 3.5 ? "보완" : "재촬영";
    } else if (totalAvg >= 4.3) {
      v = "승인";
    } else if (totalAvg >= 3.5) {
      v = "보완";
    } else {
      v = "재촬영";
    }
    return { verdict: v, avgPm: ap, avgCm: ac };
  }, [pmScores, cmScores]);

  const feedbackText = useMemo(
    () => generateFeedbackText(pmScores, cmScores),
    [pmScores, cmScores]
  );

  const handleCopy = () => {
    const verdictLine =
      verdict === "승인"
        ? "전반적으로 의도한 내용과 영상 퀄리티가 충분히 확보되어 승인 가능합니다."
        : verdict === "보완"
          ? "핵심 방향은 적절하나 일부 보완이 필요하여 수정 후 재검토가 필요합니다."
          : "현재 상태로는 수강 경험과 내용 전달 측면에서 한계가 있어 재촬영이 필요합니다.";
    navigator.clipboard.writeText(`[판정: ${verdict}]\n${verdictLine}\n\n${feedbackText}`);
  };

  if (!verdict) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          PM과 커기매 모두 6문항 점수를 입력하면 자동 판정됩니다.
        </CardContent>
      </Card>
    );
  }

  const VerdictIcon =
    verdict === "승인"
      ? CheckCircle
      : verdict === "보완"
        ? AlertTriangle
        : XCircle;
  const verdictColor =
    verdict === "승인"
      ? "text-chart-3"
      : verdict === "보완"
        ? "text-chart-4"
        : "text-destructive";
  const verdictBg =
    verdict === "승인"
      ? "bg-chart-3/10"
      : verdict === "보완"
        ? "bg-chart-4/10"
        : "bg-destructive/10";

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Verdict badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg", verdictBg)}>
              <VerdictIcon className={cn("h-5 w-5", verdictColor)} />
            </div>
            <div>
              <Badge
                className={cn(
                  "text-sm font-semibold border-0",
                  verdictBg,
                  verdictColor
                )}
              >
                {verdict}
              </Badge>
              <p className="text-xs text-muted-foreground mt-0.5">
                PM {avgPm}점 · 커기매 {avgCm}점 · 종합{" "}
                {((avgPm + avgCm) / 2).toFixed(1)}점
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={handleCopy}
          >
            <Copy className="h-3.5 w-3.5" />
            복사
          </Button>
        </div>

        {/* Generated feedback */}
        <div className="rounded-lg border border-border bg-muted/20 p-4 text-xs leading-relaxed whitespace-pre-line">
          {feedbackText || "피드백 문구가 생성됩니다."}
        </div>
      </CardContent>
    </Card>
  );
}
