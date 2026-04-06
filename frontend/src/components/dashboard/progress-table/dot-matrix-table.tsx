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
  교안: "bg-[#EDECD8] text-[#6B6840]",
  촬영: "bg-[#E4E5CE] text-[#5F5E38]",
  편집: "bg-[#DCE0C4] text-[#555830]",
  자막: "bg-[#D4DABA] text-[#4C5228]",
  검수: "bg-[#CCD4B0] text-[#444C22]",
  승인: "bg-[#C4CEA6] text-[#3C461C]",
};

/** 연속된 장 번호를 "1~3장", "5장" 형태로 묶기 */
function formatChapterRanges(chapters: number[]): string[] {
  if (chapters.length === 0) return [];
  const sorted = [...chapters].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}장` : `${start}~${end}장`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? `${start}장` : `${start}~${end}장`);
  return ranges;
}

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
        const ranges = formatChapterRanges(chaptersByDetail[col]);
        return (
          <td key={col} className="px-2 py-3">
            {ranges.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {ranges.map((range) => (
                  <span
                    key={range}
                    className={cn(
                      "inline-block rounded-full px-2.5 py-[2px] text-[10.5px] font-medium whitespace-nowrap",
                      COL_STYLE[col],
                    )}
                  >
                    {range}
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
          <col className="w-[130px]" />
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
