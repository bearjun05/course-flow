"use client";

import { useState } from "react";
import {
  FileText,
  HardDrive,
  LayoutDashboard,
  Sheet,
  Hash,
  ExternalLink,
  Plus,
  UserPlus,
  ChevronDown,
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

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface InfoGuideTabProps {
  project: Project;
  onStatusChange?: (status: ProjectStatus) => void;
  onTrafficLightChange?: (light: TrafficLight) => void;
}

/* ------------------------------------------------------------------ */
/*  Tiny helpers                                                       */
/* ------------------------------------------------------------------ */

const TRAFFIC: Record<TrafficLight, { dot: string; label: string }> = {
  green: { dot: "bg-[#6ECC9A]", label: "정상" },
  yellow: { dot: "bg-[#F5C842]", label: "주의" },
  red: { dot: "bg-[#F47A8A]", label: "위험" },
};

function PersonRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px] text-neutral-400">{label}</span>
      {value ? (
        <span className="text-[12px] font-medium text-neutral-700">
          {value}
        </span>
      ) : (
        <button className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors">
          <UserPlus className="h-3 w-3" />
          배정
        </button>
      )}
    </div>
  );
}

function LinkChip({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
}) {
  if (!href)
    return (
      <button className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] rounded-lg border border-dashed border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:text-neutral-500 transition-colors">
        <Plus className="h-3 w-3" />
        {label}
      </button>
    );
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 transition-colors"
    >
      <Icon className="h-3 w-3" />
      {label}
      <ExternalLink className="h-2.5 w-2.5 opacity-40" />
    </a>
  );
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

