"use client";

import Link from "next/link";
import { ChevronRight, MoreHorizontal, Trash2, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project, ProjectStatus, TrafficLight } from "@/lib/types";
import { PROJECT_STATUSES } from "@/lib/constants";
import {
  getDday,
  formatDday,
  getDdayColor,
  getProgressPercent,
  getProgressText,
  cn,
} from "@/lib/utils";

interface DetailHeaderProps {
  project: Project;
  activeTab: string;
  onDelete?: () => void;
  onSuspend?: () => void;
  onStatusChange?: (status: ProjectStatus) => void;
  onTrafficLightChange?: (light: TrafficLight) => void;
}

const TAB_LABELS: Record<string, string> = {
  info: "강의 정보",
  schedule: "제작 일정",
  feedback: "영상 피드백",
};

const TRAFFIC_OPTIONS: { value: TrafficLight; label: string }[] = [
  { value: "green", label: "정상" },
  { value: "yellow", label: "주의" },
  { value: "red", label: "위험" },
];

const VINTAGE_TRAFFIC: Record<TrafficLight, { bg: string; label: string }> = {
  green: { bg: "bg-[#6ECC9A]", label: "정상" },
  yellow: { bg: "bg-[#F5C842]", label: "주의" },
  red: { bg: "bg-[#F47A8A]", label: "위험" },
};

export default function DetailHeader({
  project,
  activeTab,
  onDelete,
  onSuspend,
  onStatusChange,
  onTrafficLightChange,
}: DetailHeaderProps) {
  const dday = getDday(project.rolloutDate);
  const ddayText = formatDday(dday);
  const ddayColor = getDdayColor(dday);
  const progressPct = getProgressPercent(project.tasks);
  const progressTxt = getProgressText(project.tasks);
  const tl = VINTAGE_TRAFFIC[project.trafficLight];

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="px-6 py-3">
        {/* Breadcrumb */}
        <nav className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            대시보드
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium truncate max-w-[200px]">
            {project.title}
          </span>
          <ChevronRight className="h-3 w-3" />
          <span>{TAB_LABELS[activeTab] ?? activeTab}</span>
        </nav>

        {/* Summary row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-lg font-semibold tracking-tight truncate">
              {project.title}
            </h1>
            <Badge variant="outline" className="shrink-0 text-xs">
              {project.version}
            </Badge>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onSuspend} className="gap-2">
                <Pause className="h-4 w-4" />
                중단 처리
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Metadata chips */}
        <div className="mt-2 flex flex-wrap items-center gap-2.5 text-xs">
          {/* D-Day — 가장 왼쪽 */}
          <span className={cn("font-medium", ddayColor)}>{ddayText}</span>

          {/* Status select — 작고 연한 회색 */}
          <Select
            value={project.status}
            onValueChange={(v) => {
              if (v && onStatusChange) onStatusChange(v as ProjectStatus);
            }}
          >
            <SelectTrigger className="h-5 w-auto gap-0.5 rounded-md border-none px-1.5 text-[10px] font-medium shadow-none bg-[#F0F0F0] text-[#6B6B6B]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Progress — 올리브톤 바 */}
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-100">
              <span
                className="block h-full rounded-full bg-[#A8BE60] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </span>
            <span>{progressPct}%</span>
            <span className="opacity-60">({progressTxt})</span>
          </span>

          {/* Traffic light — 빈티지, 크게 */}
          <Select
            value={project.trafficLight}
            onValueChange={(v) => {
              if (v && onTrafficLightChange)
                onTrafficLightChange(v as TrafficLight);
            }}
          >
            <SelectTrigger className="h-5 w-auto gap-1 rounded-md border-none px-1.5 text-[10px] shadow-none hover:bg-accent">
              <span className="flex items-center gap-1">
                <span
                  className={cn("inline-block h-2.5 w-2.5 rounded-full", tl.bg)}
                />
                <span className="text-muted-foreground">{tl.label}</span>
              </span>
            </SelectTrigger>
            <SelectContent>
              {TRAFFIC_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-xs"
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-block h-2.5 w-2.5 rounded-full",
                        VINTAGE_TRAFFIC[opt.value].bg,
                      )}
                    />
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 사업부만 (트랙명 제거) */}
          <span className="text-muted-foreground">{project.businessUnit}</span>
        </div>
      </div>
    </header>
  );
}
