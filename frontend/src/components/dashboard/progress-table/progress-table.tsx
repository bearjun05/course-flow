"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/types";
import { isProjectActive, getDday, cn } from "@/lib/utils";
import { getEffectiveKanbanColumn } from "@/lib/process-helpers";
import { ChapterCellTable } from "./chapter-cell-table";
import { DotMatrixTable, type DotStyle } from "./dot-matrix-table";

type ViewMode = "chapters" | "dots";

interface ProgressTableProps {
  projects: Project[];
}

export function ProgressTable({ projects }: ProgressTableProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("dots");
  const [dotStyle, setDotStyle] = useState<DotStyle>("dot");

  const activeProjects = projects
    .filter((p) => isProjectActive(p.status) && getEffectiveKanbanColumn(p))
    .sort((a, b) => getDday(a.rolloutDate) - getDday(b.rolloutDate));

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
        <div className="flex items-center gap-3">
          {/* 도트 스타일 디버그 (도트 뷰일 때만) */}
          {viewMode === "dots" && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">표시</span>
              <div className="flex items-center rounded-md border border-border p-0.5 gap-0.5">
                <button
                  onClick={() => setDotStyle("dot")}
                  className={cn(
                    "rounded px-2 py-0.5 text-[10px] transition-colors",
                    dotStyle === "dot"
                      ? "bg-background shadow-sm text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#DDE8C0]" />
                    도트
                  </span>
                </button>
                <button
                  onClick={() => setDotStyle("label")}
                  className={cn(
                    "rounded px-2 py-0.5 text-[10px] transition-colors",
                    dotStyle === "label"
                      ? "bg-background shadow-sm text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="flex items-center gap-1">
                    <span className="inline-block rounded bg-[#EDF2DC] px-1 text-[8px] text-[#7A9445]">
                      A
                    </span>
                    텍스트
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* 뷰 모드 토글 */}
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
      </div>

      {viewMode === "chapters" ? (
        <ChapterCellTable projects={activeProjects} />
      ) : (
        <DotMatrixTable projects={activeProjects} dotStyle={dotStyle} />
      )}
    </div>
  );
}
