"use client";

import { useState } from "react";
import Link from "next/link";
import { Video } from "lucide-react";
import type { Project } from "@/lib/types";
import { getDday, formatDday, getDdayColor, cn } from "@/lib/utils";
import { DDAY_GROUPS } from "@/lib/constants";
import { ProjectCard } from "./project-card";
import { useBadgeTheme } from "@/lib/badge-theme";

interface DeadlineListViewProps {
  projects: Project[];
  flat?: boolean;
}

const STATUS_NEUTRAL = "bg-[#F0F0F0] text-[#6B6B6B]";

function ProjectRow({ project }: { project: Project }) {
  const { theme } = useBadgeTheme();
  const dday = getDday(project.rolloutDate);
  const isOverdue = dday < 0 && project.status !== "완료";
  const isCompleted = project.status === "완료";

  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        "flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors",
        isOverdue && "bg-[#FCF2F4] hover:bg-[#FCF2F4]/80",
      )}
    >
      <Video className="w-3.5 h-3.5 text-neutral-300 shrink-0" />

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

      <div className="flex items-center gap-1 shrink-0">
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
        <span
          className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
            STATUS_NEUTRAL,
          )}
        >
          {project.status}
        </span>
      </div>

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

  // 전체 탭: 리스트 뷰
  if (flat) {
    const sorted = [...projects].sort((a, b) =>
      sortBy === "name"
        ? a.title.localeCompare(b.title, "ko")
        : getDday(b.rolloutDate) - getDday(a.rolloutDate),
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
            <ProjectRow key={project.id} project={project} />
          ))}
        </div>
      </div>
    );
  }

  // 진행 중 탭: 가로 칼럼 레이아웃
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
    <div className="flex gap-4 overflow-x-auto pb-2">
      {sections.map((section) => (
        <div key={section.label} className="flex min-w-[280px] flex-1 flex-col">
          <div className="mb-3 flex items-center gap-2 px-1">
            <span className="text-xs font-semibold text-muted-foreground">
              {section.label}
            </span>
            <span className="text-[11px] text-muted-foreground/50">
              {section.projects.length}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {section.projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
