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

// 채워진 슬롯에 사용할 색상 (교안→촬영→편집→자막→검수 순)
const SLOT_FILLED_COLORS = [
  "bg-neutral-300", // 교안
  "bg-[#FFD400]", // 촬영
  "bg-[#F2E600]", // 편집
  "bg-[#D4E600]", // 자막
  "bg-[#A8E600]", // 검수
];

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
  const groups = summarizeChapters(chapterData);

  return (
    <div className="space-y-1.5">
      {/* 챕터별 5칸 진척도 — 전체 너비 채움 */}
      <div className="flex w-full gap-2">
        {chapterData.map(({ ch, filledCount }) => (
          <div key={ch} className="flex flex-1 gap-[2px]">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-[7px] flex-1 rounded-[2px]",
                  i < filledCount ? SLOT_FILLED_COLORS[i] : "bg-neutral-100",
                )}
              />
            ))}
          </div>
        ))}
      </div>

      {/* N장·단계 라벨 */}
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        {groups.map((group, idx) => (
          <span
            key={idx}
            className="text-[10px] leading-none text-muted-foreground"
          >
            <span className="font-medium">{group.label}</span>
            <span className="mx-0.5 opacity-40">·</span>
            <span>{group.stageName}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
