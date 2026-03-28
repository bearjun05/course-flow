"use client";

import Link from "next/link";
import type { Project, ProjectStatus, TrafficLight } from "@/lib/types";
import { getDday, formatDday, getDdayColor, cn } from "@/lib/utils";

interface DeadlineListViewProps {
  projects: Project[];
  onStatusChange: (projectId: string, status: ProjectStatus) => void;
  onTrafficLightChange: (projectId: string, light: TrafficLight) => void;
}

const STATUS_COLORS: Record<string, string> = {
  기획: "bg-neutral-100 text-neutral-500",
  교안작성: "bg-amber-50 text-amber-600",
  리허설: "bg-yellow-50 text-yellow-700",
  촬영: "bg-orange-50 text-orange-600",
  편집_검수: "bg-blue-50 text-blue-600",
  롤아웃: "bg-violet-50 text-violet-600",
  완료: "bg-emerald-50 text-emerald-600",
  중단: "bg-neutral-100 text-neutral-400",
};

const STATUS_LABELS: Record<string, string> = {
  기획: "기획",
  교안작성: "교안작성",
  리허설: "리허설",
  촬영: "촬영",
  편집_검수: "편집·검수",
  롤아웃: "롤아웃",
  완료: "완료",
  중단: "중단",
};

const UNIT_COLORS: Record<string, string> = {
  KDT: "bg-amber-100 text-amber-700",
  KDC: "bg-yellow-100 text-yellow-700",
  신사업: "bg-orange-100 text-orange-700",
};

export function DeadlineListView({ projects }: DeadlineListViewProps) {
  const sorted = [...projects].sort(
    (a, b) => getDday(a.rolloutDate) - getDday(b.rolloutDate),
  );

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* 헤더 */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-2.5 bg-muted/40 text-[11px] font-medium text-muted-foreground border-b border-border">
        <span>강의명</span>
        <span>사업부 · 트랙</span>
        <span>상태</span>
        <span>튜터</span>
        <span>마감일</span>
        <span>D-Day</span>
      </div>

      {/* 행 목록 */}
      <div className="divide-y divide-border">
        {sorted.map((project) => {
          const dday = getDday(project.rolloutDate);
          const isOverdue = dday < 0;

          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className={cn(
                "grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-3 items-center hover:bg-muted/30 transition-colors text-[12px]",
                isOverdue && "bg-[#FCF2F4] hover:bg-[#FCF2F4]/80",
              )}
            >
              {/* 강의명 */}
              <span className="font-medium text-foreground truncate">
                {project.title}
              </span>

              {/* 사업부 · 트랙 */}
              <span>
                <span
                  className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                    UNIT_COLORS[project.businessUnit] ??
                      "bg-neutral-100 text-neutral-500",
                  )}
                >
                  {project.businessUnit}
                  {project.trackName && (
                    <>
                      <span className="mx-1 opacity-50">·</span>
                      {project.trackName}
                    </>
                  )}
                </span>
              </span>

              {/* 상태 */}
              <span>
                <span
                  className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                    STATUS_COLORS[project.status] ??
                      "bg-neutral-100 text-neutral-500",
                  )}
                >
                  {STATUS_LABELS[project.status] ?? project.status}
                </span>
              </span>

              {/* 튜터 */}
              <span className="text-muted-foreground truncate">
                {project.tutor ?? "—"}
              </span>

              {/* 마감일 */}
              <span className="text-muted-foreground">
                {project.rolloutDate.slice(5).replace("-", "/")}
              </span>

              {/* D-Day */}
              <span className={cn("font-medium", getDdayColor(dday))}>
                {formatDday(dday)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
