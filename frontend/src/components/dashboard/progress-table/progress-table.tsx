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
  /** 강조할 담당 단계 컬럼명 (에듀웍스에서 역할별 강조용) */
  highlightedStage?: string;
}

export function ProgressTable({
  projects,
  title = "진행 중인 강의",
  basePath,
  personParam,
  highlightedStage,
}: ProgressTableProps) {
  const activeProjects = projects
    .filter(
      (p) =>
        isProjectActive(p.status) &&
        (p.status === "기획" || getEffectiveKanbanColumn(p)),
    )
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
        highlightedStage={highlightedStage}
      />
    </div>
  );
}
