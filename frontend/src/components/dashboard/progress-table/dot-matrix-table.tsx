"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Project, KanbanColumn } from "@/lib/types";
import { KANBAN_COLUMNS } from "@/lib/constants";
import { getDday, formatDday, getDdayColor, cn } from "@/lib/utils";
import { getChapterKanbanColumn } from "@/lib/process-helpers";

interface DotMatrixTableProps {
  projects: Project[];
}

const COL_LABEL: Record<KanbanColumn, string> = {
  교안: "교안",
  촬영: "촬영",
  "편집·검수": "편집",
  롤아웃: "롤아웃",
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
    <div className="border-b border-border/60 last:border-b-0">
      {/* 프로젝트 헤더 */}
      <div
        className="flex items-center px-5 py-3.5 cursor-pointer select-none hover:bg-accent/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <ChevronRight
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground/60 transition-transform mr-2.5 shrink-0",
            open && "rotate-90",
          )}
        />
        <Link
          href={`/projects/${project.id}`}
          className="text-[13.5px] font-medium text-foreground hover:underline flex-1 min-w-0 truncate"
          onClick={(e) => e.stopPropagation()}
        >
          {project.title}
        </Link>
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
        <div className="px-5 pb-4 pt-0.5">
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `60px repeat(${KANBAN_COLUMNS.length}, 1fr)`,
            }}
          >
            {chapters.map((ch) => {
              const col = getChapterKanbanColumn(project, ch);
              return (
                <div key={ch} className="contents">
                  <span className="text-[11.5px] text-muted-foreground/70 py-1 pl-1">
                    {ch}장
                  </span>
                  {KANBAN_COLUMNS.map((kanbanCol) => (
                    <div
                      key={kanbanCol.id}
                      className="flex items-center justify-center py-1"
                    >
                      {kanbanCol.id === col && (
                        <span
                          className={cn(
                            "inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                            COL_STYLE[col],
                          )}
                        >
                          {COL_LABEL[col]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
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
