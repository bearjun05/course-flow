"use client";

import {
  FileText,
  HardDrive,
  LayoutDashboard,
  Sheet,
  Hash,
  ExternalLink,
  Plus,
  UserPlus,
  Calendar,
  Clock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project, ProjectStatus, TrafficLight } from "@/lib/types";
import { PROJECT_STATUSES, PRODUCTION_TYPES } from "@/lib/constants";
import {
  getDday,
  formatDday,
  getDdayColor,
  getProgressPercent,
  getProgressText,
  cn,
} from "@/lib/utils";

interface InfoGuideTabProps {
  project: Project;
  onStatusChange?: (status: ProjectStatus) => void;
  onTrafficLightChange?: (light: TrafficLight) => void;
}

/* ------------------------------------------------------------------ */
/*  Shared small components                                            */
/* ------------------------------------------------------------------ */

function InfoItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

function PersonRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      {value ? (
        <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-[#F0F0F0] text-xs font-medium">
          {value}
        </span>
      ) : (
        <button className="inline-flex items-center gap-1 h-6 px-2 rounded-full border border-dashed border-border text-[11px] text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <UserPlus className="h-3 w-3" />
          배정
        </button>
      )}
    </div>
  );
}

function LinkButton({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
}) {
  if (!href) {
    return (
      <button className="inline-flex items-center gap-1.5 h-8 px-3 text-xs rounded-md border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">
        <Plus className="h-3 w-3" />
        {label}
      </button>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 h-8 px-3 text-xs rounded-md border border-border bg-background hover:bg-accent hover:text-foreground transition-colors"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      <ExternalLink className="h-3 w-3 text-muted-foreground ml-0.5" />
    </a>
  );
}

const VINTAGE_TRAFFIC: Record<TrafficLight, { bg: string; label: string }> = {
  green: { bg: "bg-[#00C875]", label: "정상" },
  yellow: { bg: "bg-[#FDAB3D]", label: "주의" },
  red: { bg: "bg-[#E2445C]", label: "위험" },
};

const TRAFFIC_OPTIONS: { value: TrafficLight; label: string }[] = [
  { value: "green", label: "정상" },
  { value: "yellow", label: "주의" },
  { value: "red", label: "위험" },
];

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function InfoGuideTab({
  project,
  onStatusChange,
  onTrafficLightChange,
}: InfoGuideTabProps) {
  const prodTypeLabel =
    PRODUCTION_TYPES.find((p) => p.value === project.productionType)?.label ??
    project.productionType;

  const totalDuration = project.chapterDurations.reduce((a, b) => a + b, 0);
  const dday = getDday(project.rolloutDate);
  const ddayText = formatDday(dday);
  const ddayColor = getDdayColor(dday);
  const progressPct = getProgressPercent(project.tasks);
  const progressTxt = getProgressText(project.tasks);
  const tl = VINTAGE_TRAFFIC[project.trafficLight];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {/* ── 카드 1: 분류 & 상태 ── */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-1">
        <InfoItem label="사업부">
          {project.businessUnit}
          {project.trackName && (
            <span className="text-muted-foreground font-normal text-xs">
              {" "}
              · {project.trackName}
            </span>
          )}
        </InfoItem>
        <InfoItem label="제작 유형">
          <span className="inline-flex items-center h-5 px-2 rounded bg-[#F0F0F0] text-[11px] font-medium">
            {prodTypeLabel}
          </span>
        </InfoItem>
        <InfoItem label="상태">
          <Select
            value={project.status}
            onValueChange={(v) => {
              if (v && onStatusChange) onStatusChange(v as ProjectStatus);
            }}
          >
            <SelectTrigger className="h-6 w-auto gap-1 rounded-full border-none px-2.5 text-[11px] font-medium shadow-none bg-[#F0F0F0] text-[#555]">
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
        </InfoItem>
        <InfoItem label="건강도">
          <Select
            value={project.trafficLight}
            onValueChange={(v) => {
              if (v && onTrafficLightChange)
                onTrafficLightChange(v as TrafficLight);
            }}
          >
            <SelectTrigger className="h-6 w-auto gap-1 rounded-full border-none px-2 text-[11px] shadow-none hover:bg-accent">
              <span className="flex items-center gap-1.5">
                <span
                  className={cn("inline-block h-2 w-2 rounded-full", tl.bg)}
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
                        "inline-block h-2 w-2 rounded-full",
                        VINTAGE_TRAFFIC[opt.value].bg,
                      )}
                    />
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </InfoItem>
        {/* Progress bar */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
            <span>진행률</span>
            <span className="tabular-nums">
              {progressPct}% ({progressTxt})
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#F0F0F0] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#00C875] transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── 카드 2: 챕터 & 분량 ── */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-1">
        <InfoItem label="총 챕터">{project.chapterCount}개</InfoItem>
        <InfoItem label="총 분량">
          {totalDuration > 0 ? `${totalDuration}시간` : "—"}
        </InfoItem>
        <div className="pt-1.5">
          <p className="text-[11px] text-muted-foreground mb-2">챕터별 분량</p>
          {project.chapterDurations.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {project.chapterDurations.map((d, i) => (
                <span
                  key={i}
                  className="inline-flex items-center h-6 px-2 rounded bg-[#F0F0F0] text-[11px] font-medium tabular-nums"
                >
                  CH{i + 1}{" "}
                  <span className="text-muted-foreground ml-1">{d}h</span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">미정</span>
          )}
        </div>
        {/* Memo */}
        {project.note && (
          <div className="pt-2 mt-2 border-t border-border">
            <p className="text-[11px] text-muted-foreground mb-1">메모</p>
            <p className="text-xs text-foreground">{project.note}</p>
          </div>
        )}
      </div>

      {/* ── 카드 3: 일정 ── */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-1">
        <InfoItem label="롤아웃">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            {project.rolloutDate.slice(2).replace(/-/g, ".")}
          </span>
        </InfoItem>
        <InfoItem label="정산일">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            {project.paymentDate.slice(2).replace(/-/g, ".")}
          </span>
        </InfoItem>
        <div className="pt-2 mt-1 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">D-Day</span>
            <span
              className={cn(
                "text-lg font-bold tabular-nums tracking-tight",
                ddayColor,
              )}
            >
              {ddayText}
            </span>
          </div>
        </div>
      </div>

      {/* ── 카드 4: 담당자 ── */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-0">
        <PersonRow label="튜터" value={project.tutor} />
        <PersonRow label="커기매" value={project.curriculumManager} />
        <PersonRow label="PM" value="박진영" />
        <PersonRow label="편집" value={project.editor} />
        <PersonRow label="자막" />
        <PersonRow label="검수" value={project.reviewer} />
      </div>

      {/* ── 카드 5: 바로가기 링크 ── */}
      <div className="rounded-lg border border-border bg-card p-4 md:col-span-2">
        <p className="text-[11px] text-muted-foreground mb-2.5">바로가기</p>
        <div className="flex flex-wrap gap-2">
          <LinkButton
            icon={FileText}
            label="강의 교안"
            href={project.lessonPlanLink}
          />
          <LinkButton
            icon={HardDrive}
            label="구글 드라이브"
            href={project.driveLink}
          />
          <LinkButton
            icon={LayoutDashboard}
            label="백오피스"
            href={project.backofficeLink}
          />
          <LinkButton
            icon={Sheet}
            label="커리큘럼 시트"
            href={project.curriculumSheetLink}
          />
          <LinkButton
            icon={Hash}
            label={project.slackChannel ?? "슬랙 채널"}
            href={
              project.slackChannel
                ? `https://slack.com/app_redirect?channel=${project.slackChannel.replace("#", "")}`
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
