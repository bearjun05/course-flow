"use client";

import { useState } from "react";
import Link from "next/link";
import { Video } from "lucide-react";
import type { Project, ProjectStatus, TrafficLight } from "@/lib/types";
import {
  getDday,
  formatDday,
  getDdayColor,
  getAutoTrafficLight,
  cn,
} from "@/lib/utils";
import { DDAY_GROUPS } from "@/lib/constants";
import { useBadgeTheme } from "@/lib/badge-theme";

interface DeadlineListViewProps {
  projects: Project[];
  onStatusChange: (projectId: string, status: ProjectStatus) => void;
  onTrafficLightChange: (projectId: string, light: TrafficLight) => void;
  flat?: boolean; // true = 섹션 없이 DB 스타일 전체 목록
}

const TRAFFIC_LIGHT_COLORS: Record<string, string> = {
  green: "bg-[#6ECC9A]",
  yellow: "bg-[#F5C842]",
  red: "bg-[#F47A8A]",
};

function ProjectRow({
  project,
  simple = false,
}: {
  project: Project;
  simple?: boolean;
}) {
  const { theme } = useBadgeTheme();
  const dday = getDday(project.rolloutDate);
  const isOverdue = dday < 0 && project.status !== "완료";
  const isCompleted = project.status === "완료";
  const light = getAutoTrafficLight(project);

  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        "flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors",
        !simple && isOverdue && "bg-[#FCF2F4] hover:bg-[#FCF2F4]/80",
        isCompleted && !simple && "opacity-60",
      )}
    >
      {/* 신호등 (전체 탭에서는 숨김) */}
      {!simple && (
        <span
          className={cn(
            "inline-block w-2 h-2 rounded-full shrink-0",
            TRAFFIC_LIGHT_COLORS[light] ?? "bg-neutral-300",
          )}
        />
      )}

      {/* 아이콘 실루엣 */}
      <Video className="w-3.5 h-3.5 text-neutral-300 shrink-0" />

      {/* 제목 + 버전 */}
      <div className="flex items-baseline gap-1.5 flex-1 min-w-0">
        <span className="text-[13px] font-medium text-foreground truncate">
          {project.title}
        </span>
        {project.version && (
          <span
            className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded-md shrink-0",
              theme.versionBadge,
            )}
          >
            {project.version}
          </span>
        )}
      </div>

      {/* 배지 그룹 */}
      <div className="flex items-center gap-1 shrink-0">
        {/* 사업부 */}
        <span
          className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
            theme.listUnitBadge,
          )}
        >
          {[project.businessUnit, project.trackName]
            .filter(Boolean)
            .join(" · ")}
        </span>
        {/* 상태 */}
        <span
          className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
            theme.typeBadge,
          )}
        >
          {project.status}
        </span>
      </div>

      {/* 날짜 */}
      {isCompleted ? (
        <span className="text-[11px] text-muted-foreground shrink-0 w-32 text-right">
          {project.rolloutDate.slice(5).replace("-", "/")} 출시
        </span>
      ) : (
        <span
          className={cn(
            "text-[12px] font-medium shrink-0 w-32 text-right",
            getDdayColor(dday),
          )}
        >
          {formatDday(dday)}
          <span className="ml-1.5 text-[11px] text-muted-foreground font-normal">
            ({project.rolloutDate.slice(5).replace("-", "/")})
          </span>
        </span>
      )}
    </Link>
  );
}

export function DeadlineListView({
  projects,
  flat = false,
}: DeadlineListViewProps) {
  const [sortBy, setSortBy] = useState<"deadline" | "name">("deadline");

  if (flat) {
    const sorted = [...projects].sort((a, b) =>
      sortBy === "name"
        ? a.title.localeCompare(b.title, "ko")
        : getDday(a.rolloutDate) - getDday(b.rolloutDate),
    );
    return (
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="text-xs font-semibold text-muted-foreground">
            전체
          </span>
          <span className="text-[11px] text-muted-foreground/50">
            {sorted.length}
          </span>
          <div className="flex-1 h-px bg-border" />
          <div className="flex items-center rounded-md border border-border p-0.5 gap-0.5">
            <button
              onClick={() => setSortBy("deadline")}
              className={cn(
                "rounded px-2 py-0.5 text-[11px] transition-colors",
                sortBy === "deadline"
                  ? "bg-background shadow-sm text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              마감일
            </button>
            <button
              onClick={() => setSortBy("name")}
              className={cn(
                "rounded px-2 py-0.5 text-[11px] transition-colors",
                sortBy === "name"
                  ? "bg-background shadow-sm text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              이름
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {sorted.map((project) => (
            <ProjectRow key={project.id} project={project} simple />
          ))}
        </div>
      </div>
    );
  }

  // 섹션별 보기 (진행 중 전용)
  const sections = DDAY_GROUPS.map((group) => ({
    ...group,
    projects: projects
      .filter((p) => {
        const d = getDday(p.rolloutDate);
        return d >= group.min && d <= group.max;
      })
      .sort((a, b) => getDday(a.rolloutDate) - getDday(b.rolloutDate)),
  })).filter((g) => g.projects.length > 0);

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.label}>
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-xs font-semibold text-muted-foreground">
              {section.label}
            </span>
            <span className="text-[11px] text-muted-foreground/50">
              {section.projects.length}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {section.projects.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
