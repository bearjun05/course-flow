"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
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

function ProjectRows({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const dday = getDday(project.rolloutDate);
  const chapters = Array.from(
    { length: project.chapterCount },
    (_, i) => i + 1,
  );

  return (
    <div className={cn("border-b border-border/40 last:border-b-0")}>
      {/* 프로젝트 헤더 — 전체 클릭으로 토글 */}
      <div
        className="flex items-center px-5 py-3.5 cursor-pointer select-none hover:bg-accent/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <ChevronRight
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground/50 transition-transform mr-3 shrink-0",
            open && "rotate-90",
          )}
        />
        <span className="text-[13.5px] font-medium text-foreground flex-1 min-w-0 truncate">
          {project.title}
        </span>
        <span
          className={cn(
            "text-[12.5px] font-medium whitespace-nowrap ml-4",
            getDdayColor(dday),
          )}
        >
          {formatDday(dday)}
        </span>
      </div>

      {/* 장별 공정 표시 */}
      {open && (
        <div className="mx-5 mb-4 rounded-xl border border-border/40 overflow-hidden bg-muted/10">
          {chapters.map((ch, idx) => {
            const col = getChapterKanbanColumn(project, ch);
            const detailedStage = getChapterDetailedStage(project, ch);
            const label = col === "편집·검수" ? detailedStage : COL_LABEL[col];
            return (
              <div
                key={ch}
                className={cn(
                  "grid items-center py-2.5 px-4",
                  idx > 0 && "border-t border-border/30",
                )}
                style={{
                  gridTemplateColumns: `48px repeat(${KANBAN_COLUMNS.length}, 1fr)`,
                }}
              >
                <span className="text-[11.5px] font-medium text-muted-foreground/70">
                  {ch}장
                </span>
                {KANBAN_COLUMNS.map((kanbanCol) => (
                  <div
                    key={kanbanCol.id}
                    className="flex items-center justify-center"
                  >
                    {kanbanCol.id === col && (
                      <span
                        className={cn(
                          "inline-block rounded-full px-3 py-[3px] text-[10.5px] font-medium",
                          COL_STYLE[col],
                        )}
                      >
                        {label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DotMatrixTable({ projects }: DotMatrixTableProps) {
  return (
    <div className="rounded-2xl border border-border/50 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] overflow-hidden">
      {projects.map((project) => (
        <ProjectRows key={project.id} project={project} />
      ))}
    </div>
  );
}
