"use client";

import Link from "next/link";
import { Video } from "lucide-react";
import type { Project, ProjectStatus, TrafficLight } from "@/lib/types";
import {
  getDday,
  formatDday,
  getDdayColor,
  getAutoTrafficLight,
  cn,
} from "@/lib/utils";
import { DDAY_GROUPS } from "@/lib/constants";

interface DeadlineListViewProps {
  projects: Project[];
  onStatusChange: (projectId: string, status: ProjectStatus) => void;
  onTrafficLightChange: (projectId: string, light: TrafficLight) => void;
  flat?: boolean; // true = 섹션 없이 DB 스타일 전체 목록
}

// 교안(#EDF2DC)→롤아웃(#CCDC9F) 균등 보간
const STATUS_COLORS: Record<string, string> = {
  기획: "bg-neutral-100 text-neutral-500",
  교안: "bg-[#EDF2DC] text-[#7A9445]",
  리허설: "bg-[#E9F0D6] text-[#718C40]",
  촬영: "bg-[#E6EED0] text-[#748E40]",
  편집: "bg-[#E0E9C4] text-[#6E883C]",
  자막: "bg-[#D9E5B7] text-[#688237]",
  검수: "bg-[#D3E0AB] text-[#627C33]",
  롤아웃: "bg-[#CCDC9F] text-[#5A7830]",
  완료: "bg-neutral-100 text-neutral-400",
  중단: "bg-neutral-100 text-neutral-400",
};

const TRAFFIC_LIGHT_COLORS: Record<string, string> = {
  green: "bg-[#6ECC9A]",
  yellow: "bg-[#F5C842]",
  red: "bg-[#F47A8A]",
};

function ProjectRow({
  project,
  simple = false,
}: {
  project: Project;
  simple?: boolean;
}) {
  const dday = getDday(project.rolloutDate);
  const isOverdue = dday < 0 && project.status !== "완료";
  const isCompleted = project.status === "완료";
  const light = getAutoTrafficLight(project);

  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        "flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors",
        !simple && isOverdue && "bg-[#FCF2F4] hover:bg-[#FCF2F4]/80",
        isCompleted && !simple && "opacity-60",
      )}
    >
      {/* 신호등 (전체 탭에서는 숨김) */}
      {!simple && (
        <span
          className={cn(
            "inline-block w-2 h-2 rounded-full shrink-0",
            TRAFFIC_LIGHT_COLORS[light] ?? "bg-neutral-300",
          )}
        />
      )}

      {/* 아이콘 실루엣 */}
      <Video className="w-3.5 h-3.5 text-neutral-300 shrink-0" />

      {/* 제목 + 버전 */}
      <div className="flex items-baseline gap-1.5 flex-1 min-w-0">
        <span className="text-[13px] font-medium text-foreground truncate">
          {project.title}
        </span>
        {project.version && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[#E8EEF4] text-[#6B8BA4] shrink-0">
            {project.version}
          </span>
        )}
      </div>

      {/* 배지 그룹 */}
      <div className="flex items-center gap-1 shrink-0">
        {/* 사업부 */}
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-500">
          {[project.businessUnit, project.trackName]
            .filter(Boolean)
            .join(" · ")}
        </span>
        {/* 상태 */}
        <span
          className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
            STATUS_COLORS[project.status] ?? "bg-neutral-100 text-neutral-400",
          )}
        >
          {project.status}
        </span>
      </div>

      {/* 날짜 */}
      {isCompleted ? (
        <span className="text-[11px] text-muted-foreground shrink-0 w-32 text-right">
          {project.rolloutDate.slice(5).replace("-", "/")} 출시
        </span>
      ) : (
        <span
          className={cn(
            "text-[12px] font-medium shrink-0 w-32 text-right",
            getDdayColor(dday),
          )}
        >
          {formatDday(dday)}
          <span className="ml-1.5 text-[11px] text-muted-foreground font-normal">
            ({project.rolloutDate.slice(5).replace("-", "/")})
          </span>
        </span>
      )}
    </Link>
  );
}

export function DeadlineListView({
  projects,
  flat = false,
}: DeadlineListViewProps) {
  if (flat) {
    // DB 스타일: 섹션 없이 마감일 순 전체 목록
    const sorted = [...projects].sort(
      (a, b) => getDday(a.rolloutDate) - getDday(b.rolloutDate),
    );
    return (
      <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
        {sorted.map((project) => (
          <ProjectRow key={project.id} project={project} simple />
        ))}
      </div>
    );
  }

  // 섹션별 보기 (진행 중 전용)
  const sections = DDAY_GROUPS.map((group) => ({
    ...group,
    projects: projects
      .filter((p) => {
        const d = getDday(p.rolloutDate);
        return d >= group.min && d <= group.max;
      })
      .sort((a, b) => getDday(a.rolloutDate) - getDday(b.rolloutDate)),
  })).filter((g) => g.projects.length > 0);

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.label}>
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-xs font-semibold text-muted-foreground">
              {section.label}
            </span>
            <span className="text-[11px] text-muted-foreground/50">
              {section.projects.length}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {section.projects.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
