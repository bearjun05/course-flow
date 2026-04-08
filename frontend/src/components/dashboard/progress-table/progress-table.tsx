"use client";

import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/types";
import { isProjectActive, getDday } from "@/lib/utils";
import { getEffectiveKanbanColumn } from "@/lib/process-helpers";
import { DotMatrixTable } from "./dot-matrix-table";

interface ProgressTableProps {
  projects: Project[];
  title?: string;
  basePath?: string;
  personParam?: string;
}

export function ProgressTable({
  projects,
  title = "진행 중인 강의",
  basePath,
  personParam,
}: ProgressTableProps) {
  const activeProjects = projects
    .filter((p) => isProjectActive(p.status) && getEffectiveKanbanColumn(p))
    .sort((a, b) => getDday(a.rolloutDate) - getDday(b.rolloutDate));

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <Badge variant="secondary" className="text-[10px] font-normal">
          {activeProjects.length}
        </Badge>
      </div>

      <DotMatrixTable
        projects={activeProjects}
        basePath={basePath}
        personParam={personParam}
      />
    </div>
  );
}
