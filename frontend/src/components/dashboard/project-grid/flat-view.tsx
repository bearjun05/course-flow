"use client";

import type { Project, ProjectStatus, TrafficLight } from "@/lib/types";
import { getDday } from "@/lib/utils";
import { ProjectCard } from "./project-card";

interface FlatViewProps {
  projects: Project[];
  onStatusChange: (projectId: string, status: ProjectStatus) => void;
  onTrafficLightChange: (projectId: string, light: TrafficLight) => void;
  onRolloutChange: (projectId: string, date: string) => void;
  onDelete: (projectId: string) => void;
  onDuplicate: (projectId: string) => void;
  onHide: (projectId: string) => void;
}

export function FlatView({
  projects,
  onStatusChange,
  onTrafficLightChange,
  onRolloutChange,
  onDelete,
  onDuplicate,
  onHide,
}: FlatViewProps) {
  const sorted = [...projects].sort(
    (a, b) => getDday(b.rolloutDate) - getDday(a.rolloutDate),
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sorted.map((project) => (
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
  );
}
