"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** 기획 완료 시 상위로 제출되는 데이터 구조 */
export interface PlanningSubmitData {
  chapters: {
    title: string;
    duration: number;
    lectures: { title: string }[];
  }[];
  curriculumLink: string;
}

interface DraftLecture {
  id: string;
  title: string;
}

interface DraftChapter {
  id: string;
  title: string;
  duration: string;
  lectures: DraftLecture[];
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function newLecture(): DraftLecture {
  return { id: uid(), title: "" };
}

function newChapter(): DraftChapter {
  return { id: uid(), title: "", duration: "", lectures: [newLecture()] };
}

interface PlanningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PlanningSubmitData) => void;
}

/**
 * 기획 완료 모달
 * - 커리큘럼 링크 입력
 * - 장/강 목록 입력 (장 추가/삭제, 강 추가/삭제)
 * - 제출 시 상위(page)에서 태스크·Lecture·Drive 폴더 생성 처리
 */
export default function PlanningModal({
  open,
  onOpenChange,
  onSubmit,
}: PlanningModalProps) {
  const [curriculum, setCurriculum] = useState("");
  const [chapters, setChapters] = useState<DraftChapter[]>([newChapter()]);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (open) {
      setCurriculum("");
      setChapters([newChapter()]);
    }
  }, [open]);

  if (!open) return null;

  const canSubmit =
    chapters.length > 0 &&
    chapters.every(
      (c) =>
        c.title.trim() &&
        parseFloat(c.duration) > 0 &&
        c.lectures.length > 0 &&
        c.lectures.every((l) => l.title.trim()),
    ) &&
    curriculum.trim().length > 0;

  const updateChapter = (idx: number, patch: Partial<DraftChapter>) => {
    setChapters((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const addChapter = () => setChapters((prev) => [...prev, newChapter()]);

  const removeChapter = (idx: number) =>
    setChapters((prev) => prev.filter((_, i) => i !== idx));

  const updateLecture = (chIdx: number, lecIdx: number, title: string) => {
    setChapters((prev) => {
      const next = [...prev];
      const lectures = [...next[chIdx].lectures];
      lectures[lecIdx] = { ...lectures[lecIdx], title };
      next[chIdx] = { ...next[chIdx], lectures };
      return next;
    });
  };

  const addLecture = (chIdx: number) => {
    setChapters((prev) => {
      const next = [...prev];
      next[chIdx] = {
        ...next[chIdx],
        lectures: [...next[chIdx].lectures, newLecture()],
      };
      return next;
    });
  };

  const removeLecture = (chIdx: number, lecIdx: number) => {
    setChapters((prev) => {
      const next = [...prev];
      next[chIdx] = {
        ...next[chIdx],
        lectures: next[chIdx].lectures.filter((_, i) => i !== lecIdx),
      };
      return next;
    });
  };

  const handleSubmit = () => {
    onSubmit({
      chapters: chapters.map((c) => ({
        title: c.title.trim(),
        duration: parseFloat(c.duration) || 0,
        lectures: c.lectures.map((l) => ({ title: l.title.trim() })),
      })),
      curriculumLink: curriculum.trim(),
    });
    onOpenChange(false);
  };

  const totalDuration = chapters.reduce(
    (s, c) => s + (parseFloat(c.duration) || 0),
    0,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-[480px] max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-neutral-100">
          <h3 className="text-base font-semibold">기획 완료</h3>
          <p className="text-xs text-muted-foreground mt-1">
            커리큘럼 링크와 장 정보를 입력하면 기획이 완료됩니다.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* 커리큘럼 링크 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-700">
              커리큘럼 링크 <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={curriculum}
              onChange={(e) => setCurriculum(e.target.value)}
              placeholder="https://notion.so/..."
              className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg focus:border-[#7C8DBC] focus:outline-none"
            />
            <p className="text-[11px] text-neutral-400">
              노션 또는 구글 독스 링크. 바로가기 &gt; 커리큘럼에 자동
              등록됩니다.
            </p>
          </div>

          {/* 장 목록 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-700">
                장 목록 <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-neutral-400">
                총 {totalDuration}시간
              </span>
            </div>
            <div className="space-y-3">
              {chapters.map((ch, i) => (
                <div
                  key={ch.id}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-3 space-y-2"
                >
                  {/* 장 제목 + 분량 */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-neutral-600 w-7 shrink-0">
                      {i + 1}장
                    </span>
                    <input
                      type="text"
                      value={ch.title}
                      onChange={(e) =>
                        updateChapter(i, { title: e.target.value })
                      }
                      placeholder="장 제목"
                      className="flex-1 h-8 px-2.5 text-sm bg-white border border-neutral-200 rounded-lg focus:border-[#7C8DBC] focus:outline-none"
                    />
                    <div className="relative">
                      <input
                        type="number"
                        step={0.5}
                        min={0}
                        value={ch.duration}
                        onChange={(e) =>
                          updateChapter(i, { duration: e.target.value })
                        }
                        placeholder="분량"
                        className="w-20 h-8 pl-2.5 pr-6 text-sm bg-white border border-neutral-200 rounded-lg focus:border-[#7C8DBC] focus:outline-none"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400">
                        h
                      </span>
                    </div>
                    {chapters.length > 1 && (
                      <button
                        onClick={() => removeChapter(i)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50"
                        title="장 삭제"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* 강 목록 */}
                  <div className="pl-9 space-y-1.5">
                    {ch.lectures.map((lec, li) => (
                      <div key={lec.id} className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-400 w-8 shrink-0">
                          {i + 1}-{li + 1}
                        </span>
                        <input
                          type="text"
                          value={lec.title}
                          onChange={(e) => updateLecture(i, li, e.target.value)}
                          placeholder="강 제목"
                          className="flex-1 h-7 px-2.5 text-[13px] bg-white border border-neutral-200 rounded-md focus:border-[#7C8DBC] focus:outline-none"
                        />
                        {ch.lectures.length > 1 && (
                          <button
                            onClick={() => removeLecture(i, li)}
                            className="h-7 w-7 flex items-center justify-center rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 text-xs"
                            title="강 삭제"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addLecture(i)}
                      className="w-full h-7 flex items-center justify-center gap-1 text-[11px] text-neutral-400 border border-dashed border-neutral-200 rounded-md hover:border-[#7C8DBC] hover:text-[#7C8DBC]"
                    >
                      <Plus className="h-2.5 w-2.5" />강 추가
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addChapter}
              className="w-full h-9 flex items-center justify-center gap-1.5 text-xs text-neutral-500 border border-dashed border-neutral-200 rounded-lg hover:border-[#7C8DBC] hover:text-[#7C8DBC]"
            >
              <Plus className="h-3 w-3" />장 추가
            </button>
          </div>
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-neutral-100">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 h-9 rounded-lg border border-neutral-200 text-sm text-muted-foreground hover:bg-neutral-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "flex-1 h-9 rounded-lg text-sm font-medium transition-colors",
              canSubmit
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-neutral-100 text-neutral-400 cursor-not-allowed",
            )}
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
}
