"use client";

import type { Project } from "@/lib/types";
import { getDday, cn } from "@/lib/utils";
import { DDAY_GROUPS } from "@/lib/constants";
import { ProjectCard } from "./project-card";

interface SectionViewProps {
  projects: Project[];
}

export function SectionView({ projects }: SectionViewProps) {
  const sections = DDAY_GROUPS.map((group) => ({
    ...group,
    projects: projects
      .filter((p) => {
        const d = getDday(p.rolloutDate);
        return d >= group.min && d <= group.max;
      })
      .sort((a, b) => getDday(a.rolloutDate) - getDday(b.rolloutDate)),
  })).filter((s) => s.projects.length > 0);

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.label}>
          <div
            className={cn(
              "mb-3 flex items-center gap-2 border-l-2 pl-3",
              section.max < 0
                ? "border-red-400"
                : section.max <= 3
                  ? "border-amber-400"
                  : "border-neutral-200",
            )}
          >
            <h3 className="text-sm font-medium text-foreground">
              {section.label}
            </h3>
            <span className="text-xs text-muted-foreground">
              {section.projects.length}건
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