export default function InfoGuideTab({
  project,
  onStatusChange,
  onTrafficLightChange,
}: InfoGuideTabProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  const prodTypeLabel =
    PRODUCTION_TYPES.find((p) => p.value === project.productionType)?.label ??
    project.productionType;
  const totalDuration = project.chapterDurations.reduce((a, b) => a + b, 0);
  const dday = getDday(project.rolloutDate);
  const ddayText = formatDday(dday);
  const ddayColor = getDdayColor(dday);
  const progressPct = getProgressPercent(project.tasks);
  const progressTxt = getProgressText(project.tasks);
  const tl = TRAFFIC[project.trafficLight];

  return (
    <div className="space-y-3">
      {/* ━━━ 핵심 지표 스트립 ━━━ */}
      <div className="flex items-center gap-5 rounded-2xl border border-neutral-100 bg-white px-5 py-3.5 shadow-sm">
        {/* 상태 */}
        <Select
          value={project.status}
          onValueChange={(v) => {
            if (v && onStatusChange) onStatusChange(v as ProjectStatus);
          }}
        >
          <SelectTrigger className="h-6 w-auto gap-1 rounded-md border-none px-2 text-[11px] font-medium shadow-none bg-neutral-100 text-neutral-600">
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

        {/* 구분선 */}
        <div className="w-px h-4 bg-neutral-100" />

        {/* D-Day */}
        <span className={cn("text-sm font-semibold tabular-nums", ddayColor)}>
          {ddayText}
        </span>

        <div className="w-px h-4 bg-neutral-100" />

        {/* 진행률 */}
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#6ECC9A] transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[11px] text-neutral-400 tabular-nums">
            {progressPct}%
            <span className="ml-0.5 opacity-70">({progressTxt})</span>
          </span>
        </div>

        <div className="w-px h-4 bg-neutral-100" />

        {/* 신호등 */}
        <Select
          value={project.trafficLight}
          onValueChange={(v) => {
            if (v && onTrafficLightChange)
              onTrafficLightChange(v as TrafficLight);
          }}
        >
          <SelectTrigger className="h-6 w-auto gap-1 rounded-md border-none px-2 text-[11px] shadow-none hover:bg-neutral-50">
            <span className="flex items-center gap-1.5">
              <span
                className={cn("inline-block h-2.5 w-2.5 rounded-full", tl.dot)}
              />
              <span className="text-neutral-500">{tl.label}</span>
            </span>
          </SelectTrigger>
          <SelectContent>
            {(["green", "yellow", "red"] as const).map((v) => (
              <SelectItem key={v} value={v} className="text-xs">
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-block h-2.5 w-2.5 rounded-full",
                      TRAFFIC[v].dot,
                    )}
                  />
                  {TRAFFIC[v].label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 스프링 — 나머지를 오른쪽으로 */}
        <div className="flex-1" />

        {/* 사업부 · 유형 */}
        <span className="text-[11px] text-neutral-400">
          {project.businessUnit}
          {project.trackName && ` · ${project.trackName}`}
          {" · "}
          {prodTypeLabel}
        </span>

        <div className="w-px h-4 bg-neutral-100" />

        {/* 챕터 요약 */}
        <span className="text-[11px] text-neutral-400">
          {project.chapterCount}챕터
          {totalDuration > 0 && ` · ${totalDuration}h`}
        </span>

        <div className="w-px h-4 bg-neutral-100" />

        {/* 펼치기 버튼 */}
        <button
          onClick={() => setDetailOpen((v) => !v)}
          className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          상세
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              detailOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* ━━━ 상세 패널 (접기/펼치기) ━━━ */}
      {detailOpen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-in slide-in-from-top-2 fade-in duration-200">
          {/* 일정 */}
          <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                일정
              </span>
              <span
                className={cn(
                  "text-xl font-black tabular-nums tracking-tight",
                  ddayColor,
                )}
              >
                {ddayText}
              </span>
            </div>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-neutral-400">롤아웃</span>
                <span className="text-neutral-700 font-medium">
                  {project.rolloutDate.slice(2).replace(/-/g, ".")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">정산일</span>
                <span className="text-neutral-700 font-medium">
                  {project.paymentDate.slice(2).replace(/-/g, ".")}
                </span>
              </div>
            </div>
            {/* 챕터별 분량 */}
            {project.chapterDurations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-neutral-100">
                <p className="text-[11px] text-neutral-400 mb-1.5">
                  챕터별 분량
                </p>
                <div className="flex flex-wrap gap-1">
                  {project.chapterDurations.map((d, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center h-5 px-1.5 rounded bg-neutral-50 text-[10px] text-neutral-500 tabular-nums"
                    >
                      {i + 1}
                      <span className="text-neutral-300 mx-0.5">:</span>
                      {d}h
                    </span>
                  ))}
                </div>
              </div>
            )}
            {project.note && (
              <div className="mt-3 pt-3 border-t border-neutral-100">
                <p className="text-[12px] text-neutral-500 leading-relaxed">
                  {project.note}
                </p>
              </div>
            )}
          </div>

          {/* 담당자 */}
          <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
              담당자
            </span>
            <div className="mt-2 space-y-0">
              <PersonRow label="튜터" value={project.tutor} />
              <PersonRow label="커기매" value={project.curriculumManager} />
              <PersonRow label="PM" value="박진영" />
              <PersonRow label="편집" value={project.editor} />
              <PersonRow label="자막" />
              <PersonRow label="검수" value={project.reviewer} />
            </div>
          </div>

          {/* 바로가기 */}
          <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
              바로가기
            </span>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <LinkChip
                icon={FileText}
                label="교안"
                href={project.lessonPlanLink}
              />
              <LinkChip
                icon={HardDrive}
                label="드라이브"
                href={project.driveLink}
              />
              <LinkChip
                icon={LayoutDashboard}
                label="백오피스"
                href={project.backofficeLink}
              />
              <LinkChip
                icon={Sheet}
                label="커리큘럼"
                href={project.curriculumSheetLink}
              />
              <LinkChip
                icon={Hash}
                label={project.slackChannel ?? "슬랙"}
                href={
                  project.slackChannel
                    ? `https://slack.com/app_redirect?channel=${project.slackChannel.replace("#", "")}`
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
