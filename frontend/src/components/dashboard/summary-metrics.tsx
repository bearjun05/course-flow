"use client";

import { useState } from "react";
import { CalendarCheck, AlertTriangle, ChevronDown } from "lucide-react";
import type { Project } from "@/lib/types";
import { getDday, isProjectActive, cn } from "@/lib/utils";

interface SummaryMetricsProps {
  projects: Project[];
}

interface Task {
  projectTitle: string;
  chapter: number;
  taskType: string;
  assignee?: string;
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  detail?: string;
  detailBold?: boolean;
  variant?: "default" | "danger";
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  expandContent?: React.ReactNode;
}

function GroupedTaskList({
  tasks,
  danger = false,
}: {
  tasks: Task[];
  danger?: boolean;
}) {
  // 프로젝트별로 그룹핑
  const groups: { projectTitle: string; items: Task[] }[] = [];
  for (const t of tasks) {
    const last = groups[groups.length - 1];
    if (last && last.projectTitle === t.projectTitle) {
      last.items.push(t);
    } else {
      groups.push({ projectTitle: t.projectTitle, items: [t] });
    }
  }

  return (
    <ul className="space-y-0.5 max-h-48 overflow-y-auto">
      {groups.map((group) =>
        group.items.map((t, i) => (
          <li
            key={`${group.projectTitle}-${i}`}
            className="flex items-baseline justify-between text-xs py-0.5"
          >
            <span className="flex items-baseline gap-0">
              <span
                className={cn(
                  "font-medium w-[180px] shrink-0",
                  danger ? "text-red-600" : "text-foreground",
                )}
              >
                {i === 0 ? group.projectTitle : ""}
              </span>
              <span
                className={cn(
                  "mx-1.5",
                  danger ? "text-red-300" : "text-muted-foreground/40",
                )}
              >
                /
              </span>
              <span
                className={cn(
                  danger ? "text-red-400" : "text-muted-foreground",
                )}
              >
                {t.chapter > 0 ? `CH${t.chapter} ` : ""}
                {t.taskType}
              </span>
            </span>
            {t.assignee && (
              <span
                className={cn(
                  "shrink-0 ml-2",
                  danger ? "text-red-400" : "text-muted-foreground",
                )}
              >
                {t.assignee}
              </span>
            )}
          </li>
        )),
      )}
    </ul>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  detailBold = false,
  variant = "default",
  expandable = false,
  expanded = false,
  onToggle,
  expandContent,
}: MetricCardProps) {
  const isDanger = variant === "danger" && value > 0;
  const accentColor = isDanger ? "text-red-500" : "text-foreground";
  const detailColor = isDanger ? "text-red-500" : "text-foreground";

  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden",
        isDanger
          ? "border border-red-100 bg-red-50 shadow-[0_2px_14px_rgba(120,100,80,0.08)]"
          : "border-0 bg-card shadow-[0_2px_14px_rgba(120,100,80,0.08)]",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 px-6 py-3",
          expandable &&
            "cursor-pointer hover:bg-neutral-50/80 transition-colors",
        )}
        onClick={expandable ? onToggle : undefined}
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-neutral-400">{label}</p>
          <p className="mt-1" />
          <p
            className={cn("text-[29px] font-black leading-tight", accentColor)}
          >
            {value}
            <span className="ml-0.5 text-[29px] font-black">건</span>
          </p>
          {detail && !expanded && (
            <p className={cn("mt-1 truncate text-xs font-bold", detailColor)}>
              {detail}
            </p>
          )}
        </div>
        {expandable && (
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform shrink-0",
              expanded && "rotate-180",
            )}
          />
        )}
      </div>
      {expanded && expandContent && (
        <div
          className={cn(
            "border-t px-6 py-3",
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
  const [expanded, setExpanded] = useState(false);

  const activeProjects = projects.filter((p) => isProjectActive(p.status));

  const todayTasks: Task[] = activeProjects.flatMap((p) =>
    p.tasks
      .filter((t) => t.status === "진행")
      .map((t) => ({
        projectTitle: p.title,
        chapter: t.chapter,
        taskType: t.taskType,
        assignee: t.assignee,
      })),
  );

  // 오늘 태스크가 있는 프로젝트를 마감 임박 순으로 정렬
  const projectsWithTasks = activeProjects
    .filter((p) => p.tasks.some((t) => t.status === "진행"))
    .sort((a, b) => getDday(a.rolloutDate) - getDday(b.rolloutDate));

  const allNames = projectsWithTasks.map((p) => p.title).join(", ");
  const todayDetail =
    projectsWithTasks.length === 0
      ? "진행 중인 태스크 없음"
      : allNames.length <= 45
        ? allNames
        : `${projectsWithTasks[0].title} 외 ${projectsWithTasks.length - 1}개`;

  // 지연 프로젝트
  const overdueProjects = projects.filter(
    (p) => isProjectActive(p.status) && getDday(p.rolloutDate) < 0,
  );
  const overdueCount = overdueProjects.length;
  const overdueDetail =
    overdueProjects.length > 0
      ? overdueProjects.map((p) => p.title).join(", ")
      : undefined;

  const overdueTasks: Task[] = overdueProjects.flatMap((p) =>
    p.tasks
      .filter((t) => t.status === "진행")
      .map((t) => ({
        projectTitle: p.title,
        chapter: t.chapter,
        taskType: t.taskType,
        assignee: t.assignee,
      })),
  );

  const toggle = () => setExpanded((v) => !v);
  const canExpand = todayTasks.length > 0 || overdueCount > 0;

  return (
    <div className="grid grid-cols-2 gap-4">
      <MetricCard
        icon={CalendarCheck}
        label="오늘 태스크"
        value={todayTasks.length}
        detail={todayDetail}
        expandable={canExpand}
        expanded={expanded}
        onToggle={toggle}
        expandContent={<GroupedTaskList tasks={todayTasks} />}
      />
      <MetricCard
        icon={AlertTriangle}
        label="지연"
        value={overdueCount}
        detail={overdueDetail}
        detailBold
        variant="danger"
        expandable={canExpand}
        expanded={expanded}
        onToggle={toggle}
        expandContent={<GroupedTaskList tasks={overdueTasks} danger />}
      />
    </div>
  );
}
