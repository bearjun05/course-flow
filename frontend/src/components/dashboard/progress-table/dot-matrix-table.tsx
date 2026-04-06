"use client";

import { useState } from "react";
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

// 공정별 색상 (쿨톤 파스텔)
const STAGE_COLORS: Record<DetailColumn, string> = {
  교안: "#F9A8A8",
  촬영: "#F9C89C",
  편집: "#A8D4A0",
  자막: "#8CCAC8",
  검수: "#94B4E0",
  승인: "#B0A0D8",
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

type ViewType = "A" | "B" | "C";

/* ─── 공통 유틸 ─── */

function useProjectData(project: Project) {
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

  const totalSteps = chapters.length * DETAIL_COLUMNS.length;
  const doneSteps = chapters.reduce((sum, ch) => {
    const stage = getChapterDetailedStage(project, ch) as DetailColumn;
    return sum + STAGE_ORDER[stage];
  }, 0);
  const progressPct =
    totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  return { chapters, chaptersByDetail, progressPct };
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

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   A안: 스택 바 — 공정별 비율을 가로 바로 표현
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function ViewA({ projects }: { projects: Project[] }) {
  return (
    <div className="space-y-[2px]">
      {projects.map((project) => {
        const { chaptersByDetail, progressPct, chapters } =
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useProjectData(project);
        const dday = getDday(project.rolloutDate);
        const total = chapters.length;

        return (
          <div
            key={project.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-accent/20 transition-colors rounded-lg"
          >
            {/* 좌: 강의명 + 진척 */}
            <div className="w-[160px] shrink-0 flex items-center gap-2">
              <CircleProgress percent={progressPct} />
              <span className="text-[13px] font-medium text-foreground truncate">
                {project.title}
              </span>
            </div>

            {/* 중: 스택 바 */}
            <div className="flex-1 flex items-center gap-[2px] h-[24px] rounded-full overflow-hidden bg-[#F1F2F4]">
              {DETAIL_COLUMNS.map((col) => {
                const count = chaptersByDetail[col].length;
                if (count === 0) return null;
                const widthPct = (count / total) * 100;
                return (
                  <div
                    key={col}
                    className="h-full flex items-center justify-center relative group"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: STAGE_COLORS[col],
                    }}
                  >
                    <span className="text-[10px] font-bold text-white/90 drop-shadow-sm">
                      {col} {count}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 우: D-Day */}
            <span
              className={cn(
                "text-[12px] font-medium whitespace-nowrap w-[56px] text-right shrink-0",
                getDdayColor(dday),
              )}
            >
              {formatDday(dday)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   B안: 파이프라인 트랙 — 장이 트랙 위에 점으로 배치
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function ViewB({ projects }: { projects: Project[] }) {
  return (
    <div className="space-y-[2px]">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 pb-1">
        <div className="w-[160px] shrink-0" />
        <div className="flex-1 flex">
          {DETAIL_COLUMNS.map((col) => (
            <span
              key={col}
              className="flex-1 text-center text-[10px] font-semibold text-[#9CA3AF]"
            >
              {col}
            </span>
          ))}
        </div>
        <div className="w-[56px] shrink-0" />
      </div>

      {projects.map((project) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { chapters, progressPct } = useProjectData(project);
        const dday = getDday(project.rolloutDate);

        return (
          <div
            key={project.id}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/20 transition-colors rounded-lg"
          >
            {/* 좌: 강의명 */}
            <div className="w-[160px] shrink-0 flex items-center gap-2">
              <CircleProgress percent={progressPct} />
              <span className="text-[13px] font-medium text-foreground truncate">
                {project.title}
              </span>
            </div>

            {/* 중: 트랙 */}
            <div className="flex-1 relative">
              {/* 트랙 라인 */}
              <div className="h-[2px] bg-[#E5E7EB] rounded-full w-full absolute top-1/2 -translate-y-1/2" />
              {/* 구간 구분 점 */}
              <div className="flex justify-between absolute w-full top-1/2 -translate-y-1/2">
                {Array.from({ length: 7 }, (_, i) => (
                  <div
                    key={i}
                    className="w-[4px] h-[4px] rounded-full bg-[#D1D5DB]"
                  />
                ))}
              </div>
              {/* 장 도트 */}
              <div className="relative h-[28px] flex items-center">
                {chapters.map((ch) => {
                  const stage = getChapterDetailedStage(
                    project,
                    ch,
                  ) as DetailColumn;
                  const order = STAGE_ORDER[stage];
                  // 구간 중앙에 배치
                  const leftPct = ((order + 0.5) / DETAIL_COLUMNS.length) * 100;
                  return (
                    <span
                      key={ch}
                      className="absolute inline-flex items-center justify-center w-[20px] h-[20px] rounded-full text-[9px] font-extrabold text-white shadow-sm -translate-x-1/2"
                      style={{
                        left: `${leftPct}%`,
                        backgroundColor: getChapterColor(ch),
                      }}
                    >
                      {ch}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* 우: D-Day */}
            <span
              className={cn(
                "text-[12px] font-medium whitespace-nowrap w-[56px] text-right shrink-0",
                getDdayColor(dday),
              )}
            >
              {formatDday(dday)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   C안: 표 (원색 도트) — 기존 테이블 + 원색 동그라미
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function ViewC({ projects }: { projects: Project[] }) {
  return (
    <table className="w-full table-fixed">
      <colgroup>
        <col className="w-[180px]" />
        {DETAIL_COLUMNS.map((col) => (
          <col key={col} style={{ width: `${58 / DETAIL_COLUMNS.length}%` }} />
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
        {projects.map((project) => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const { chaptersByDetail, progressPct } = useProjectData(project);
          const dday = getDday(project.rolloutDate);
          return (
            <tr
              key={project.id}
              className="border-b border-border/40 last:border-b-0 hover:bg-accent/20 transition-colors"
            >
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
                            className="inline-flex items-center justify-center w-[20px] h-[20px] rounded-full text-[9.5px] font-extrabold text-white"
                            style={{
                              backgroundColor: getChapterColor(ch),
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
        })}
      </tbody>
    </table>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const VIEW_LABELS: Record<ViewType, string> = {
  A: "A: 스택 바",
  B: "B: 파이프라인",
  C: "C: 도트 표",
};

export function DotMatrixTable({ projects }: DotMatrixTableProps) {
  const [view, setView] = useState<ViewType>("A");

  return (
    <div>
      {/* 디버그 뷰 토글 */}
      <div className="flex items-center gap-2 mb-3">
        {(["A", "B", "C"] as ViewType[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors border",
              view === v
                ? "bg-foreground text-background border-foreground"
                : "bg-white text-muted-foreground border-border hover:bg-accent/50",
            )}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/50 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] overflow-hidden">
        {view === "A" && <ViewA projects={projects} />}
        {view === "B" && <ViewB projects={projects} />}
        {view === "C" && <ViewC projects={projects} />}
      </div>
    </div>
  );
}
