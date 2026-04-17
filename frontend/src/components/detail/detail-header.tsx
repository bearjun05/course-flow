"use client";

import Link from "next/link";
import type React from "react";
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
import { cn } from "@/lib/utils";
import {
  TRAFFIC_LIGHT_HEX,
  TRAFFIC_LIGHT_LABEL,
  TRAFFIC_LIGHT_ORDER,
} from "@/lib/constants";

/** 같은 강의의 다른 버전 (버전 히스토리 드롭다운용) */
export interface ProjectVersionRef {
  id: string;
  version: string;
  status: string;
}

interface DetailHeaderProps {
  project: Project;
  onDelete?: () => void;
  onSuspend?: () => void;
  onTrafficLightChange?: (light: TrafficLight) => void;
  onTitleChange?: (title: string) => void;
  /** 같은 제목의 다른 버전 목록. 전달하지 않으면 '이전 버전 아카이브' 안내만 노출 */
  otherVersions?: ProjectVersionRef[];
  backHref?: string;
  /** 읽기 전용 (에듀웍스 등) */
  readOnly?: boolean;
}

export default function DetailHeader({
  project,
  onDelete,
  onSuspend,
  onTrafficLightChange,
  onTitleChange,
  otherVersions = [],
  backHref = "/",
  readOnly = false,
}: DetailHeaderProps) {
  const versionNum = parseFloat(project.version.replace("v", ""));
  const hasVersionHistory = versionNum >= 2.0;

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
          {TRAFFIC_LIGHT_ORDER.map((value) => {
            const isActive = project.trafficLight === value;
            const hex = TRAFFIC_LIGHT_HEX[value];
            const className = cn(
              "h-2.5 w-2.5 rounded-full transition-all",
              isActive && "scale-125",
              readOnly && "cursor-default",
            );
            const style: React.CSSProperties = {
              backgroundColor: isActive ? hex : `${hex}33`,
              boxShadow: isActive ? `0 0 6px 1px ${hex}` : undefined,
            };
            if (readOnly) {
              return (
                <span
                  key={value}
                  title={TRAFFIC_LIGHT_LABEL[value]}
                  className={className}
                  style={style}
                />
              );
            }
            return (
              <button
                key={value}
                onClick={() => onTrafficLightChange?.(value)}
                title={TRAFFIC_LIGHT_LABEL[value]}
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
