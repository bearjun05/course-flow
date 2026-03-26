"use client";

import { useState, useCallback } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { SummaryMetrics } from "@/components/dashboard/summary-metrics";
import { KanbanBoard } from "@/components/dashboard/kanban/kanban-board";
import { ProjectGrid } from "@/components/dashboard/project-grid/project-grid";
import { Separator } from "@/components/ui/separator";
import { mockProjects } from "@/lib/mock-data";
import type {
  Project,
  ProjectStatus,
  TrafficLight,
  KanbanColumn,
} from "@/lib/types";
import { KANBAN_TO_STATUS } from "@/lib/constants";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);

  const updateProject = useCallback(
    (id: string, updater: (p: Project) => Project) => {
      setProjects((prev) => prev.map((p) => (p.id === id ? updater(p) : p)));
    },
    [],
  );

  const handleKanbanStatusChange = useCallback(
    (projectId: string, newColumn: KanbanColumn) => {
      updateProject(projectId, (p) => ({
        ...p,
        status: KANBAN_TO_STATUS[newColumn],
      }));
    },
    [updateProject],
  );

  const handleStatusChange = useCallback(
    (projectId: string, status: ProjectStatus) => {
      updateProject(projectId, (p) => ({ ...p, status }));
    },
    [updateProject],
  );

  const handleTrafficLightChange = useCallback(
    (projectId: string, light: TrafficLight) => {
      updateProject(projectId, (p) => ({ ...p, trafficLight: light }));
    },
    [updateProject],
  );

  const handleRolloutChange = useCallback(
    (projectId: string, date: string) => {
      updateProject(projectId, (p) => ({ ...p, rolloutDate: date }));
    },
    [updateProject],
  );

  const handleDelete = useCallback((projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  }, []);

  const handleDuplicate = useCallback((projectId: string) => {
    setProjects((prev) => {
      const source = prev.find((p) => p.id === projectId);
      if (!source) return prev;
      const copy: Project = {
        ...source,
        id: `${source.id}-copy-${Date.now()}`,
        title: `${source.title} (복사)`,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      return [...prev, copy];
    });
  }, []);

  const handleHide = useCallback(
    (projectId: string) => {
      updateProject(projectId, (p) => ({ ...p, hidden: true }));
    },
    [updateProject],
  );

  return (
    <div className="min-h-screen">
      <AppHeader title="강의 제작 페이지" />

      <div className="space-y-6 px-6 py-6">
        <SummaryMetrics projects={projects} />

        <Separator />

        <KanbanBoard
          projects={projects}
          onStatusChange={handleKanbanStatusChange}
        />

        <Separator />

        <ProjectGrid
          projects={projects}
          onStatusChange={handleStatusChange}
          onTrafficLightChange={handleTrafficLightChange}
          onRolloutChange={handleRolloutChange}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onHide={handleHide}
        />
      </div>
    </div>
  );
}
