"use client";

import type { Project, TaskType } from "@/lib/types";
import { cn } from "@/lib/utils";

const PIPELINE_STAGE_NAMES = ["교안", "촬영", "편집", "자막", "검수"] as const;
type PipelineStageName = (typeof PIPELINE_STAGE_NAMES)[number];

const PIPELINE_TASK_TYPES: TaskType[] = [
  "교안제작",
  "촬영",
  "편집",
  "자막",
  "검수",
];

const SLOT_FILLED_COLOR = "bg-[#49C9E3]/80";

function getChapterProgress(
  project: Project,
  chapter: number,
): { filledCount: number; stageName: PipelineStageName } {
  const tasks = project.tasks.filter((t) => t.chapter === chapter);
  if (tasks.length === 0) return { filledCount: 0, stageName: "교안" };

  // 가장 진행된 단계 찾기 (역순 탐색)
  for (let i = 4; i >= 0; i--) {
    const taskType = PIPELINE_TASK_TYPES[i];
    const task = tasks.find((t) => t.taskType === taskType);
    if (
      task &&
      (task.status === "완료" ||
        task.status === "진행" ||
        task.status === "리뷰")
    ) {
      return { filledCount: i + 1, stageName: PIPELINE_STAGE_NAMES[i] };
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

  return (
    <div className="flex w-full gap-2">
      {chapterData.map(({ ch, filledCount, stageName }) => (
        <div key={ch} className="flex-1 flex flex-col gap-1">
          <div className="flex gap-[2px]">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-[4px] flex-1 rounded-full",
                  i < filledCount ? SLOT_FILLED_COLOR : "bg-black/8",
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
  );
}
