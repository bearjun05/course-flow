"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Project } from "@/lib/types";
import {
  getDday,
  formatDday,
  getDdayColor,
  getProgressPercent,
  getProgressText,
  formatDate,
} from "@/lib/utils";
import { STATUS_BADGE_VARIANT, PROJECT_STATUSES } from "@/lib/constants";

interface KanbanPopoverProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KanbanPopover({
  project,
  open,
  onOpenChange,
}: KanbanPopoverProps) {
  if (!project) return null;

  const dday = getDday(project.rolloutDate);
  const progress = getProgressPercent(project.tasks);
  const statusLabel =
    PROJECT_STATUSES.find((s) => s.value === project.status)?.label ??
    project.status;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <DialogTitle className="text-sm leading-snug">
                {project.title}
              </DialogTitle>
              <DialogDescription className="mt-0.5">
                {project.version}
              </DialogDescription>
            </div>
            <Badge
              className={`shrink-0 text-[10px] ${STATUS_BADGE_VARIANT[project.status]}`}
            >
              {statusLabel}
            </Badge>
          </div>
        </DialogHeader>

        <Separator />

        <dl className="space-y-2 text-xs">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">롤아웃</dt>
            <dd className="font-medium text-foreground">
              {formatDate(project.rolloutDate)}{" "}
              <span className={getDdayColor(dday)}>({formatDday(dday)})</span>
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">진척도</dt>
            <dd className="font-medium text-foreground">
              {progress}% ({getProgressText(project.tasks)})
            </dd>
          </div>
          {project.tutor && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">튜터</dt>
              <dd className="font-medium text-foreground">{project.tutor}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">사업부</dt>
            <dd className="font-medium text-foreground">
              {project.businessUnit}
              {project.trackName ? ` · ${project.trackName}` : ""}
            </dd>
          </div>
        </dl>

        <div className="pt-2">
          <Link href={`/projects/${project.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-1.5 text-xs"
            >
              상세 보기
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
