"use client";

import type { Project } from "@/lib/types";
import { getDday } from "@/lib/utils";
import { DDAY_GROUPS } from "@/lib/constants";
import { ProjectCard } from "./project-card";

interface ColumnViewProps {
  projects: Project[];
}

export function ColumnView({ projects }: ColumnViewProps) {
  const groups = DDAY_GROUPS.map((group) => ({
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
      {groups.map((group) => (
        <div key={group.label} className="flex min-w-[280px] flex-1 flex-col">
          <div className="mb-3 flex items-center gap-2 px-1">
            <h3 className="text-xs font-medium text-muted-foreground">
              {group.label}
            </h3>
            <span className="text-[11px] text-muted-foreground/60">
              {group.projects.length}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {group.projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
