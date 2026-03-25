"use client";

import type { Project, TaskType } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Stage = "교안" | "촬영" | "편집" | "자막" | "검수" | "완료";

const STAGE_ORDER: TaskType[] = ["교안제작", "촬영", "편집", "자막", "검수"];

const STAGE_STYLE: Record<Stage, { bg: string; hex: string; label: string }> = {
  교안: { bg: "bg-neutral-300", hex: "#d4d4d4", label: "교안" },
  촬영: { bg: "bg-[#FFD400]", hex: "#FFD400", label: "촬영" },
  편집: { bg: "bg-[#F2E600]", hex: "#F2E600", label: "편집" },
  자막: { bg: "bg-[#D4E600]", hex: "#D4E600", label: "자막" },
  검수: { bg: "bg-[#A8E600]", hex: "#A8E600", label: "검수" },
  완료: { bg: "bg-[#66CC33]", hex: "#66CC33", label: "완료" },
};

function taskTypeToStage(t: TaskType): Stage {
  if (t === "교안제작") return "교안";
  if (t === "촬영") return "촬영";
  if (t === "편집") return "편집";
  if (t === "자막") return "자막";
  if (t === "검수") return "검수";
  return "교안";
}

function getChapterStage(project: Project, chapter: number): Stage {
  const chapterTasks = project.tasks.filter((t) => t.chapter === chapter);
  if (chapterTasks.length === 0) return "교안";

  const allDone = chapterTasks.every((t) => t.status === "완료");
  if (allDone) return "완료";

  for (let i = STAGE_ORDER.length - 1; i >= 0; i--) {
    const task = chapterTasks.find((t) => t.taskType === STAGE_ORDER[i]);
    if (task && (task.status === "진행" || task.status === "리뷰")) {
      return taskTypeToStage(STAGE_ORDER[i]);
    }
  }

  for (let i = STAGE_ORDER.length - 1; i >= 0; i--) {
    const task = chapterTasks.find((t) => t.taskType === STAGE_ORDER[i]);
    if (task && task.status === "완료") {
      const nextIdx = i + 1;
      if (nextIdx < STAGE_ORDER.length) {
        return taskTypeToStage(STAGE_ORDER[nextIdx]);
      }
      return "완료";
    }
  }

  return "교안";
}

interface ChapterPipelineProps {
  project: Project;
}

export function ChapterPipeline({ project }: ChapterPipelineProps) {
  if (project.chapterCount === 0) return null;

  const chapters = Array.from(
    { length: project.chapterCount },
    (_, i) => i + 1
  );
  const stages = chapters.map((ch) => getChapterStage(project, ch));

  return (
    <div className="space-y-1.5">
      {/* Segment bar */}
      <div className="flex gap-[3px]">
        {stages.map((stage, idx) => {
          const s = STAGE_STYLE[stage];
          return (
            <Tooltip key={idx}>
              <TooltipTrigger
                className={cn(
                  "h-[6px] flex-1 rounded-full transition-colors",
                  s.bg
                )}
              />
              <TooltipContent side="bottom" className="text-[10px] px-2 py-1">
                CH{chapters[idx]}: {s.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Legend: group consecutive same-stage chapters */}
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        {summarizeStages(chapters, stages).map((group, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground leading-none"
          >
            <span
              className={cn(
                "h-[5px] w-[5px] rounded-full",
                STAGE_STYLE[group.stage].bg
              )}
            />
            <span>
              {group.label}
              <span className="ml-0.5 opacity-60">{STAGE_STYLE[group.stage].label}</span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

interface StageGroup {
  stage: Stage;
  chapters: number[];
  label: string;
}

function summarizeStages(chapters: number[], stages: Stage[]): StageGroup[] {
  const raw: { stage: Stage; chapters: number[] }[] = [];

  for (let i = 0; i < stages.length; i++) {
    const last = raw[raw.length - 1];
    if (last && last.stage === stages[i]) {
      last.chapters.push(chapters[i]);
    } else {
      raw.push({ stage: stages[i], chapters: [chapters[i]] });
    }
  }

  return raw.map((g) => ({
    ...g,
    label:
      g.chapters.length === 1
        ? `CH${g.chapters[0]}`
        : `CH${g.chapters[0]}-${g.chapters[g.chapters.length - 1]}`,
  }));
}
