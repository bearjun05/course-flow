"use client";

import Link from "next/link";
import { MoreHorizontal, Copy, EyeOff, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  getDday,
  formatDday,
  getDdayColor,
  getProgressPercent,
  getProgressText,
  formatDate,
  getAutoTrafficLight,
  cn,
} from "@/lib/utils";
import {
  PROJECT_STATUSES,
  STATUS_BADGE_VARIANT,
  TRAFFIC_LIGHT_COLORS,
} from "@/lib/constants";
import { ChapterPipeline } from "@/components/dashboard/chapter-pipeline";

interface ProjectCardProps {
  project: Project;
  onStatusChange: (projectId: string, status: ProjectStatus) => void;
  onTrafficLightChange: (projectId: string, light: TrafficLight) => void;
  onRolloutChange: (projectId: string, date: string) => void;
  onDelete: (projectId: string) => void;
  onDuplicate: (projectId: string) => void;
  onHide: (projectId: string) => void;
}

export function ProjectCard({
  project,
  onStatusChange,
  onDelete,
  onDuplicate,
  onHide,
}: ProjectCardProps) {
  const dday = getDday(project.rolloutDate);
  const progress = getProgressPercent(project.tasks);
  const progressText = getProgressText(project.tasks);
  const trafficLight = getAutoTrafficLight(project);

  return (
    <div className="group relative rounded-2xl border-0 bg-card p-4 shadow-[0_2px_14px_rgba(120,100,80,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_6px_24px_rgba(120,100,80,0.14)]">
      <div className="absolute right-3 top-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => onDuplicate(project.id)}>
              <Copy className="mr-2 h-3.5 w-3.5" />
              복제
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHide(project.id)}>
              <EyeOff className="mr-2 h-3.5 w-3.5" />
              숨김
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(project.id)}
              className="text-red-500 focus:text-red-500"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Link href={`/projects/${project.id}`} className="block">
        <div className="flex items-start gap-2 pr-8">
          <div
            className={cn(
              "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
              TRAFFIC_LIGHT_COLORS[trafficLight].bg,
            )}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {project.title}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="h-[18px] border-neutral-200 px-1.5 text-[10px] font-normal"
              >
                {project.version}
              </Badge>
            </div>
          </div>
        </div>
      </Link>

      {project.chapterCount > 0 && project.tasks.length > 0 && (
        <div className="mt-3">
          <ChapterPipeline project={project} />
        </div>
      )}

      <Link href={`/projects/${project.id}`} className="block">
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress}%</span>
            <span>{progressText}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <Badge
            variant="secondary"
            className="h-5 px-1.5 text-[10px] font-normal"
          >
            {project.businessUnit}
            {project.trackName ? ` · ${project.trackName}` : ""}
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              {formatDate(project.rolloutDate)}
            </span>
            <span className={cn("text-xs font-medium", getDdayColor(dday))}>
              {formatDday(dday)}
            </span>
          </div>
        </div>
      </Link>

      <div className="mt-2.5 flex items-center">
        <Select
          value={project.status}
          onValueChange={(v) => {
            if (v) onStatusChange(project.id, v as ProjectStatus);
          }}
        >
          <SelectTrigger
            className={cn(
              "h-6 w-auto gap-1 rounded-md border-none px-2 text-[10px] font-medium shadow-none",
              STATUS_BADGE_VARIANT[project.status],
            )}
          >
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
      </div>
    </div>
  );
}
