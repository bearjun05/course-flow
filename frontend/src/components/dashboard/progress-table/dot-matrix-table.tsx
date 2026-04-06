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

const COL_HEADER: Record<KanbanColumn, string> = {
  교안: "교안",
  촬영: "촬영",
  "편집·검수": "편집·검수",
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

  // 장별로 어느 공정에 있는지 그룹핑
  const chaptersByCol: Record<KanbanColumn, { ch: number; label: string }[]> = {
    교안: [],
    촬영: [],
    "편집·검수": [],
    롤아웃: [],
  };

  for (const ch of chapters) {
    const col = getChapterKanbanColumn(project, ch);
    const detailedStage = getChapterDetailedStage(project, ch);
    const label = col === "편집·검수" ? `${ch}장 ${detailedStage}` : `${ch}장`;
    chaptersByCol[col].push({ ch, label });
  }

  return (
    <tr className="border-b border-border/40 last:border-b-0">
      {/* 강의명 */}
      <td className="px-4 py-3 text-[13px] font-medium text-foreground max-w-[180px] truncate">
        {project.title}
      </td>

      {/* 공정별 장 목록 */}
      {KANBAN_COLUMNS.map((kanbanCol) => {
        const items = chaptersByCol[kanbanCol.id];
        return (
          <td key={kanbanCol.id} className="px-3 py-3">
            {items.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {items.map((item) => (
                  <span
                    key={item.ch}
                    className={cn(
                      "inline-block rounded-full px-2.5 py-[2px] text-[10.5px] font-medium whitespace-nowrap",
                      COL_STYLE[kanbanCol.id],
                    )}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            )}
          </td>
        );
      })}

      {/* D-Day */}
      <td className="px-4 py-3 text-right">
        <span
          className={cn(
            "text-[12.5px] font-medium whitespace-nowrap",
            getDdayColor(dday),
          )}
        >
          {formatDday(dday)}
        </span>
      </td>
    </tr>
  );
}

export function DotMatrixTable({ projects }: DotMatrixTableProps) {
  return (
    <div className="rounded-2xl border border-border/50 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] overflow-hidden">
      <table className="w-full table-fixed">
        <thead>
          <tr className="border-b border-border/50 bg-muted/30">
            <th className="px-4 py-2.5 text-left text-[11.5px] font-semibold text-muted-foreground w-[180px]">
              강의명
            </th>
            {KANBAN_COLUMNS.map((col) => (
              <th
                key={col.id}
                className="px-3 py-2.5 text-left text-[11.5px] font-semibold text-muted-foreground"
              >
                {COL_HEADER[col.id]}
              </th>
            ))}
            <th className="px-4 py-2.5 text-right text-[11.5px] font-semibold text-muted-foreground w-[72px]">
              D-Day
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
