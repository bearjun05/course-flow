"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { SummaryMetrics } from "@/components/dashboard/summary-metrics";
import { ProgressTable } from "@/components/dashboard/progress-table/progress-table";
import { ProjectGrid } from "@/components/dashboard/project-grid/project-grid";
import { Separator } from "@/components/ui/separator";
import { mockProjects } from "@/lib/mock-data";
import type { Project } from "@/lib/types";
import { BadgeThemeProvider } from "@/lib/badge-theme";
import { TrafficLightThemeProvider } from "@/components/dashboard/project-grid/traffic-light-theme";

export default function DashboardPage() {
  const [projects] = useState<Project[]>(mockProjects);

  return (
    <BadgeThemeProvider>
      <TrafficLightThemeProvider>
        <div className="min-h-screen">
          <AppHeader title="강의 제작 페이지" />

          <div className="space-y-6 px-6 py-6">
            <SummaryMetrics projects={projects} />

            <Separator />

            <ProgressTable projects={projects} />

            <Separator />

            <ProjectGrid projects={projects} />
          </div>
        </div>
      </TrafficLightThemeProvider>
    </BadgeThemeProvider>
  );
}
