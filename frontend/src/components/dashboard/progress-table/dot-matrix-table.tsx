"use client";

import type { Project, KanbanColumn } from "@/lib/types";
import { KANBAN_COLUMNS } from "@/lib/constants";
import { getDday, formatDday, getDdayColor, cn } from "@/lib/utils";
import {
  getChapterKanbanColumn,
  getChapterDetailedStage,
} from "@/lib/process-helpers";

interface DotMatrixTableProps {
  projects: Project[];
}

const COL_LABEL: Record<KanbanColumn, string> = {
  교안: "교안",
  촬영: "촬영",
  "편집·검수": "편집",
  롤아웃: "승인",
};

const COL_STYLE: Record<KanbanColumn, string> = {
  교안: "bg-[#F5F0E8] text-[#8B7A55]",
  촬영: "bg-[#EEF0E6] text-[#6E7A55]",
  "편집·검수": "bg-[#EDF2DC] text-[#7A9445]",
  롤아웃: "bg-[#E5F0D0] text-[#628A38]",
};

function ProjectRow({ project }: { project: Project }) {
  const dday = getDday(project.rolloutDate);
  const chapters = Array.from(
    { length: project.chapterCount },
    (_, i) => i + 1,
  );

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border/40 last:border-b-0">
      {/* 강의명 */}
      <span className="text-[13.5px] font-medium text-foreground min-w-0 truncate shrink-0 max-w-[200px]">
        {project.title}
      </span>

      {/* 장별 진행 현황 — 한 줄 */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto">
        {chapters.map((ch) => {
          const col = getChapterKanbanColumn(project, ch);
          const detailedStage = getChapterDetailedStage(project, ch);
          const label = col === "편집·검수" ? detailedStage : COL_LABEL[col];
          return (
            <span
              key={ch}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-[2px] text-[10px] font-medium whitespace-nowrap shrink-0",
                COL_STYLE[col],
              )}
            >
              <span className="opacity-60">{ch}</span>
              {label}
            </span>
          );
        })}
      </div>

      {/* D-Day */}
      <span
        className={cn(
          "text-[12.5px] font-medium whitespace-nowrap ml-2 shrink-0",
          getDdayColor(dday),
        )}
      >
        {formatDday(dday)}
      </span>
    </div>
  );
}

export function DotMatrixTable({ projects }: DotMatrixTableProps) {
  return (
    <div className="rounded-2xl border border-border/50 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] overflow-hidden">
      {projects.map((project) => (
        <ProjectRow key={project.id} project={project} />
      ))}
    </div>
  );
}
