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

const STAGE_ORDER: Record<DetailColumn, number> = {
  교안: 0,
  촬영: 1,
  편집: 2,
  자막: 3,
  검수: 4,
  승인: 5,
};

const CHAPTER_COLORS = [
  "#E4A0A0",
  "#E4B89C",
  "#E4CC9C",
  "#E0D49C",
  "#C8D89C",
  "#9CD4B0",
  "#9CCCC8",
  "#9CB8D8",
  "#B0A8D8",
  "#D0A8C8",
  "#C8BCB0",
];

function getChapterColor(ch: number): string {
  return CHAPTER_COLORS[(ch - 1) % CHAPTER_COLORS.length];
}

/** SVG 원형 진척 바 */
function CircleProgress({ percent }: { percent: number }) {
  const r = 9;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className="shrink-0">
      <circle
        cx="12"
        cy="12"
        r={r}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth="2.5"
      />
      <circle
        cx="12"
        cy="12"
        r={r}
        fill="none"
        stroke="#94A3B8"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 12 12)"
      />
      <text
        x="12"
        y="12.5"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-muted-foreground"
        fontSize="7"
        fontWeight="600"
      >
        {percent}
      </text>
    </svg>
  );
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

  // 진척률
  const totalSteps = chapters.length * DETAIL_COLUMNS.length;
  const doneSteps = chapters.reduce((sum, ch) => {
    const stage = getChapterDetailedStage(project, ch) as DetailColumn;
    return sum + STAGE_ORDER[stage];
  }, 0);
  const progressPct =
    totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  return (
    <tr className="border-b border-border/40 last:border-b-0 hover:bg-accent/20 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <CircleProgress percent={progressPct} />
          <span className="text-[13px] font-medium text-foreground leading-snug">
            {project.title}
          </span>
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
                    className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full text-[10px] font-extrabold"
                    style={{
                      backgroundColor: `${getChapterColor(ch)}90`,
                      color: getChapterColor(ch),
                    }}
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
          <col className="w-[180px]" />
          {DETAIL_COLUMNS.map((col) => (
            <col
              key={col}
              style={{ width: `${58 / DETAIL_COLUMNS.length}%` }}
            />
          ))}
          <col className="w-[64px]" />
        </colgroup>
        <thead>
          <tr className="border-b border-[#E5E7EB] bg-[#F8F9FA]">
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-[#9CA3AF]">
              강의명
            </th>
            {DETAIL_COLUMNS.map((col) => (
              <th
                key={col}
                className="px-1 py-2.5 text-center text-[11px] font-semibold text-[#9CA3AF]"
              >
                {col}
              </th>
            ))}
            <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-[#9CA3AF]">
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
