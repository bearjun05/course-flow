"use client";

import Link from "next/link";
import type { Project } from "@/lib/types";
import { KANBAN_COLUMNS } from "@/lib/constants";
import { getDday, formatDday, getDdayColor, cn } from "@/lib/utils";
import { getChapterKanbanColumn } from "@/lib/process-helpers";

interface DotMatrixTableProps {
  projects: Project[];
}

export function DotMatrixTable({ projects }: DotMatrixTableProps) {
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
        {projects.map((project) => {
          const dday = getDday(project.rolloutDate);
          const isOverdue = dday < 0;
          const chapters = Array.from(
            { length: project.chapterCount },
            (_, i) => i + 1,
          );

          return (
            <tbody
              key={project.id}
              className={cn(
                "border-b border-border",
                isOverdue && "bg-[#FCF2F4]",
              )}
            >
              {/* 프로젝트 헤더 행 */}
              <tr className="bg-muted/15">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-[13px] font-medium text-foreground hover:underline"
                  >
                    {project.title}
                  </Link>
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
              {chapters.map((ch) => {
                const col = getChapterKanbanColumn(project, ch);
                return (
                  <tr key={ch} className="transition-colors hover:bg-muted/10">
                    <td className="pl-8 pr-4 py-1.5 text-[12px] text-muted-foreground">
                      {ch}장
                    </td>
                    {KANBAN_COLUMNS.map((kanbanCol) => (
                      <td
                        key={kanbanCol.id}
                        className="px-4 py-1.5 text-center"
                      >
                        {kanbanCol.id === col && (
                          <span className="inline-block h-3 w-3 rounded-full bg-[#A8BE60]" />
                        )}
                      </td>
                    ))}
                    <td />
                  </tr>
                );
              })}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
