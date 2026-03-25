"use client";

import { useState } from "react";
import { Layers, CalendarCheck, AlertTriangle, ChevronDown } from "lucide-react";
import type { Project } from "@/lib/types";
import { getDday, isProjectActive, cn } from "@/lib/utils";

interface SummaryMetricsProps {
  projects: Project[];
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  detail?: string;
  variant?: "default" | "danger";
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  expandContent?: React.ReactNode;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  variant = "default",
  expandable = false,
  expanded = false,
  onToggle,
  expandContent,
}: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div
        className={cn(
          "flex items-center gap-4 px-5 py-4",
          expandable && "cursor-pointer hover:bg-accent/30 transition-colors"
        )}
        onClick={expandable ? onToggle : undefined}
      >
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            variant === "danger" ? "bg-red-50 text-red-500" : "bg-accent text-muted-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p
            className={cn(
              "text-2xl font-semibold tracking-tight",
              variant === "danger" && value > 0 ? "text-red-500" : "text-foreground"
            )}
          >
            {value}
            <span className="ml-0.5 text-sm font-normal text-muted-foreground">
              건
            </span>
          </p>
          {detail && !expanded && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {detail}
            </p>
          )}
        </div>
        {expandable && (
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform shrink-0",
              expanded && "rotate-180"
            )}
          />
        )}
      </div>
      {expanded && expandContent && (
        <div className="border-t border-border px-5 py-3">
          {expandContent}
        </div>
      )}
    </div>
  );
}

export function SummaryMetrics({ projects }: SummaryMetricsProps) {
  const [todayExpanded, setTodayExpanded] = useState(false);

  const activeProjects = projects.filter((p) => isProjectActive(p.status));

  const todayTasks = activeProjects.flatMap((p) =>
    p.tasks
      .filter((t) => t.status === "진행")
      .map((t) => ({
        projectTitle: p.title,
        projectId: p.id,
        chapter: t.chapter,
        taskType: t.taskType,
        assignee: t.assignee,
      }))
  );

  const todayDetail =
    todayTasks.length > 0
      ? todayTasks
          .slice(0, 2)
          .map(
            (t) =>
              `${t.projectTitle.slice(0, 10)}${t.projectTitle.length > 10 ? "…" : ""} / ${t.chapter > 0 ? `CH${t.chapter} ` : ""}${t.taskType}`
          )
          .join(", ") + (todayTasks.length > 2 ? ` 외 ${todayTasks.length - 2}건` : "")
      : "진행 중인 태스크 없음";

  const overdueCount = projects.filter(
    (p) =>
      isProjectActive(p.status) &&
      getDday(p.rolloutDate) < 0
  ).length;

  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricCard
        icon={Layers}
        label="진행 중 프로젝트"
        value={activeProjects.length}
      />
      <MetricCard
        icon={CalendarCheck}
        label="오늘 태스크"
        value={todayTasks.length}
        detail={todayDetail}
        expandable={todayTasks.length > 0}
        expanded={todayExpanded}
        onToggle={() => setTodayExpanded((v) => !v)}
        expandContent={
          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
            {todayTasks.map((t, i) => (
              <li key={i} className="flex items-center justify-between text-xs">
                <span className="text-foreground">
                  <span className="font-medium">{t.projectTitle}</span>
                  <span className="mx-1.5 text-muted-foreground/40">/</span>
                  <span className="text-muted-foreground">
                    {t.chapter > 0 ? `CH${t.chapter} ` : ""}
                    {t.taskType}
                  </span>
                </span>
                {t.assignee && (
                  <span className="text-muted-foreground shrink-0 ml-2">
                    {t.assignee}
                  </span>
                )}
              </li>
            ))}
          </ul>
        }
      />
      <MetricCard
        icon={AlertTriangle}
        label="지연"
        value={overdueCount}
        variant="danger"
      />
    </div>
  );
}
