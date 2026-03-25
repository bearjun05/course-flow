"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Project, KanbanColumn as KanbanColumnType } from "@/lib/types";
import { KANBAN_COLUMNS, KANBAN_TO_STATUS, STATUS_TO_KANBAN } from "@/lib/constants";
import { isProjectActive } from "@/lib/utils";
import { KanbanColumn } from "./kanban-column";
import { Badge } from "@/components/ui/badge";

interface KanbanBoardProps {
  projects: Project[];
  onStatusChange: (projectId: string, newColumn: KanbanColumnType) => void;
}

export function KanbanBoard({ projects, onStatusChange }: KanbanBoardProps) {
  const router = useRouter();
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const kanbanProjects = projects.filter(
    (p) => isProjectActive(p.status) && STATUS_TO_KANBAN[p.status]
  );

  const getColumnProjects = useCallback(
    (columnId: KanbanColumnType) =>
      kanbanProjects.filter((p) => STATUS_TO_KANBAN[p.status] === columnId),
    [kanbanProjects]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const project = kanbanProjects.find((p) => p.id === event.active.id);
    setActiveProject(project ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveProject(null);
    const { active, over } = event;
    if (!over) return;

    const overId = over.id as string;
    let targetColumn: KanbanColumnType | undefined;

    if (KANBAN_COLUMNS.some((c) => c.id === overId)) {
      targetColumn = overId as KanbanColumnType;
    } else {
      const overProject = kanbanProjects.find((p) => p.id === overId);
      if (overProject) {
        targetColumn = STATUS_TO_KANBAN[overProject.status];
      }
    }

    if (targetColumn) {
      const activeProjectData = kanbanProjects.find(
        (p) => p.id === active.id
      );
      if (
        activeProjectData &&
        STATUS_TO_KANBAN[activeProjectData.status] !== targetColumn
      ) {
        onStatusChange(active.id as string, targetColumn);
      }
    }
  };

  const handleCardClick = (project: Project) => {
    router.push(`/projects/${project.id}`);
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">진행 중인 강의</h2>
        <Badge variant="secondary" className="text-[10px] font-normal">
          {kanbanProjects.length}
        </Badge>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-2">
          {KANBAN_COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              projects={getColumnProjects(col.id)}
              onCardClick={handleCardClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeProject && (
            <div className="w-[220px] rotate-2 rounded-xl border border-primary/30 bg-card p-3.5 shadow-2xl">
              <p className="text-[13px] font-medium text-foreground">
                {activeProject.title}
              </p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

    </div>
  );
}
