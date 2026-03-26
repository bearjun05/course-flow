"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Project, KanbanColumn } from "@/lib/types";
import { getDday, formatDday, getDdayColor, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChapterPipeline } from "@/components/dashboard/chapter-pipeline";

interface KanbanCardProps {
  project: Project;
  column: KanbanColumn;
  onClick: (project: Project) => void;
}

export function KanbanCard({ project, column, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id, data: { project, column } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dday = getDday(project.rolloutDate);
  const isOverdue = dday < 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(project)}
      className={cn(
        "cursor-grab rounded-2xl border-0 p-3.5 shadow-[0_2px_10px_rgba(120,100,80,0.08)] transition-all duration-300",
        isDragging
          ? "z-50 rotate-1 shadow-[0_8px_30px_rgba(120,100,80,0.18)]"
          : "hover:-translate-y-1 hover:shadow-[0_6px_22px_rgba(120,100,80,0.14)]",
        isOverdue ? "bg-red-50" : "bg-card",
      )}
    >
      {/* 제목 + 사업부·트랙 + D-Day 한 줄 */}
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-[13px] font-medium leading-snug text-foreground">
          {project.title}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge
            variant="secondary"
            className="h-5 px-1.5 text-[10px] font-normal"
          >
            {project.businessUnit}
            {project.trackName ? ` · ${project.trackName}` : ""}
          </Badge>
          <span className="text-[10px] text-muted-foreground/40">·</span>
          <p className={cn("text-[11px]", getDdayColor(dday))}>
            {formatDday(dday)}
          </p>
        </div>
      </div>

      {project.chapterCount > 0 && (
        <div className="mt-2.5">
          <ChapterPipeline project={project} />
        </div>
      )}
    </div>
  );
}
