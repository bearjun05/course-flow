"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Project, KanbanColumn } from "@/lib/types";
import { KANBAN_COLUMNS } from "@/lib/constants";
import { getDday, formatDday, getDdayColor, cn } from "@/lib/utils";
import { getChapterKanbanColumn } from "@/lib/process-helpers";

export type DotStyle = "dot" | "label";

interface DotMatrixTableProps {
  projects: Project[];
  dotStyle: DotStyle;
}

/** 칸반 열의 짧은 라벨 */
const COL_SHORT_LABEL: Record<KanbanColumn, string> = {
  교안: "교안",
  촬영: "촬영",
  "편집·검수": "편집",
  롤아웃: "롤아웃",
};

function ProjectRows({
  project,
  dotStyle,
}: {
  project: Project;
  dotStyle: DotStyle;
}) {
  const [open, setOpen] = useState(false);
  const dday = getDday(project.rolloutDate);
  const chapters = Array.from(
    { length: project.chapterCount },
    (_, i) => i + 1,
  );

  return (
    <tbody className="border-b border-border">
      {/* 프로젝트 헤더 행 (토글) */}
      <tr
        className="bg-muted/15 cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <ChevronRight
              className={cn(
                "w-3.5 h-3.5 text-muted-foreground transition-transform",
                open && "rotate-90",
              )}
            />
            <Link
              href={`/projects/${project.id}`}
              className="text-[13px] font-medium text-foreground hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {project.title}
            </Link>
          </div>
        </td>
        {KANBAN_COLUMNS.map((col) => (
          <td key={col.id} />
        ))}
        <td className="px-4 py-2.5 text-right">
          <span
            className={cn(
              "text-[12px] font-medium whitespace-nowrap",
              getDdayColor(dday),
            )}
          >
            {formatDday(dday)}
          </span>
        </td>
      </tr>

      {/* 장별 서브 행 */}
      {open &&
        chapters.map((ch) => {
          const col = getChapterKanbanColumn(project, ch);
          return (
            <tr key={ch} className="transition-colors hover:bg-muted/10">
              <td className="pl-9 pr-4 py-1.5 text-[12px] text-muted-foreground">
                {ch}장
              </td>
              {KANBAN_COLUMNS.map((kanbanCol) => (
                <td key={kanbanCol.id} className="px-4 py-1.5 text-center">
                  {kanbanCol.id === col &&
                    (dotStyle === "dot" ? (
                      <span className="inline-block h-3 w-3 rounded-full bg-[#DDE8C0]" />
                    ) : (
                      <span className="inline-block rounded-md bg-[#EDF2DC] px-1.5 py-0.5 text-[10px] font-medium text-[#7A9445]">
                        {COL_SHORT_LABEL[col]}
                      </span>
                    ))}
                </td>
              ))}
              <td />
            </tr>
          );
        })}
    </tbody>
  );
}

export function DotMatrixTable({ projects, dotStyle }: DotMatrixTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-[240px]">
              강의명
            </th>
            {KANBAN_COLUMNS.map((col) => (
              <th
                key={col.id}
                className="px-4 py-2.5 text-center font-medium text-muted-foreground min-w-[100px]"
              >
                {col.label}
              </th>
            ))}
            <th className="px-4 py-2.5 text-right font-medium text-muted-foreground w-[80px]">
              마감
            </th>
          </tr>
        </thead>
        {projects.map((project) => (
          <ProjectRows key={project.id} project={project} dotStyle={dotStyle} />
        ))}
      </table>
    </div>
  );
}
