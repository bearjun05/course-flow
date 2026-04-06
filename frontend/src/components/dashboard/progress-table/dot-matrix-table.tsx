"use client";

import type { Project } from "@/lib/types";
import { getDday, formatDday, getDdayColor, cn } from "@/lib/utils";
import { getChapterDetailedStage } from "@/lib/process-helpers";

interface DotMatrixTableProps {
  projects: Project[];
}

const DETAIL_COLUMNS = [
  "교안",
  "촬영",
  "편집",
  "자막",
  "검수",
  "승인",
] as const;
type DetailColumn = (typeof DETAIL_COLUMNS)[number];

// 장별 무지개 색상 (상세 페이지와 동일)
const CHAPTER_COLORS = [
  "#E4A0A0", // 1장 분홍
  "#E4B89C", // 2장 살구
  "#E4CC9C", // 3장 주황
  "#E0D49C", // 4장 노랑
  "#C8D89C", // 5장 연두
  "#9CD4B0", // 6장 초록
  "#9CCCC8", // 7장 민트
  "#9CB8D8", // 8장 하늘
  "#B0A8D8", // 9장 보라
  "#D0A8C8", // 10장 자주
  "#C8BCB0", // 11장 베이지
];

function getChapterColor(ch: number): string {
  return CHAPTER_COLORS[(ch - 1) % CHAPTER_COLORS.length];
}

function ProjectRow({ project }: { project: Project }) {
  const dday = getDday(project.rolloutDate);
  const chapters = Array.from(
    { length: project.chapterCount },
    (_, i) => i + 1,
  );

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
    <tr className="border-b border-border/40 last:border-b-0 hover:bg-accent/20 transition-colors">
      <td className="px-4 py-3">
        <div className="text-[13px] font-medium text-foreground leading-snug">
          {project.title}
        </div>
      </td>

      {DETAIL_COLUMNS.map((col) => {
        const items = chaptersByDetail[col];
        return (
          <td key={col} className="px-1 py-3">
            {items.length > 0 && (
              <div className="flex flex-wrap gap-[4px] justify-center">
                {items.map((ch) => (
                  <span
                    key={ch}
                    className="inline-flex items-center justify-center w-[20px] h-[20px] rounded-full text-[9.5px] font-bold text-white"
                    style={{ backgroundColor: getChapterColor(ch) }}
                  >
                    {ch}
                  </span>
                ))}
              </div>
            )}
          </td>
        );
      })}

      <td className="px-3 py-3 text-right">
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
}

export function DotMatrixTable({ projects }: DotMatrixTableProps) {
  return (
    <div className="rounded-2xl border border-border/50 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] overflow-hidden">
      <table className="w-full table-fixed">
        <colgroup>
          <col className="w-[140px]" />
          {DETAIL_COLUMNS.map((col) => (
            <col
              key={col}
              style={{ width: `${62 / DETAIL_COLUMNS.length}%` }}
            />
          ))}
          <col className="w-[64px]" />
        </colgroup>
        <thead>
          <tr className="border-b border-border/50 bg-[#FAFAF8]">
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground/70">
              강의명
            </th>
            {DETAIL_COLUMNS.map((col) => (
              <th
                key={col}
                className="px-1 py-2.5 text-center text-[11px] font-semibold text-muted-foreground/70"
              >
                {col}
              </th>
            ))}
            <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground/70">
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
