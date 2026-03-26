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
  const isProduction = column === "제작";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(project)}
      className={cn(
        "cursor-grab rounded-xl border bg-card p-3.5 shadow-sm transition-all",
        isDragging
          ? "z-50 rotate-1 border-primary/40 shadow-lg"
          : "border-border hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-md",
        isOverdue && "border-l-2 border-l-red-400",
      )}
    >
      <p className="text-[13px] font-medium leading-snug text-foreground">
        {project.title}
      </p>

      {isProduction && project.chapterCount > 0 && (
        <div className="mt-2.5">
          <ChapterPipeline project={project} />
        </div>
      )}

      <div className="mt-2 flex items-center justify-between">
        <Badge
          variant="secondary"
          className="h-5 px-1.5 text-[10px] font-normal"
        >
          {project.businessUnit}
          {project.trackName ? ` · ${project.trackName}` : ""}
        </Badge>
        <p className={cn("text-xs", getDdayColor(dday))}>{formatDday(dday)}</p>
      </div>
    </div>
  );
}
