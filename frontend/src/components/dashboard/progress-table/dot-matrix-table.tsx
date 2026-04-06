"use client";

import type { Project } from "@/lib/types";
import { getDday, formatDday, getDdayColor, cn } from "@/lib/utils";
import { getChapterDetailedStage } from "@/lib/process-helpers";

interface DotMatrixTableProps {
  projects: Project[];
}

// 표에 표시할 세부 공정 컬럼
const DETAIL_COLUMNS = [
  "교안",
  "촬영",
  "편집",
  "자막",
  "검수",
  "승인",
] as const;
type DetailColumn = (typeof DETAIL_COLUMNS)[number];

const COL_STYLE: Record<DetailColumn, string> = {
  교안: "bg-[#E8F0E2] text-[#5A7A48]",
  촬영: "bg-[#E0ECDA] text-[#4E7040]",
  편집: "bg-[#D8E8D2] text-[#436838]",
  자막: "bg-[#D0E4CA] text-[#3A5F30]",
  검수: "bg-[#C8E0C2] text-[#325828]",
  승인: "bg-[#C0DCBA] text-[#2A5020]",
};

function ProjectRow({ project }: { project: Project }) {
  const dday = getDday(project.rolloutDate);
  const chapters = Array.from(
    { length: project.chapterCount },
    (_, i) => i + 1,
  );

  // 장별 세부 공정으로 그룹핑
  const chaptersByDetail: Record<DetailColumn, number[]> = {
    교안: [],
    촬영: [],
    편집: [],
    자막: [],
    검수: [],
    승인: [],
  };

  for (const ch of chapters) {
    const stage = getChapterDetailedStage(project, ch) as DetailColumn;
    if (chaptersByDetail[stage]) {
      chaptersByDetail[stage].push(ch);
    }
  }

  return (
    <tr className="border-b border-border/40 last:border-b-0">
      <td className="px-4 py-3 text-[13px] font-medium text-foreground">
        {project.title}
      </td>

      {DETAIL_COLUMNS.map((col) => {
        const items = chaptersByDetail[col];
        return (
          <td key={col} className="px-2 py-3">
            {items.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {items.map((ch) => (
                  <span
                    key={ch}
                    className={cn(
                      "inline-block rounded-full px-2.5 py-[2px] text-[10.5px] font-medium whitespace-nowrap",
                      COL_STYLE[col],
                    )}
                  >
                    {ch}장
                  </span>
                ))}
              </div>
            )}
          </td>
        );
      })}

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
        <colgroup>
          <col className="w-[160px]" />
          {DETAIL_COLUMNS.map((col) => (
            <col
              key={col}
              style={{ width: `${60 / DETAIL_COLUMNS.length}%` }}
            />
          ))}
          <col className="w-[72px]" />
        </colgroup>
        <thead>
          <tr className="border-b border-border/50 bg-muted/30">
            <th className="px-4 py-2.5 text-left text-[11.5px] font-semibold text-muted-foreground">
              강의명
            </th>
            {DETAIL_COLUMNS.map((col) => (
              <th
                key={col}
                className="px-2 py-2.5 text-left text-[11.5px] font-semibold text-muted-foreground"
              >
                {col}
              </th>
            ))}
            <th className="px-4 py-2.5 text-right text-[11.5px] font-semibold text-muted-foreground">
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
