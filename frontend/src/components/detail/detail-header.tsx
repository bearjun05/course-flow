"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ChevronLeft,
  MoreHorizontal,
  Trash2,
  Pause,
  History,
  Pencil,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { Project, TrafficLight } from "@/lib/types";
import { mockProjects } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface DetailHeaderProps {
  project: Project;
  onDelete?: () => void;
  onSuspend?: () => void;
  onTrafficLightChange?: (light: TrafficLight) => void;
  onTitleChange?: (title: string) => void;
  backHref?: string;
  /** 읽기 전용 (에듀웍스 등) */
  readOnly?: boolean;
}

const TRAFFIC_LIGHTS: {
  value: TrafficLight;
  label: string;
  active: string;
  inactive: string;
  glow: string;
}[] = [
  {
    value: "green",
    label: "정상",
    active: "bg-[#6ECC9A]",
    inactive: "bg-[#6ECC9A]/20",
    glow: "#6ECC9A",
  },
  {
    value: "yellow",
    label: "주의",
    active: "bg-[#F5C842]",
    inactive: "bg-[#F5C842]/20",
    glow: "#F5C842",
  },
  {
    value: "red",
    label: "위험",
    active: "bg-[#F47A8A]",
    inactive: "bg-[#F47A8A]/20",
    glow: "#F47A8A",
  },
];

export default function DetailHeader({
  project,
  onDelete,
  onSuspend,
  onTrafficLightChange,
  onTitleChange,
  backHref = "/",
  readOnly = false,
}: DetailHeaderProps) {
  const versionNum = parseFloat(project.version.replace("v", ""));
  const hasVersionHistory = versionNum >= 2.0;
  const otherVersions = hasVersionHistory
    ? mockProjects.filter(
        (p) => p.title === project.title && p.id !== project.id,
      )
    : [];

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(project.title);
  useEffect(() => {
    setTitleDraft(project.title);
  }, [project.title]);

  const saveTitle = () => {
    const next = titleDraft.trim();
    if (next && next !== project.title) {
      onTitleChange?.(next);
    }
    setEditingTitle(false);
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/80 px-6 py-4 backdrop-blur-sm">
      {/* Left: Back + Title + Version + Traffic Light */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href={backHref}
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>

        {!readOnly && editingTitle ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveTitle();
                }
                if (e.key === "Escape") {
                  setTitleDraft(project.title);
                  setEditingTitle(false);
                }
              }}
              onBlur={saveTitle}
              className="text-lg font-semibold tracking-tight text-foreground bg-transparent border-b border-neutral-300 focus:border-neutral-500 focus:outline-none min-w-[240px]"
            />
            <button
              onClick={saveTitle}
              className="inline-flex items-center justify-center h-6 w-6 rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              title="저장"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <h1
            className={cn(
              "text-lg font-semibold tracking-tight text-foreground truncate group/title relative flex items-center gap-1.5",
              !readOnly && onTitleChange && "cursor-text",
            )}
            onClick={() => {
              if (!readOnly && onTitleChange) setEditingTitle(true);
            }}
          >
            {project.title}
            {!readOnly && onTitleChange && (
              <Pencil className="h-3 w-3 text-neutral-300 opacity-0 group-hover/title:opacity-100 transition-opacity" />
            )}
          </h1>
        )}

        {hasVersionHistory ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-medium transition-colors shrink-0",
                "bg-neutral-100 text-neutral-500 hover:bg-neutral-200",
              )}
            >
              {project.version}
              <History className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">
                버전 이력
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-xs" disabled>
                <span className="font-medium">{project.version}</span>
                <span className="text-muted-foreground">(현재)</span>
              </DropdownMenuItem>
              {otherVersions.length > 0 ? (
                otherVersions.map((v) => (
                  <Link key={v.id} href={`/projects/${v.id}`}>
                    <DropdownMenuItem className="gap-2 text-xs">
                      <span className="font-medium">{v.version}</span>
                      <span className="text-muted-foreground">{v.status}</span>
                    </DropdownMenuItem>
                  </Link>
                ))
              ) : (
                <DropdownMenuItem
                  className="text-xs text-muted-foreground"
                  disabled
                >
                  이전 버전 v1.0 (아카이브)
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="inline-flex items-center h-6 px-2 rounded-md bg-neutral-100 text-[11px] font-medium text-neutral-500 shrink-0">
            {project.version}
          </span>
        )}

        {/* Traffic Light */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-200/50 px-2 py-1.5 shrink-0">
          {TRAFFIC_LIGHTS.map((tl) => {
            const isActive = project.trafficLight === tl.value;
            const className = cn(
              "h-2.5 w-2.5 rounded-full transition-all",
              isActive ? cn(tl.active, "scale-125") : tl.inactive,
              readOnly ? "cursor-default" : "",
            );
            const style = isActive
              ? { boxShadow: `0 0 6px 1px ${tl.glow}` }
              : undefined;
            if (readOnly) {
              return (
                <span
                  key={tl.value}
                  title={tl.label}
                  className={className}
                  style={style}
                />
              );
            }
            return (
              <button
                key={tl.value}
                onClick={() => onTrafficLightChange?.(tl.value)}
                title={tl.label}
                className={className}
                style={style}
              />
            );
          })}
        </div>
      </div>

      {/* Right: Actions (읽기 전용일 때 숨김) */}
      {!readOnly && (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors shrink-0">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onSuspend} className="gap-2 text-xs">
              <Pause className="h-3.5 w-3.5" />
              중단 처리
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="gap-2 text-xs text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
