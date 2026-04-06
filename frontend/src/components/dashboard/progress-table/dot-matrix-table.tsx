"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
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

type ColorTheme = "blue" | "green";

const THEME_COLORS: Record<
  ColorTheme,
  { stages: Record<DetailColumn, string>; progress: string }
> = {
  blue: {
    stages: {
      교안: "#DEEEFF",
      촬영: "#D0E7FF",
      편집: "#C2E0FF",
      자막: "#B4D9FF",
      검수: "#A6D2FF",
      승인: "#98CBFF",
    },
    progress: "#98CBFF",
  },
  green: {
    stages: {
      교안: "#ECF2C8",
      촬영: "#E4EBBB",
      편집: "#DCE4AE",
      자막: "#D4DDA1",
      검수: "#CCD694",
      승인: "#C4CF87",
    },
    progress: "#C4CF87",
  },
};

/** SVG 원형 진척 바 */
function CircleProgress({
  percent,
  color,
}: {
  percent: number;
  color: string;
}) {
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
        stroke={color}
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

function ProjectRow({
  project,
  theme,
}: {
  project: Project;
  theme: ColorTheme;
}) {
  const dday = getDday(project.rolloutDate);
  const chapters = Array.from(
    { length: project.chapterCount },
    (_, i) => i + 1,
  );
  const colors = THEME_COLORS[theme];

  const chaptersByStage: Record<DetailColumn, number[]> = {
    교안: [],
    촬영: [],
    편집: [],
    자막: [],
    검수: [],
    승인: [],
  };

  for (const ch of chapters) {
    const stage = getChapterDetailedStage(project, ch) as DetailColumn;
    if (chaptersByStage[stage]) {
      chaptersByStage[stage].push(ch);
    }
  }

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
          <CircleProgress percent={progressPct} color={colors.progress} />
          <span className="text-[13px] font-medium text-foreground leading-snug">
            {project.title}
          </span>
          <span className="inline-flex items-center gap-[3px] text-[10px] text-muted-foreground/60 shrink-0">
            <BookOpen className="w-3 h-3" />
            {project.chapterCount}장
          </span>
        </div>
      </td>

      <td colSpan={DETAIL_COLUMNS.length} className="px-2 py-3">
        <div className="relative h-[28px] flex items-center">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#E5E7EB] rounded-full" />
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 w-[3px] h-[3px] rounded-full bg-[#D1D5DB]"
              style={{ left: `${(i / 6) * 100}%` }}
            />
          ))}
          {DETAIL_COLUMNS.map((col) => {
            const items = chaptersByStage[col];
            if (items.length === 0) return null;
            const order = STAGE_ORDER[col];
            const centerPct = ((order + 0.5) / DETAIL_COLUMNS.length) * 100;
            const dotSize = 20;

            return (
              <div
                key={col}
                className="absolute flex items-center gap-[3px] -translate-x-1/2"
                style={{ left: `${centerPct}%` }}
              >
                {items.map((ch) => (
                  <span
                    key={ch}
                    className="inline-flex items-center justify-center rounded-full text-[9px] font-extrabold text-white shadow-sm"
                    style={{
                      width: dotSize,
                      height: dotSize,
                      backgroundColor: colors.stages[col],
                    }}
                  >
                    {ch}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </td>

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
  const [theme, setTheme] = useState<ColorTheme>("blue");

  return (
    <div>
      {/* 디버그 색상 토글 */}
      <div className="flex items-center gap-2 mb-3">
        {(["blue", "green"] as ColorTheme[]).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors border",
              theme === t
                ? "bg-foreground text-background border-foreground"
                : "bg-white text-muted-foreground border-border hover:bg-accent/50",
            )}
          >
            {t === "blue" ? "블루" : "연두"}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/50 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] overflow-hidden">
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: "22%" }} />
            {DETAIL_COLUMNS.map((col) => (
              <col
                key={col}
                style={{ width: `${70 / DETAIL_COLUMNS.length}%` }}
              />
            ))}
            <col style={{ width: "8%" }} />
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
              <ProjectRow key={project.id} project={project} theme={theme} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
