"use client";

import { useState } from "react";
import { CalendarCheck, AlertTriangle, ChevronDown } from "lucide-react";
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
  const isDanger = variant === "danger" && value > 0;
  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden",
        isDanger ? "border-red-200 bg-red-50" : "border-border bg-card",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3",
          expandable &&
            "cursor-pointer hover:bg-neutral-50/80 transition-colors",
        )}
        onClick={expandable ? onToggle : undefined}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            isDanger ? "text-red-400" : "text-muted-foreground/60",
          )}
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-xs",
              isDanger ? "text-red-400" : "text-muted-foreground",
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "text-2xl font-bold leading-tight",
              isDanger ? "text-red-600" : "text-foreground",
            )}
          >
            {value}
            <span
              className={cn(
                "ml-0.5 text-xs font-normal",
                isDanger ? "text-red-400" : "text-muted-foreground",
              )}
            >
              건
            </span>
          </p>
          {detail && !expanded && (
            <p className="truncate text-[11px] text-muted-foreground">
              {detail}
            </p>
          )}
        </div>
        {expandable && (
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
              expanded && "rotate-180",
            )}
          />
        )}
      </div>
      {expanded && expandContent && (
        <div
          className={cn(
            "border-t px-4 py-3",
            isDanger ? "border-red-200" : "border-border",
          )}
        >
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
      })),
  );

  // 오늘 태스크가 있는 프로젝트를 마감 임박 순으로 정렬
  const projectsWithTasks = activeProjects
    .filter((p) => p.tasks.some((t) => t.status === "진행"))
    .sort((a, b) => getDday(a.rolloutDate) - getDday(b.rolloutDate));

  const todayDetail =
    projectsWithTasks.length > 0
      ? `${projectsWithTasks[0].title}${projectsWithTasks.length > 1 ? ` 외 ${projectsWithTasks.length - 1}개` : ""}`
      : "진행 중인 태스크 없음";

  const overdueCount = projects.filter(
    (p) => isProjectActive(p.status) && getDday(p.rolloutDate) < 0,
  ).length;

  return (
    <div className="grid grid-cols-2 gap-4">
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
