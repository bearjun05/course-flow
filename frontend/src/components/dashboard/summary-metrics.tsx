"use client";

import { CalendarCheck, AlertTriangle } from "lucide-react";
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
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  variant = "default",
}: MetricCardProps) {
  const isDanger = variant === "danger" && value > 0;
  const isGood = variant === "danger" && value === 0;

  const cardBg = isDanger
    ? "bg-[#FCF2F4]"
    : isGood
      ? "bg-gradient-to-br from-[#F5F8EE] to-[#EDF2DC]/50"
      : "bg-white";
  const iconWrapperBg = isDanger
    ? "bg-[#FFBAC4]/80"
    : isGood
      ? "bg-[#DDE8C0]/70"
      : "bg-neutral-100";
  const iconColor = isDanger
    ? "text-[#FA0030]"
    : isGood
      ? "text-[#8AAE50]"
      : "text-neutral-400";
  const titleColor = isDanger
    ? "text-[#D90B32]"
    : isGood
      ? "text-[#6E8A3A]"
      : "text-black";
  const valueColor = isDanger
    ? "text-[#FA0030]"
    : isGood
      ? "text-[#8AAE50]"
      : "text-black";
  const detailColor = isDanger
    ? "text-[#FC6F8C]"
    : isGood
      ? "text-[#A8BE60]"
      : "text-neutral-400";
  const borderColor = isDanger
    ? "border-[#FFD6DC]"
    : isGood
      ? "border-[#DDE8C0]"
      : "border-neutral-200";

  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden shadow-sm",
        cardBg,
        borderColor,
      )}
    >
      <div className="flex items-center gap-4 px-5 py-4">
        <div
          className={cn(
            "flex items-center justify-center w-11 h-11 rounded-xl shrink-0 shadow-sm",
            iconWrapperBg,
          )}
        >
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>

        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-semibold leading-tight", titleColor)}>
            {label}
          </p>
          <p className={cn("text-xs mt-0.5 truncate", detailColor)}>
            {value === 0 ? "없음" : (detail ?? `${value}건`)}
          </p>
        </div>

        <span className={cn("text-2xl font-black shrink-0", valueColor)}>
          {value}
        </span>
      </div>
    </div>
  );
}

export function SummaryMetrics({ projects }: SummaryMetricsProps) {
  const activeProjects = projects.filter((p) => isProjectActive(p.status));

  const todayTasks = activeProjects.flatMap((p) =>
    p.tasks.filter((t) => t.status === "진행"),
  );

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

  const overdueProjects = projects.filter(
    (p) => isProjectActive(p.status) && getDday(p.rolloutDate) < 0,
  );
  const overdueDetail =
    overdueProjects.length > 0
      ? overdueProjects.map((p) => p.title).join(", ")
      : undefined;

  return (
    <div className="grid grid-cols-2 gap-4">
      <MetricCard
        icon={CalendarCheck}
        label="오늘 태스크"
        value={todayTasks.length}
        detail={todayDetail}
      />
      <MetricCard
        icon={AlertTriangle}
        label="지연"
        value={overdueProjects.length}
        detail={overdueDetail}
        variant="danger"
      />
    </div>
  );
}
