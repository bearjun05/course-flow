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

// 공정 순서 (승인=마지막)
const STAGE_ORDER: Record<DetailColumn, number> = {
  교안: 0,
  촬영: 1,
  편집: 2,
  자막: 3,
  검수: 4,
  승인: 5,
};

// 점 색상: 부드러운 웜 세이지 그린
const DOT_ACTIVE = "bg-[#B5BFA0] text-white";
// 완료된(지나온) 공정 셀 배경
const CELL_DONE = "bg-[#F7F7F3]";

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

  // 프로젝트에서 가장 앞서 있는 공정 단계
  let maxStageOrder = 0;

  for (const ch of chapters) {
    const stage = getChapterDetailedStage(project, ch) as DetailColumn;
    if (chaptersByDetail[stage]) {
      chaptersByDetail[stage].push(ch);
    }
    if (STAGE_ORDER[stage] > maxStageOrder) {
      maxStageOrder = STAGE_ORDER[stage];
    }
  }

  // 진척률: 각 장이 6단계 중 몇 번째인지로 계산
  const totalSteps = chapters.length * DETAIL_COLUMNS.length;
  const doneSteps = chapters.reduce((sum, ch) => {
    const stage = getChapterDetailedStage(project, ch) as DetailColumn;
    return sum + STAGE_ORDER[stage];
  }, 0);
  const progressPct =
    totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  return (
    <tr className="border-b border-border/40 last:border-b-0 group">
      {/* 강의명 + 진척 바 */}
      <td className="px-4 py-3">
        <div className="text-[13px] font-medium text-foreground leading-snug">
          {project.title}
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-[3px] rounded-full bg-[#EEEDE8] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#B5BFA0] transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground/60 tabular-nums">
            {progressPct}%
          </span>
        </div>
      </td>

      {/* 공정별 도트 */}
      {DETAIL_COLUMNS.map((col) => {
        const items = chaptersByDetail[col];
        const colOrder = STAGE_ORDER[col];
        // 이미 지나온 공정이면 연한 배경
        const isDone = items.length === 0 && colOrder < maxStageOrder;
        return (
          <td key={col} className={cn("px-1 py-3", isDone && CELL_DONE)}>
            {items.length > 0 && (
              <div className="flex flex-wrap gap-[5px] justify-center">
                {items.map((ch) => (
                  <span
                    key={ch}
                    className={cn(
                      "inline-flex items-center justify-center w-[22px] h-[22px] rounded-full text-[10px] font-semibold",
                      DOT_ACTIVE,
                    )}
                  >
                    {ch}
                  </span>
                ))}
              </div>
            )}
            {isDone && (
              <div className="flex justify-center">
                <span className="text-[#C8C6BE] text-[11px]">✓</span>
              </div>
            )}
          </td>
        );
      })}

      {/* D-Day */}
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
          <tr className="border-b border-border/50 bg-[#FAFAF7]">
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
