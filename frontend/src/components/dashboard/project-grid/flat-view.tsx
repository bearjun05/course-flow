"use client";

import type { Project } from "@/lib/types";
import { getDday } from "@/lib/utils";
import { ProjectCard } from "./project-card";

interface FlatViewProps {
  projects: Project[];
}

export function FlatView({ projects }: FlatViewProps) {
  const sorted = [...projects].sort(
    (a, b) => getDday(b.rolloutDate) - getDday(a.rolloutDate),
  );

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
