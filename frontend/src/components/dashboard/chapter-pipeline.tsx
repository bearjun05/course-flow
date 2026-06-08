"use client";

import type { BusinessUnit, Project, TaskType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { isStageDisabled } from "@/lib/process-helpers";

// 파이프라인 단계: 표시명 + 해당 공정. 사업부에서 비활성인 단계(AI 캠퍼스=촬영·편집·자막)는 슬롯 자체를 뺀다.
const PIPELINE_STAGES = [
  { name: "교안", taskTypes: ["교안제작"] },
  { name: "촬영", taskTypes: ["촬영"] },
  { name: "편집·자막", taskTypes: ["편집", "자막"] },
  { name: "검수", taskTypes: ["검수", "승인"] },
] as const satisfies readonly { name: string; taskTypes: TaskType[] }[];
type PipelineStageName = (typeof PIPELINE_STAGES)[number]["name"];

/** 사업부에 적용되는 파이프라인 단계만 (AI 캠퍼스는 교안·검수만) */
function applicableStages(bu: BusinessUnit) {
  return PIPELINE_STAGES.filter((s) => !isStageDisabled(bu, s.name));
}

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
  const stages = applicableStages(project.businessUnit);
  const tasks = project.tasks.filter((t) => t.chapter === chapter);
  if (tasks.length === 0) return { filledCount: 0, stageName: stages[0].name };

  // 가장 진행된 적용 단계 찾기 (뒤에서부터)
  for (let i = stages.length - 1; i >= 0; i--) {
    const stage = stages[i];
    const reached = stage.taskTypes.some((tt) => {
      const task = tasks.find((t) => t.taskType === tt);
      return (
        task &&
        (task.status === "완료" ||
          task.status === "진행" ||
          task.status === "리뷰")
      );
    });
    if (reached) return { filledCount: i + 1, stageName: stage.name };
  }

  return { filledCount: 0, stageName: stages[0].name };
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
        : `${g.chapters[0]}~${g.chapters[g.chapters.length - 1]}장`,
  }));
}

export function ChapterPipeline({ project }: ChapterPipelineProps) {
  if (project.chapterCount === 0) return null;

  // 사업부별 슬롯 수 (AI 캠퍼스는 교안·검수 2칸)
  const slotTotal = applicableStages(project.businessUnit).length;
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
                {Array.from({ length: slotTotal }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-[4px] flex-1 rounded-full",
                      i < filledCount ? SLOT_FILLED_COLORS[i] : "bg-black/8",
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] text-neutral-400 leading-none truncate">
                {ch}장 · {stageName}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
