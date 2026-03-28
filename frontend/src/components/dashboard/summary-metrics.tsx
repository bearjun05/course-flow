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
  variant = "default",
  expandable = false,
  expanded = false,
  onToggle,
  expandContent,
}: MetricCardProps) {
  const isDanger = variant === "danger" && value > 0;
  const isGood = variant === "danger" && value === 0;
  const isNeutral = variant === "default";

  // 지연 있음 → Sparta Red / 지연 없음 → Sparta Purple / 오늘 태스크 → Sparta Blue
  const cardBg = isDanger
    ? "bg-[#FCF2F4]"
    : isGood
      ? "bg-gradient-to-br from-[#F9EEFD] to-[#F6E1FD]/50"
      : "bg-gradient-to-br from-neutral-50 to-gray-50/60";
  const iconWrapperBg = isDanger
    ? "bg-[#FFBAC4]/80"
    : isGood
      ? "bg-[#F1D8FA]/80"
      : "bg-neutral-200/60";
  const iconColor = isDanger
    ? "text-[#FA0030]"
    : isGood
      ? "text-[#A936C2]"
      : "text-neutral-400";
  const titleColor = isDanger
    ? "text-[#D90B32]"
    : isGood
      ? "text-[#8723BA]"
      : "text-neutral-600";
  const valueColor = isDanger
    ? "text-[#FA0030]"
    : isGood
      ? "text-[#A936C2]"
      : "text-neutral-500";
  const detailColor = isDanger
    ? "text-[#FC6F8C]"
    : isGood
      ? "text-[#CA50E5]"
      : "text-neutral-400";
  const borderColor = isDanger
    ? "border-[#FFD6DC]"
    : isGood
      ? "border-[#F1D8FA]"
      : "border-neutral-200";
  const dividerColor = isDanger
    ? "border-[#FFBAC4]/60"
    : isGood
      ? "border-[#E992FC]/60"
      : "border-neutral-200/60";

  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden shadow-sm",
        cardBg,
        borderColor,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-4 px-5 py-4",
          expandable && "cursor-pointer hover:brightness-[0.97] transition-all",
        )}
        onClick={expandable ? onToggle : undefined}
      >
        {/* 아이콘 박스 */}
        <div
          className={cn(
            "flex items-center justify-center w-11 h-11 rounded-xl shrink-0 shadow-sm",
            iconWrapperBg,
          )}
        >
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>

        {/* 텍스트 */}
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-semibold leading-tight", titleColor)}>
            {label}
          </p>
          <p className={cn("text-xs mt-0.5 truncate", detailColor)}>
            {value === 0 ? "없음" : (detail ?? `${value}건`)}
          </p>
        </div>

        {/* 숫자 + 화살표 */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn("text-2xl font-black", valueColor)}>{value}</span>
          {expandable && (
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isDanger
                  ? "text-[#FFBAC4]"
                  : isGood
                    ? "text-[#E992FC]"
                    : "text-neutral-300",
                expanded && "rotate-180",
              )}
            />
          )}
        </div>
      </div>

      {expanded && expandContent && (
        <div className={cn("border-t px-5 py-3", dividerColor)}>
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
