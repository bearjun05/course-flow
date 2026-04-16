"use client";

import type { Project, TaskType } from "@/lib/types";
import { cn } from "@/lib/utils";

const PIPELINE_STAGE_NAMES = ["교안", "촬영", "편집·자막", "검수"] as const;
type PipelineStageName = (typeof PIPELINE_STAGE_NAMES)[number];

const PIPELINE_TASK_TYPES: TaskType[] = [
  "교안제작",
  "촬영",
  "편집",
  "자막",
  "검수",
  "승인",
];

const SLOT_FILLED_COLORS = [
  "bg-[#DDE8C0]",
  "bg-[#BACE80]",
  "bg-[#A8BE60]",
  "bg-[#8AAE50]",
];

function getChapterProgress(
  project: Project,
  chapter: number,
): { filledCount: number; stageName: PipelineStageName } {
  const tasks = project.tasks.filter((t) => t.chapter === chapter);
  if (tasks.length === 0) return { filledCount: 0, stageName: "교안" };

  // 4단계 매핑: 교안(0) → 촬영(1) → 편집·자막(2) → 검수(3)
  // 승인/검수 완료 → 검수 4칸 채움
  for (let i = PIPELINE_TASK_TYPES.length - 1; i >= 0; i--) {
    const taskType = PIPELINE_TASK_TYPES[i];
    const task = tasks.find((t) => t.taskType === taskType);
    if (
      task &&
      (task.status === "완료" ||
        task.status === "진행" ||
        task.status === "리뷰")
    ) {
      if (taskType === "승인" || taskType === "검수")
        return { filledCount: 4, stageName: "검수" };
      if (taskType === "자막" || taskType === "편집")
        return { filledCount: 3, stageName: "편집·자막" };
      if (taskType === "촬영") return { filledCount: 2, stageName: "촬영" };
      return { filledCount: 1, stageName: "교안" };
    }
  }

  return { filledCount: 0, stageName: "교안" };
}

interface ChapterPipelineProps {
  project: Project;
}

interface ChapterData {
  ch: number;
  filledCount: number;
  stageName: PipelineStageName;
}

interface StageGroup {
  stageName: PipelineStageName;
  chapters: number[];
  label: string;
}

function summarizeChapters(chapterData: ChapterData[]): StageGroup[] {
  const raw: { stageName: PipelineStageName; chapters: number[] }[] = [];
  for (const { ch, stageName } of chapterData) {
    const last = raw[raw.length - 1];
    if (last && last.stageName === stageName) {
      last.chapters.push(ch);
    } else {
      raw.push({ stageName, chapters: [ch] });
    }
  }
  return raw.map((g) => ({
    ...g,
    label:
      g.chapters.length === 1
        ? `${g.chapters[0]}장`
        : `${g.chapters[0]}-${g.chapters[g.chapters.length - 1]}장`,
  }));
}

export function ChapterPipeline({ project }: ChapterPipelineProps) {
  if (project.chapterCount === 0) return null;

  const chapters = Array.from(
    { length: project.chapterCount },
    (_, i) => i + 1,
  );
  const chapterData: ChapterData[] = chapters.map((ch) => ({
    ch,
    ...getChapterProgress(project, ch),
  }));

  const CHUNK = chapterData.length <= 6 ? chapterData.length : 5;
  const rowCount = Math.ceil(chapterData.length / CHUNK);
  const rows = Array.from({ length: rowCount }, (_, ri) =>
    chapterData.slice(ri * CHUNK, (ri + 1) * CHUNK),
  );

  return (
    <div className={cn("flex flex-col", rows.length > 1 ? "gap-2" : "")}>
      {rows.map((row, ri) => (
        <div key={ri} className="flex w-full gap-2">
          {row.map(({ ch, filledCount, stageName }) => (
            <div key={ch} className="flex-1 flex flex-col gap-1">
              <div className="flex gap-[2px]">
                {Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-[4px] flex-1 rounded-full",
                      i < filledCount ? SLOT_FILLED_COLORS[i] : "bg-black/8",
                    )}
                  />
                ))}
              </div>
              <span className="text-[9px] text-neutral-400 leading-none truncate">
                {ch}장 · {stageName}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
