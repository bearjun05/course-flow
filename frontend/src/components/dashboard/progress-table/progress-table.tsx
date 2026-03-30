"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/types";
import { isProjectActive } from "@/lib/utils";
import { getEffectiveKanbanColumn } from "@/lib/process-helpers";
import { ChapterCellTable } from "./chapter-cell-table";
import { DotMatrixTable } from "./dot-matrix-table";
import { cn } from "@/lib/utils";

type ViewMode = "chapters" | "dots";

interface ProgressTableProps {
  projects: Project[];
}

export function ProgressTable({ projects }: ProgressTableProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("chapters");

  const activeProjects = projects.filter(
    (p) => isProjectActive(p.status) && getEffectiveKanbanColumn(p),
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            진행 중인 강의
          </h2>
          <Badge variant="secondary" className="text-[10px] font-normal">
            {activeProjects.length}
          </Badge>
        </div>
        <div className="flex items-center rounded-lg border border-border p-0.5 gap-0.5">
          <button
            onClick={() => setViewMode("chapters")}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs transition-colors",
              viewMode === "chapters"
                ? "bg-background shadow-sm text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            장 표시
          </button>
          <button
            onClick={() => setViewMode("dots")}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs transition-colors",
              viewMode === "dots"
                ? "bg-background shadow-sm text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            도트
          </button>
        </div>
      </div>

      {viewMode === "chapters" ? (
        <ChapterCellTable projects={activeProjects} />
      ) : (
        <DotMatrixTable projects={activeProjects} />
      )}
    </div>
  );
}
