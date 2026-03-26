"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Project, KanbanColumn as KanbanColumnType } from "@/lib/types";
import { KanbanCard } from "./kanban-card";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  column: { id: KanbanColumnType; label: string };
  projects: Project[];
  onCardClick: (project: Project) => void;
}

export function KanbanColumn({
  column,
  projects,
  onCardClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex min-w-[220px] flex-1 flex-col">
      <div className="mb-3 px-1">
        <h3 className="text-xs font-medium text-neutral-500">{column.label}</h3>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 rounded-xl border border-dashed border-transparent p-1 transition-colors",
          isOver && "border-primary/30 bg-primary/[0.03]",
          projects.length === 0 && "min-h-[80px]",
        )}
      >
        <SortableContext
          items={projects.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {projects.map((project) => (
            <KanbanCard
              key={project.id}
              project={project}
              column={column.id}
              onClick={onCardClick}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
