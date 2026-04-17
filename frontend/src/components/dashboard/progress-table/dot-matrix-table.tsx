"use client";

import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { parseISO, isBefore, startOfDay } from "date-fns";
import type { Project } from "@/lib/types";
import { getDday, formatDday, getDdayColor, cn } from "@/lib/utils";
import { getChapterDetailedStage } from "@/lib/process-helpers";

interface DotMatrixTableProps {
  projects: Project[];
  basePath?: string;
  personParam?: string;
  /** 강조할 담당 단계 컬럼 (예: "촬영", "편집·자막", "검수") */
  highlightedStage?: string;
}

const DETAIL_COLUMNS = [
  "기획",
  "교안",
  "촬영",
  "편집·자막",
  "검수",
  "승인",
  "완료",
] as const;
type DetailColumn = (typeof DETAIL_COLUMNS)[number];

const STAGE_ORDER: Record<DetailColumn, number> = {
  기획: 0,
  교안: 1,
  촬영: 2,
  "편집·자막": 3,
  검수: 4,
  승인: 5,
  완료: 6,
};

const DOT_COLOR = "#8AAE50";
const PROGRESS_COLOR = "#8AAE50";

const OVERDUE_COLOR = "#F9919E";

/** 해당 챕터의 현재 진행 중 태스크가 마감 초과인지 확인 */
function isChapterOverdue(project: Project, chapter: number): boolean {
  const today = startOfDay(new Date());
  const tasks = project.tasks.filter(
    (t) => t.chapter === chapter && t.status !== "완료",
  );
  return tasks.some((t) => t.endDate && isBefore(parseISO(t.endDate), today));
}

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
  basePath,
  personParam,
  highlightedStage,
}: {
  project: Project;
  basePath?: string;
  personParam?: string;
  highlightedStage?: string;
}) {
  const dday = getDday(project.rolloutDate);
  const chapters = Array.from(
    { length: project.chapterCount },
    (_, i) => i + 1,
  );

  const isPlanning = project.status === "기획";

  // 각 챕터의 단계 계산
  const chapterStages = chapters.map((ch) => ({
    ch,
    stage: getChapterDetailedStage(project, ch) as DetailColumn,
  }));

  // 5장 단위 그룹화: 같은 단계면 묶음
  const CHUNK = 5;
  type DotItem =
    | { type: "single"; ch: number; stage: DetailColumn }
    | { type: "group"; from: number; to: number; stage: DetailColumn };
  const dotItems: DotItem[] = [];

  if (!isPlanning) {
    for (let i = 0; i < chapterStages.length; i += CHUNK) {
      const chunk = chapterStages.slice(i, i + CHUNK);
      const allSameStage =
        chunk.length >= 5 && chunk.every((c) => c.stage === chunk[0].stage);
      if (allSameStage) {
        dotItems.push({
          type: "group",
          from: chunk[0].ch,
          to: chunk[chunk.length - 1].ch,
          stage: chunk[0].stage,
        });
      } else {
        for (const c of chunk) {
          dotItems.push({ type: "single", ch: c.ch, stage: c.stage });
        }
      }
    }
  }

  // 단계별로 도트 아이템 그룹화
  const itemsByStage: Record<DetailColumn, DotItem[]> = {
    기획: [],
    교안: [],
    촬영: [],
    "편집·자막": [],
    검수: [],
    승인: [],
    완료: [],
  };
  for (const item of dotItems) {
    itemsByStage[item.stage].push(item);
  }

  const totalSteps = isPlanning ? 1 : chapters.length * DETAIL_COLUMNS.length;
  const doneSteps = isPlanning
    ? 0
    : chapters.reduce((sum, ch) => {
        const stage = getChapterDetailedStage(project, ch) as DetailColumn;
        return sum + STAGE_ORDER[stage];
      }, 0);
  const progressPct =
    totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  const router = useRouter();
  const handleClick = () => {
    if (!basePath) return;
    const params = personParam
      ? `?person=${encodeURIComponent(personParam)}`
      : "";
    router.push(`${basePath}/${project.id}${params}`);
  };

  return (
    <tr
      className={cn(
        "border-b border-border/40 last:border-b-0 hover:bg-accent/20 transition-colors",
        basePath && "cursor-pointer",
      )}
      onClick={handleClick}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <CircleProgress percent={progressPct} color={PROGRESS_COLOR} />
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
          {/* 담당 단계 강조 배경 */}
          {highlightedStage &&
            (() => {
              const idx = DETAIL_COLUMNS.indexOf(
                highlightedStage as DetailColumn,
              );
              if (idx < 0) return null;
              const leftPct = (idx / DETAIL_COLUMNS.length) * 100;
              const widthPct = 100 / DETAIL_COLUMNS.length;
              return (
                <div
                  className="absolute top-0 bottom-0 rounded-md bg-[#EDF2DC]/60"
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                />
              );
            })()}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#E5E7EB] rounded-full" />
          {Array.from({ length: DETAIL_COLUMNS.length + 1 }, (_, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 w-[3px] h-[3px] rounded-full bg-[#D1D5DB]"
              style={{ left: `${(i / DETAIL_COLUMNS.length) * 100}%` }}
            />
          ))}
          {/* 기획 프로젝트: 기획 열에 단일 노드 */}
          {isPlanning && (
            <div
              className="absolute flex items-center -translate-x-1/2"
              style={{ left: `${(0.5 / DETAIL_COLUMNS.length) * 100}%` }}
            >
              <span
                className="inline-flex items-center justify-center rounded-full text-[8px] font-bold text-white shadow-sm"
                style={{ width: 22, height: 22, backgroundColor: DOT_COLOR }}
              >
                기획
              </span>
            </div>
          )}
          {/* 일반 프로젝트: 장별 도트 */}
          {!isPlanning &&
            DETAIL_COLUMNS.map((col) => {
              const items = itemsByStage[col];
              if (items.length === 0) return null;
              const order = STAGE_ORDER[col];
              const centerPct = ((order + 0.5) / DETAIL_COLUMNS.length) * 100;

              return (
                <div
                  key={col}
                  className="absolute flex items-center gap-[3px] -translate-x-1/2"
                  style={{ left: `${centerPct}%` }}
                >
                  {items.map((item) => {
                    if (item.type === "group") {
                      const groupSize = 28;
                      const hasOverdue = chapters
                        .filter((ch) => ch >= item.from && ch <= item.to)
                        .some((ch) => isChapterOverdue(project, ch));
                      return (
                        <span
                          key={`g-${item.from}`}
                          className="inline-flex items-center justify-center rounded-full text-[7px] font-bold text-white shadow-sm leading-none"
                          style={{
                            width: groupSize,
                            height: groupSize,
                            backgroundColor: hasOverdue
                              ? OVERDUE_COLOR
                              : DOT_COLOR,
                          }}
                        >
                          {item.from}~{item.to}
                        </span>
                      );
                    }
                    const overdue = isChapterOverdue(project, item.ch);
                    return (
                      <span
                        key={item.ch}
                        className="inline-flex items-center justify-center rounded-full text-[9px] font-extrabold text-white shadow-sm"
                        style={{
                          width: 20,
                          height: 20,
                          backgroundColor: overdue ? OVERDUE_COLOR : DOT_COLOR,
                        }}
                      >
                        {item.ch}
                      </span>
                    );
                  })}
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

export function DotMatrixTable({
  projects,
  basePath,
  personParam,
  highlightedStage,
}: DotMatrixTableProps) {
  return (
    <div>
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
              {DETAIL_COLUMNS.map((col) => {
                const isHighlighted = col === highlightedStage;
                return (
                  <th
                    key={col}
                    className={cn(
                      "px-1 py-2.5 text-center text-[11px] font-semibold",
                      isHighlighted
                        ? "text-[#6E8A3A] bg-[#EDF2DC]"
                        : "text-[#9CA3AF]",
                    )}
                  >
                    {col}
                  </th>
                );
              })}
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-[#9CA3AF]">
                D-Day
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                basePath={basePath}
                personParam={personParam}
                highlightedStage={highlightedStage}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
