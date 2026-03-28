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
import { BadgeThemeProvider } from "@/lib/badge-theme";

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
    <BadgeThemeProvider>
      <DashboardContent
        projects={projects}
        onKanbanStatusChange={handleKanbanStatusChange}
        onStatusChange={handleStatusChange}
        onTrafficLightChange={handleTrafficLightChange}
        onRolloutChange={handleRolloutChange}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onHide={handleHide}
      />
    </BadgeThemeProvider>
  );
}

interface DashboardContentProps {
  projects: Project[];
  onKanbanStatusChange: (projectId: string, newColumn: KanbanColumn) => void;
  onStatusChange: (projectId: string, status: ProjectStatus) => void;
  onTrafficLightChange: (projectId: string, light: TrafficLight) => void;
  onRolloutChange: (projectId: string, date: string) => void;
  onDelete: (projectId: string) => void;
  onDuplicate: (projectId: string) => void;
  onHide: (projectId: string) => void;
}

function DashboardContent({
  projects,
  onKanbanStatusChange,
  onStatusChange,
  onTrafficLightChange,
  onRolloutChange,
  onDelete,
  onDuplicate,
  onHide,
}: DashboardContentProps) {
  return (
    <div className="min-h-screen">
      <AppHeader title="강의 제작 페이지" />

      <div className="space-y-6 px-6 py-6">
        <SummaryMetrics projects={projects} />

        <Separator />

        <KanbanBoard
          projects={projects}
          onStatusChange={onKanbanStatusChange}
        />

        <Separator />

        <ProjectGrid
          projects={projects}
          onStatusChange={onStatusChange}
          onTrafficLightChange={onTrafficLightChange}
          onRolloutChange={onRolloutChange}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onHide={onHide}
        />
      </div>
    </div>
  );
}
