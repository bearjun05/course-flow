"use client";

import Link from "next/link";
import { Video } from "lucide-react";
import type { Project, ProjectStatus, TrafficLight } from "@/lib/types";
import { getDday, formatDday, getDdayColor, cn } from "@/lib/utils";
import { DDAY_GROUPS } from "@/lib/constants";

interface DeadlineListViewProps {
  projects: Project[];
  onStatusChange: (projectId: string, status: ProjectStatus) => void;
  onTrafficLightChange: (projectId: string, light: TrafficLight) => void;
}

// 프로젝트 상태 → 진척 단계 색 (프로그래스바와 동일 팔레트)
const STATUS_COLORS: Record<string, string> = {
  기획: "bg-neutral-100 text-neutral-400",
  교안작성: "bg-[#EDF2DC] text-[#6B7C3A]",
  리허설: "bg-[#DDE8C0] text-[#5C6E2A]",
  촬영: "bg-[#CCDC9F] text-[#4E5F1E]",
  편집_검수: "bg-[#BACE80] text-[#3F4F14]",
  롤아웃: "bg-[#A8BE60] text-[#30400A]",
  완료: "bg-emerald-100 text-emerald-700",
  중단: "bg-neutral-100 text-neutral-400",
};

const STATUS_LABELS: Record<string, string> = {
  기획: "기획",
  교안작성: "교안작성",
  리허설: "리허설",
  촬영: "촬영",
  편집_검수: "편집·검수",
  롤아웃: "롤아웃",
  완료: "완료",
  중단: "중단",
};

const UNIT_TEXT: Record<string, string> = {
  KDT: "text-amber-600",
  KDC: "text-yellow-600",
  신사업: "text-orange-600",
};

const TRAFFIC_LIGHT_COLORS: Record<string, string> = {
  green: "bg-emerald-400",
  yellow: "bg-amber-400",
  red: "bg-[#FA0030]",
};

function TrafficDot({ light }: { light: TrafficLight }) {
  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full shrink-0",
        TRAFFIC_LIGHT_COLORS[light] ?? "bg-neutral-300",
      )}
    />
  );
}

function ProjectRow({ project }: { project: Project }) {
  const dday = getDday(project.rolloutDate);
  const isOverdue = dday < 0;
  const isCompleted = project.status === "완료";
  const subtitle = [project.businessUnit, project.trackName]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        "flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors",
        isOverdue && !isCompleted && "bg-[#FCF2F4] hover:bg-[#FCF2F4]/80",
      )}
    >
      {/* 신호등 */}
      <TrafficDot light={project.trafficLight} />

      {/* 아이콘 */}
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-neutral-100 shrink-0">
        <Video className="w-3.5 h-3.5 text-neutral-400" />
      </div>

      {/* 제목 + 사업부·트랙 */}
      <div className="flex items-baseline gap-2 flex-1 min-w-0">
        <span className="text-[13px] font-medium text-foreground truncate">
          {project.title}
        </span>
        <span
          className={cn(
            "text-[11px] shrink-0",
            UNIT_TEXT[project.businessUnit] ?? "text-neutral-400",
          )}
        >
          {subtitle}
        </span>
      </div>

      {/* 상태 배지 */}
      <span
        className={cn(
          "text-[10px] font-medium px-1.5 py-0.5 rounded-md shrink-0",
          STATUS_COLORS[project.status] ?? "bg-neutral-100 text-neutral-400",
        )}
      >
        {STATUS_LABELS[project.status] ?? project.status}
      </span>

      {/* D-Day (마감일) */}
      {!isCompleted ? (
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
      ) : (
        <span className="text-[11px] text-muted-foreground shrink-0 w-32 text-right">
          {project.rolloutDate.slice(5).replace("-", "/")} 출시
        </span>
      )}
    </Link>
  );
}

export function DeadlineListView({ projects }: DeadlineListViewProps) {
  const activeProjects = projects.filter((p) => p.status !== "완료");
  const completedProjects = projects.filter((p) => p.status === "완료");

  const sections = DDAY_GROUPS.map((group) => ({
    ...group,
    projects: activeProjects
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
          {/* 섹션 헤더 */}
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-xs font-semibold text-muted-foreground">
              {section.label}
            </span>
            <span className="text-[11px] text-muted-foreground/50">
              {section.projects.length}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* 행 목록 */}
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {section.projects.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        </div>
      ))}

      {/* 완료 섹션 */}
      {completedProjects.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-xs font-semibold text-muted-foreground">
              완료
            </span>
            <span className="text-[11px] text-muted-foreground/50">
              {completedProjects.length}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border opacity-60">
            {completedProjects
              .sort((a, b) => getDday(a.rolloutDate) - getDday(b.rolloutDate))
              .map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
