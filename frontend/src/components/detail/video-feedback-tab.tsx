"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Project, Lecture, ReviewScore } from "@/lib/types";
import { PM_QUESTIONS, CM_QUESTIONS } from "@/lib/types";
import ReviewForm from "./review-form";
import FeedbackVerdictPanel from "./feedback-verdict";

interface VideoFeedbackTabProps {
  project: Project;
}

export default function VideoFeedbackTab({ project }: VideoFeedbackTabProps) {
  const lectures = project.lectures;
  const chapters = useMemo(() => {
    const map = new Map<number, Lecture[]>();
    lectures.forEach((l) => {
      const arr = map.get(l.chapter) ?? [];
      arr.push(l);
      map.set(l.chapter, arr);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [lectures]);

  const [selectedLectureId, setSelectedLectureId] = useState<string>(
    lectures[0]?.id ?? ""
  );
  const [videoIdx, setVideoIdx] = useState(0);

  const currentLecture = lectures.find((l) => l.id === selectedLectureId);
  const existingFeedback = project.videoFeedbacks.find(
    (f) => f.lectureId === selectedLectureId
  );

  const [pmScores, setPmScores] = useState<ReviewScore[]>(
    existingFeedback?.pmReview?.scores ?? PM_QUESTIONS.map((q) => ({ questionId: q.id, score: 0, comment: "" }))
  );
  const [cmScores, setCmScores] = useState<ReviewScore[]>(
    existingFeedback?.cmReview?.scores ?? CM_QUESTIONS.map((q) => ({ questionId: q.id, score: 0, comment: "" }))
  );

  const handleLectureChange = (lecId: string) => {
    setSelectedLectureId(lecId);
    setVideoIdx(0);
    const fb = project.videoFeedbacks.find((f) => f.lectureId === lecId);
    setPmScores(
      fb?.pmReview?.scores ?? PM_QUESTIONS.map((q) => ({ questionId: q.id, score: 0, comment: "" }))
    );
    setCmScores(
      fb?.cmReview?.scores ?? CM_QUESTIONS.map((q) => ({ questionId: q.id, score: 0, comment: "" }))
    );
  };

  if (lectures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-sm text-muted-foreground">
        <Video className="h-10 w-10 mb-3 text-muted-foreground/40" />
        아직 등록된 강의 영상이 없습니다.
      </div>
    );
  }

  const videoCount = currentLecture?.videoUrls.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Lecture selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-muted-foreground">강 선택</span>
        <div className="flex flex-wrap gap-1.5">
          {chapters.map(([ch, lecs]) => (
            <div key={ch} className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground mr-1">
                {ch}장
              </span>
              {lecs.map((lec) => (
                <Button
                  key={lec.id}
                  variant={
                    lec.id === selectedLectureId ? "default" : "outline"
                  }
                  size="sm"
                  className={cn(
                    "h-7 px-2.5 text-xs",
                    lec.id === selectedLectureId && "shadow-sm"
                  )}
                  onClick={() => handleLectureChange(lec.id)}
                >
                  {lec.label}
                </Button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Video player area */}
      <Card>
        <CardContent className="p-0">
          <div className="relative aspect-video bg-neutral-900 rounded-t-xl flex items-center justify-center">
            {videoCount > 0 ? (
              <div className="text-center">
                <Play className="h-12 w-12 text-white/60 mx-auto" />
                <p className="text-xs text-white/40 mt-2">
                  {currentLecture?.videoUrls[videoIdx]}
                </p>
              </div>
            ) : (
              <p className="text-sm text-white/40">
                영상이 업로드되지 않았습니다
              </p>
            )}

            {/* Multi-video navigation */}
            {videoCount > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-black/30 hover:bg-black/50 text-white"
                  disabled={videoIdx === 0}
                  onClick={() => setVideoIdx((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-black/30 hover:bg-black/50 text-white"
                  disabled={videoIdx >= videoCount - 1}
                  onClick={() =>
                    setVideoIdx((p) => Math.min(videoCount - 1, p + 1))
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {Array.from({ length: videoCount }, (_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        i === videoIdx ? "bg-white" : "bg-white/30"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="p-4 text-center text-xs text-muted-foreground">
            {currentLecture?.label}강
            {videoCount > 1 && ` — 영상 ${videoIdx + 1}/${videoCount}`}
          </div>
        </CardContent>
      </Card>

      {/* Review forms: PM + CM side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <ReviewForm
              title="PM 검수 (영상 퀄리티)"
              questions={PM_QUESTIONS}
              scores={pmScores}
              onChange={setPmScores}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <ReviewForm
              title="커기매 검수 (영상 내용)"
              questions={CM_QUESTIONS}
              scores={cmScores}
              onChange={setCmScores}
            />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Verdict */}
      <FeedbackVerdictPanel pmScores={pmScores} cmScores={cmScores} />
    </div>
  );
}
