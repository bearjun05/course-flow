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
  BookOpen,
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
}

/* ------------------------------------------------------------------ */
/*  Tiny helpers                                                       */
/* ------------------------------------------------------------------ */

const TRAFFIC_LIGHTS: {
  value: TrafficLight;
  label: string;
  active: string;
  inactive: string;
}[] = [
  {
    value: "green",
    label: "정상",
    active: "bg-[#6ECC9A]",
    inactive: "bg-[#6ECC9A]/20",
  },
  {
    value: "yellow",
    label: "주의",
    active: "bg-[#F5C842]",
    inactive: "bg-[#F5C842]/20",
  },
  {
    value: "red",
    label: "위험",
    active: "bg-[#F47A8A]",
    inactive: "bg-[#F47A8A]/20",
  },
];

function TrafficLightPicker({
  value,
  onChange,
}: {
  value: TrafficLight;
  onChange?: (v: TrafficLight) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-200/50 px-2 py-1.5">
      {TRAFFIC_LIGHTS.map((tl) => (
        <button
          key={tl.value}
          onClick={() => onChange?.(tl.value)}
          title={tl.label}
          className={cn(
            "h-2.5 w-2.5 rounded-full transition-all",
            value === tl.value ? cn(tl.active, "scale-125") : tl.inactive,
          )}
          style={
            value === tl.value
              ? {
                  boxShadow: `0 0 6px 1px ${tl.value === "green" ? "#6ECC9A" : tl.value === "yellow" ? "#F5C842" : "#F47A8A"}`,
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}

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
}: InfoGuideTabProps) {
  const prodTypeLabel =
    PRODUCTION_TYPES.find((p) => p.value === project.productionType)?.label ??
    project.productionType;
  const totalDuration = project.chapterDurations.reduce((a, b) => a + b, 0);
  const progressPct = getProgressPercent(project.tasks);
  const progressTxt = getProgressText(project.tasks);

  return (
    <div className="space-y-3">
      {/* ━━━ 핵심 지표 스트립 ━━━ */}
      <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white px-5 py-3.5 shadow-sm">
        {/* 상태 배지 */}
        <Select
          value={project.status}
          onValueChange={(v) => {
            if (v && onStatusChange) onStatusChange(v as ProjectStatus);
          }}
        >
          <SelectTrigger className="h-6 w-auto gap-1 rounded-full border-none px-2.5 text-[11px] font-medium shadow-none bg-[#FDF5E6] text-[#A89060] [&_svg]:text-[#C4A96A]">
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

        <div className="w-px h-4 bg-neutral-100" />

        {/* 진행률 — 도넛 + 숫자 */}
        <div className="flex items-center gap-1.5">
          <svg className="h-5 w-5" viewBox="0 0 20 20">
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              stroke="#F0F0F0"
              strokeWidth="2.5"
            />
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              stroke="#8AAE50"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${(progressPct / 100) * 50.27} 50.27`}
              transform="rotate(-90 10 10)"
            />
          </svg>
          <span className="text-[12px] font-semibold text-neutral-600 tabular-nums">
            {progressPct}%
          </span>
          <span className="text-[11px] text-neutral-400 tabular-nums">
            {progressTxt}
          </span>
        </div>

        {/* 스프링 */}
        <div className="flex-1" />

        {/* 사업부 · 유형 — 버전 배지와 동일 크기 */}
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center h-6 px-2 rounded-md bg-[#F5F0E8] text-[11px] font-medium text-[#8B7E6B] shrink-0">
            {project.businessUnit}
            {project.trackName && (
              <>
                <span className="mx-0.5 opacity-50">·</span>
                {project.trackName}
              </>
            )}
          </span>
          <span className="inline-flex items-center h-6 px-2 rounded-md bg-[#EDF2E4] text-[11px] font-medium text-[#6E8A50] shrink-0">
            {prodTypeLabel}
          </span>
        </div>

        <div className="w-px h-4 bg-neutral-100" />

        {/* 챕터 */}
        <span className="flex items-center gap-1 text-[11px] text-neutral-400">
          <BookOpen className="h-3 w-3" />
          {project.chapterCount}챕터
        </span>
      </div>

      {/* ━━━ 상세 패널 (항상 펼침) ━━━ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 일정 */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
              일정
            </span>
            <span
              className={cn(
                "text-lg font-black tabular-nums tracking-tight",
                getDdayColor(getDday(project.rolloutDate)),
              )}
            >
              {formatDday(getDday(project.rolloutDate))}
            </span>
          </div>
          <div className="mt-2.5 space-y-1.5 text-[12px]">
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
          {project.chapterDurations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-neutral-100">
              <p className="text-[11px] text-neutral-400 mb-1.5">챕터별 분량</p>
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

        {/* 바로가기 + 메모 */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm space-y-3">
          <div>
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
          {/* 메모 */}
          <div className="border-t border-neutral-100 pt-3">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
              메모
            </span>
            <div className="mt-1.5 min-h-[36px] rounded-lg bg-neutral-50 px-3 py-2 text-[12px] text-neutral-600 leading-relaxed">
              {project.note || (
                <span className="text-neutral-300">메모를 입력하세요...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
