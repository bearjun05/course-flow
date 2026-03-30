"use client";

import Link from "next/link";
import type { Project } from "@/lib/types";
import { KANBAN_COLUMNS } from "@/lib/constants";
import { getDday, formatDday, getDdayColor, cn } from "@/lib/utils";
import { getChaptersGroupedByColumn } from "@/lib/process-helpers";

interface ChapterCellTableProps {
  projects: Project[];
}

export function ChapterCellTable({ projects }: ChapterCellTableProps) {
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
        <tbody className="divide-y divide-border">
          {projects.map((project) => {
            const grouped = getChaptersGroupedByColumn(project);
            const dday = getDday(project.rolloutDate);

            return (
              <tr
                key={project.id}
                className="transition-colors hover:bg-muted/20"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-[13px] font-medium text-foreground hover:underline line-clamp-1"
                  >
                    {project.title}
                  </Link>
                </td>
                {KANBAN_COLUMNS.map((col) => {
                  const chapters = grouped[col.id];
                  return (
                    <td key={col.id} className="px-4 py-3 text-center">
                      {chapters.length > 0 && (
                        <span className="inline-flex flex-wrap justify-center gap-1">
                          {chapters.map((ch) => (
                            <span
                              key={ch}
                              className="inline-block rounded-md bg-[#EDF2DC] px-1.5 py-0.5 text-[11px] font-medium text-[#7A9445]"
                            >
                              {ch}장
                            </span>
                          ))}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right">
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
