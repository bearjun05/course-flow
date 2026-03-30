"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";
import { getDday, cn } from "@/lib/utils";
import { DDAY_GROUPS } from "@/lib/constants";
import { ProjectCard } from "./project-card";

interface DeadlineListViewProps {
  projects: Project[];
  flat?: boolean;
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
        : getDday(b.rolloutDate) - getDday(a.rolloutDate),
    );
    return (
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
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
        <div className="flex flex-col gap-3">
          {sorted.map((project) => (
            <ProjectCard key={project.id} project={project} />
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
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="text-xs font-semibold text-muted-foreground">
              {section.label}
            </span>
            <span className="text-[11px] text-muted-foreground/50">
              {section.projects.length}
            </span>
            <div className="flex-1 h-px bg-border" />
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
