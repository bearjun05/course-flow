"use client";

import type { Project, ProjectStatus, TrafficLight } from "@/lib/types";
import { getDday, cn } from "@/lib/utils";
import { DDAY_GROUPS } from "@/lib/constants";
import { ProjectCard } from "./project-card";

interface SectionViewProps {
  projects: Project[];
  onStatusChange: (projectId: string, status: ProjectStatus) => void;
  onTrafficLightChange: (projectId: string, light: TrafficLight) => void;
  onRolloutChange: (projectId: string, date: string) => void;
  onDelete: (projectId: string) => void;
  onDuplicate: (projectId: string) => void;
  onHide: (projectId: string) => void;
}

export function SectionView({
  projects,
  onStatusChange,
  onTrafficLightChange,
  onRolloutChange,
  onDelete,
  onDuplicate,
  onHide,
}: SectionViewProps) {
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
                  : "border-neutral-200"
            )}
          >
            <h3 className="text-sm font-medium text-foreground">
              {section.label}
            </h3>
            <span className="text-xs text-muted-foreground">
              {section.projects.length}건
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {section.projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onStatusChange={onStatusChange}
                onTrafficLightChange={onTrafficLightChange}
                onRolloutChange={onRolloutChange}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onHide={onHide}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
