"use client";

import Link from "next/link";
import {
  ChevronLeft,
  MoreHorizontal,
  Trash2,
  Pause,
  History,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { Project } from "@/lib/types";
import { mockProjects } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface DetailHeaderProps {
  project: Project;
  onDelete?: () => void;
  onSuspend?: () => void;
}

export default function DetailHeader({
  project,
  onDelete,
  onSuspend,
}: DetailHeaderProps) {
  const versionNum = parseFloat(project.version.replace("v", ""));
  const hasVersionHistory = versionNum >= 2.0;
  const otherVersions = hasVersionHistory
    ? mockProjects.filter(
        (p) => p.title === project.title && p.id !== project.id,
      )
    : [];

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/80 px-6 py-4 backdrop-blur-sm">
      {/* Left: Back + Title + Version */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/"
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>

        <h1 className="text-lg font-semibold tracking-tight text-foreground truncate">
          {project.title}
        </h1>

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
      </div>

      {/* Right: Actions */}
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
    </header>
  );
}
