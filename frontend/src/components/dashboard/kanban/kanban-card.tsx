"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { User, BookOpen } from "lucide-react";
import type { Project, KanbanColumn } from "@/lib/types";
import { getDday, formatDday, getDdayColor, cn } from "@/lib/utils";
import { ChapterPipeline } from "@/components/dashboard/chapter-pipeline";
import { useBadgeTheme } from "@/lib/badge-theme";

interface KanbanCardProps {
  project: Project;
  column: KanbanColumn;
  onClick: (project: Project) => void;
}

function getCompletionRate(project: Project): number {
  const tasks = project.tasks.filter((t) => t.chapter > 0);
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "완료").length;
  return Math.round((done / tasks.length) * 100);
}

export function KanbanCard({ project, column, onClick }: KanbanCardProps) {
  const { theme } = useBadgeTheme();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id, data: { project, column } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dday = getDday(project.rolloutDate);
  const isOverdue = dday < 0;
  const completion = getCompletionRate(project);

  const label = [project.businessUnit, project.trackName]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(project)}
      className={cn(
        "cursor-grab rounded-xl border p-4 shadow-sm transition-all duration-200",
        isDragging
          ? "z-50 rotate-1 shadow-lg"
          : "hover:-translate-y-0.5 hover:shadow-md",
        isOverdue
          ? "bg-[#FCF2F4] border-[#FFD6DC]"
          : "bg-white border-neutral-100",
      )}
    >
      {/* 제목 + D-Day 한 줄 */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-[13.5px] font-semibold text-neutral-800 leading-snug line-clamp-2 flex-1">
          {project.title}
        </p>
        <span
          className={cn(
            "text-[13.5px] font-medium shrink-0",
            getDdayColor(dday),
          )}
        >
          {formatDday(dday)}
        </span>
      </div>

      {/* 담당자 + 배지 */}
      <div className="flex items-center gap-1.5 mb-3">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-100 shrink-0">
          <User className="w-3 h-3 text-neutral-400" />
        </div>
        <span className="text-[11px] text-neutral-500 shrink-0">
          {project.tutor ?? "미정"}
        </span>
        <div className="flex items-center gap-1 ml-auto">
          <span
            className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
              theme.unitBadge,
            )}
          >
            {project.businessUnit}
            {project.trackName && (
              <>
                <span className="mx-1 opacity-50">·</span>
                {project.trackName}
              </>
            )}
          </span>
          <span
            className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
              theme.typeBadge,
            )}
          >
            {project.productionType}
          </span>
        </div>
      </div>

      {/* 챕터 파이프라인 */}
      {project.chapterCount > 0 && (
        <div className="mb-3">
          <ChapterPipeline project={project} />
        </div>
      )}

      {/* 하단 메타 */}
      <div className="flex items-center gap-3 text-[11px] text-neutral-400">
        <span className="flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          {project.chapterCount}장
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <circle
              cx="6"
              cy="6"
              r="5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            {completion >= 100 ? (
              <circle cx="6" cy="6" r="5" fill="currentColor" opacity="0.3" />
            ) : (
              <path
                d={`M6 6 L6 1 A5 5 0 ${completion >= 50 ? 1 : 0} 1 ${
                  6 + 5 * Math.sin((completion / 100) * 2 * Math.PI)
                } ${6 - 5 * Math.cos((completion / 100) * 2 * Math.PI)} Z`}
                fill="currentColor"
                opacity="0.3"
              />
            )}
          </svg>
          {completion}%
        </span>
      </div>
    </div>
  );
}
