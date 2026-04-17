"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  HardDrive,
  LayoutDashboard,
  Sheet,
  Hash,
  ExternalLink,
  Plus,
  UserPlus,
  User,
  BookOpen,
  Pencil,
  Check,
  Copy,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Project, ProjectStatus, TrafficLight } from "@/lib/types";
import {
  PROJECT_STATUSES,
  PRODUCTION_TYPES,
  TRAFFIC_LIGHT_HEX,
  TRAFFIC_LIGHT_LABEL,
  TRAFFIC_LIGHT_ORDER,
} from "@/lib/constants";
import {
  getDday,
  formatDday,
  getDdayColor,
  getProgressPercent,
  getProgressText,
  parseAssigneeNames,
  cn,
} from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export type AssigneeRole =
  | "pm"
  | "tutor"
  | "editor"
  | "subtitleEditor"
  | "curriculumManager"
  | "reviewer";

interface InfoGuideTabProps {
  project: Project;
  readOnly?: boolean;
  onStatusChange?: (status: ProjectStatus) => void;
  onRolloutDateChange?: (date: string) => void;
  onPaymentDateChange?: (date: string) => void;
  onChapterDurationsChange?: (durations: number[]) => void;
  onNoteChange?: (note: string) => void;
  onSlackChange?: (channel: string, channelId: string) => void;
  onAssigneeChange?: (role: AssigneeRole, value: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Tiny helpers                                                       */
/* ------------------------------------------------------------------ */

function TrafficLightPicker({
  value,
  onChange,
}: {
  value: TrafficLight;
  onChange?: (v: TrafficLight) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-200/50 px-2 py-1.5">
      {TRAFFIC_LIGHT_ORDER.map((tl) => {
        const isActive = value === tl;
        const hex = TRAFFIC_LIGHT_HEX[tl];
        return (
          <button
            key={tl}
            onClick={() => onChange?.(tl)}
            title={TRAFFIC_LIGHT_LABEL[tl]}
            className={cn(
              "h-2.5 w-2.5 rounded-full transition-all",
              isActive && "scale-125",
            )}
            style={{
              backgroundColor: isActive ? hex : `${hex}33`,
              boxShadow: isActive ? `0 0 6px 1px ${hex}` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

function PersonRow({
  label,
  value,
  readOnly,
  onClick,
}: {
  label: string;
  value?: string;
  readOnly?: boolean;
  onClick?: () => void;
}) {
  const clickable = !readOnly && onClick;
  const names = parseAssigneeNames(value);

  const pill =
    names.length > 0 ? (
      <span className="inline-flex flex-wrap items-center gap-1 max-w-full">
        {names.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-neutral-50 text-[12px] font-medium text-neutral-700 whitespace-nowrap"
          >
            <User className="h-3 w-3 text-neutral-400 shrink-0" />
            {name}
          </span>
        ))}
      </span>
    ) : readOnly ? (
      <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-neutral-50 text-[11px] text-neutral-300 whitespace-nowrap">
        담당자 없음
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full border border-dashed border-neutral-200 text-[11px] text-neutral-400 hover:border-neutral-300 hover:text-neutral-500 transition-colors whitespace-nowrap">
        <UserPlus className="h-3 w-3" />
        배정
      </span>
    );

  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-xs text-neutral-500 shrink-0">{label}</span>
      {clickable ? (
        <button
          onClick={onClick}
          className="min-w-0 max-w-full hover:brightness-95 transition"
          title={`${label} 배정 관리`}
        >
          {pill}
        </button>
      ) : (
        pill
      )}
    </div>
  );
}

/* ── 담당자 배정 모달 (슬랙 채널 멤버에서 복수 선택) ── */
function AssigneeModal({
  open,
  onOpenChange,
  label,
  currentValue,
  candidates,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  label: string;
  currentValue?: string;
  candidates: string[];
  onSave: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  // 모달 열릴 때 현재 값 파싱
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (open) {
      const parts = (currentValue ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      setSelected(parts);
      setQuery("");
    }
  }, [open]);

  const filtered = query
    ? candidates.filter((n) => n.includes(query))
    : candidates;

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">{label} 배정</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름 검색"
            className="w-full h-9 px-3 text-sm rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary"
          />

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-[#EDF2DC] text-[11px] font-medium text-[#6E8A3A]"
                >
                  {name}
                  <button
                    onClick={() => toggle(name)}
                    className="hover:text-destructive"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="max-h-52 overflow-y-auto rounded-lg border border-neutral-200">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-5">
                검색 결과가 없습니다
              </p>
            ) : (
              filtered.map((name) => {
                const checked = selected.includes(name);
                return (
                  <button
                    key={name}
                    onClick={() => toggle(name)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-neutral-50 border-b border-neutral-100 last:border-b-0"
                  >
                    <span className="text-sm text-foreground">{name}</span>
                    {checked && (
                      <Check className="h-3.5 w-3.5 text-[#6E8A3A]" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            슬랙 채널 멤버 목록 (추후 실제 채널 연동 시 대체됩니다).
          </p>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 h-9 rounded-lg border border-neutral-200 text-sm text-muted-foreground hover:bg-neutral-50"
            >
              취소
            </button>
            <button
              onClick={() => {
                onSave(selected.join(", "));
                onOpenChange(false);
              }}
              className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              저장
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* Brand icons */
function GoogleDriveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M8.627 2L2 13.5h5.373L14 2H8.627z" fill="#0066DA" />
      <path d="M16.627 13.5H22L15.373 2H10l6.627 11.5z" fill="#00AC47" />
      <path
        d="M2 13.5l2.687 4.667L7.373 22h9.254l2.686-4.5H8.687L2 13.5z"
        fill="#EA4335"
      />
      <path d="M8.687 17.5l-1.314-4L2 13.5l2.687 4h4z" fill="#00832D" />
      <path d="M15.313 17.5l1.314-4H22l-2.687 4.5h-4z" fill="#2684FC" />
      <path
        d="M8.627 2L7.373 6l3.314 7.5H22L15.373 2H8.627z"
        fill="#FFBA00"
        opacity="0.001"
      />
    </svg>
  );
}

function VercelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 20h20L12 2z" />
    </svg>
  );
}

function SlackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313z"
        fill="#E01E5A"
      />
      <path
        d="M8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312z"
        fill="#36C5F0"
      />
      <path
        d="M18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 01-2.522 2.521 2.528 2.528 0 01-2.522-2.521V2.522A2.528 2.528 0 0115.164 0a2.528 2.528 0 012.522 2.522v6.312z"
        fill="#2EB67D"
      />
      <path
        d="M15.164 18.956a2.528 2.528 0 012.522 2.522A2.528 2.528 0 0115.164 24a2.528 2.528 0 01-2.522-2.522v-2.522h2.522zm0-1.27a2.528 2.528 0 01-2.522-2.522 2.528 2.528 0 012.522-2.522h6.313A2.528 2.528 0 0124 15.164a2.528 2.528 0 01-2.523 2.522h-6.313z"
        fill="#ECB22E"
      />
    </svg>
  );
}

function GoogleSheetsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        fill="#0F9D58"
      />
      <path d="M14 2v6h6" fill="#87CEAC" />
      <rect x="8" y="12" width="8" height="1" rx="0.5" fill="white" />
      <rect x="8" y="14.5" width="8" height="1" rx="0.5" fill="white" />
      <rect x="8" y="17" width="5" height="1" rx="0.5" fill="white" />
    </svg>
  );
}

function LinkChip({
  icon,
  label,
  href,
  readOnly,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  readOnly?: boolean;
}) {
  if (!href) {
    if (readOnly) {
      return (
        <span className="inline-flex items-center gap-2 h-9 px-3.5 text-xs rounded-xl border border-neutral-100 bg-neutral-50 text-neutral-300">
          <span className="h-3.5 w-3.5 shrink-0 opacity-40 [&>svg]:h-full [&>svg]:w-full">
            {icon}
          </span>
          {label} 없음
        </span>
      );
    }
    return (
      <button className="inline-flex items-center gap-2 h-9 px-3.5 text-xs rounded-xl border border-dashed border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:text-neutral-500 transition-all">
        <Plus className="h-3.5 w-3.5" />
        {label}
      </button>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative inline-flex items-center gap-2 h-9 px-3.5 text-xs font-medium rounded-xl border border-neutral-200 bg-white text-neutral-600 transition-all duration-300 hover:border-neutral-100 hover:shadow-[0_0_20px_4px_rgba(255,255,255,0.9),_0_0_6px_0px_rgba(0,0,0,0.06)] hover:text-neutral-700"
    >
      <span className="h-3.5 w-3.5 shrink-0 text-neutral-300 group-hover:text-neutral-400 transition-colors [&>svg]:h-full [&>svg]:w-full">
        {icon}
      </span>
      {label}
      <ExternalLink className="h-3 w-3 opacity-30 group-hover:opacity-50 transition-opacity" />
    </a>
  );
}

/** 슬랙 칩 — 클릭 시 채널 ID / 링크를 보여주는 모달, 미등록 시 추가 모달 */
function SlackChip({
  channel,
  channelId,
  onSave,
  readOnly,
}: {
  channel?: string;
  channelId?: string;
  onSave?: (channel: string, channelId: string) => void;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [newChannel, setNewChannel] = useState(channel ?? "");
  const [newChannelId, setNewChannelId] = useState(channelId ?? "");

  // channel 필드에 링크가 직접 들어옴
  const slackLink = channel;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  // 링크 없으면 추가 버튼
  if (!channel) {
    if (readOnly) {
      return (
        <span className="inline-flex items-center gap-2 h-9 px-3.5 text-xs rounded-xl border border-neutral-100 bg-neutral-50 text-neutral-300">
          <Hash className="h-3.5 w-3.5 opacity-40" />
          슬랙 없음
        </span>
      );
    }
    return (
      <>
        <button
          onClick={() => {
            setNewChannel("");
            setNewChannelId("");
            setAddOpen(true);
          }}
          className="inline-flex items-center gap-2 h-9 px-3.5 text-xs rounded-xl border border-dashed border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:text-neutral-500 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          슬랙
        </button>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm">Slack 채널 등록</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-neutral-400">
                  Slack 링크 <span className="text-red-400">*</span>
                </label>
                <input
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                  placeholder="https://teamsparta.slack.com/archives/C06..."
                  className="w-full h-9 px-3 text-sm rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-neutral-400">
                  채널 ID
                </label>
                <input
                  value={newChannelId}
                  onChange={(e) => setNewChannelId(e.target.value)}
                  placeholder="C06XXXXXXX"
                  className="w-full h-9 px-3 text-sm font-mono rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[10px] text-neutral-400">
                  Slack 채널 상세 → 하단에서 채널 ID를 확인할 수 있습니다.
                </p>
              </div>
              <button
                onClick={() => {
                  if (newChannel.trim()) {
                    onSave?.(newChannel.trim(), newChannelId.trim());
                    setAddOpen(false);
                  }
                }}
                disabled={!newChannel.trim()}
                className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 transition-opacity"
              >
                등록
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative inline-flex items-center gap-2 h-9 px-3.5 text-xs font-medium rounded-xl border border-neutral-200 bg-white text-neutral-600 transition-all duration-300 hover:border-neutral-100 hover:shadow-[0_0_20px_4px_rgba(255,255,255,0.9),_0_0_6px_0px_rgba(0,0,0,0.06)] hover:text-neutral-700"
      >
        <Hash className="h-3.5 w-3.5 shrink-0 text-neutral-300 group-hover:text-neutral-400 transition-colors" />
        슬랙
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Slack 채널 정보</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            {/* Slack 링크 */}
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-neutral-400">
                Slack 링크
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={slackLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline truncate max-w-[250px]"
                >
                  채널 열기
                </a>
                <button
                  onClick={() => handleCopy(slackLink!, "link")}
                  className="text-neutral-300 hover:text-neutral-500 transition-colors"
                >
                  {copied === "link" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* 채널 ID */}
            {channelId && (
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-neutral-400">
                  채널 ID
                </span>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-foreground bg-neutral-50 px-2 py-0.5 rounded">
                    {channelId}
                  </code>
                  <button
                    onClick={() => handleCopy(channelId, "channelId")}
                    className="text-neutral-300 hover:text-neutral-500 transition-colors"
                  >
                    {copied === "channelId" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

export default function InfoGuideTab({
  project,
  readOnly = false,
  onStatusChange,
  onRolloutDateChange,
  onPaymentDateChange,
  onChapterDurationsChange,
  onNoteChange,
  onSlackChange,
  onAssigneeChange,
}: InfoGuideTabProps) {
  const [editingDurations, setEditingDurations] = useState(false);
  const [draftDurations, setDraftDurations] = useState<number[]>([]);
  const [editingNote, setEditingNote] = useState(false);
  const [draftNote, setDraftNote] = useState("");

  // 담당자 배정 모달
  const [assigneeModal, setAssigneeModal] = useState<{
    role: AssigneeRole;
    label: string;
  } | null>(null);

  const getAssigneeValue = (role: AssigneeRole): string | undefined => {
    switch (role) {
      case "pm":
        return project.pm;
      case "tutor":
        return project.tutor;
      case "editor":
        return project.editor;
      case "subtitleEditor":
        return project.subtitleEditor;
      case "curriculumManager":
        return project.curriculumManager;
      case "reviewer":
        return project.reviewer;
    }
  };

  // 슬랙 채널 멤버 mock (실제로는 slackChannelId로 API 호출해 조회)
  const candidates = [
    "박진영",
    "강태경",
    "김다은",
    "김하늘",
    "정민호",
    "김태준",
    "조현우",
    "송민아",
    "유재성",
    "박지훈",
    "박민서",
    "정예린",
    "김선용",
    "이준혁",
    "오승환",
    "최유진",
    "강동훈",
    "이현우",
    "박서연",
    "구민정",
    "김선우",
    "한지민",
    "최민수",
    "정수진",
    "김민지",
    "이소영",
    "박현아",
    "이수빈",
    "송미래",
    "윤서현",
  ];

  const openAssignee = (role: AssigneeRole, label: string) => {
    if (readOnly || !onAssigneeChange) return;
    setAssigneeModal({ role, label });
  };
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
        {readOnly ? (
          <span className="h-6 inline-flex items-center rounded-full px-2.5 text-[11px] font-medium bg-[#E8F0FE] text-[#5A8AC0]">
            {project.status}
          </span>
        ) : (
          <Select
            value={project.status}
            onValueChange={(v) => {
              if (v && onStatusChange) onStatusChange(v as ProjectStatus);
            }}
          >
            <SelectTrigger className="h-6 w-auto gap-1 rounded-full border-none px-2.5 text-[11px] font-medium shadow-none bg-[#E8F0FE] text-[#5A8AC0] [&_svg]:text-[#7AB4E0]">
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
        )}

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
              stroke="#4A90D9"
              strokeWidth="2.5"
              opacity="0.75"
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
          {project.chapterCount}장
        </span>
      </div>

      {/* ━━━ 상세 패널 (항상 펼침) ━━━ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 일정 */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              일정
            </span>
            <span
              className={cn(
                "text-lg font-black tabular-nums tracking-tight text-neutral-800",
              )}
            >
              {formatDday(getDday(project.rolloutDate))}
            </span>
          </div>
          <div className="mt-2.5 space-y-2 text-[12px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">롤아웃</span>
              {readOnly ? (
                <span className="text-sm font-medium text-neutral-700 tabular-nums">
                  {project.rolloutDate || "-"}
                </span>
              ) : (
                <input
                  type="date"
                  value={project.rolloutDate}
                  onChange={(e) => onRolloutDateChange?.(e.target.value)}
                  className="text-sm font-medium text-neutral-700 bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-neutral-400 focus:outline-none cursor-pointer transition-colors tabular-nums text-right"
                />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">강의 지급일</span>
              {readOnly ? (
                <span className="text-sm font-medium text-neutral-700 tabular-nums">
                  {project.paymentDate || "-"}
                </span>
              ) : (
                <input
                  type="date"
                  value={project.paymentDate}
                  onChange={(e) => onPaymentDateChange?.(e.target.value)}
                  className="text-sm font-medium text-neutral-700 bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-neutral-400 focus:outline-none cursor-pointer transition-colors tabular-nums text-right"
                />
              )}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-neutral-500">장별 분량</p>
              {!readOnly &&
                (editingDurations ? (
                  <button
                    onClick={() => {
                      onChapterDurationsChange?.(draftDurations);
                      setEditingDurations(false);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-[#6E8A50] hover:text-[#5A7340] transition-colors"
                  >
                    <Check className="h-3 w-3" />
                    완료
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setDraftDurations([...project.chapterDurations]);
                      setEditingDurations(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                ))}
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {(editingDurations
                ? draftDurations
                : project.chapterDurations
              ).map((d, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center rounded-lg bg-neutral-50 py-2 px-1.5 gap-0.5"
                >
                  <span className="text-[10px] text-neutral-400 font-medium">
                    {i + 1}장
                  </span>
                  {editingDurations ? (
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={d}
                        step={0.5}
                        min={0}
                        onChange={(e) => {
                          const next = [...draftDurations];
                          next[i] = parseFloat(e.target.value) || 0;
                          setDraftDurations(next);
                        }}
                        className="w-8 text-sm font-semibold text-neutral-700 tabular-nums text-center bg-white border border-neutral-200 rounded focus:border-neutral-400 focus:outline-none"
                      />
                      <span className="text-[10px] text-neutral-400 ml-0.5">
                        h
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-neutral-700 tabular-nums">
                      {d}
                      <span className="text-[10px] text-neutral-400 font-normal ml-0.5">
                        h
                      </span>
                    </span>
                  )}
                </div>
              ))}
            </div>
            {project.chapterDurations.length === 0 && (
              <p className="text-xs text-neutral-400 mt-2">
                기획 완료 후 생성됩니다.
              </p>
            )}
          </div>
        </div>

        {/* 담당자 */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            담당자
          </span>
          <div className="mt-2 grid grid-cols-2 gap-x-4">
            <PersonRow
              label="튜터"
              value={project.tutor}
              readOnly={readOnly}
              onClick={() => openAssignee("tutor", "튜터")}
            />
            <PersonRow
              label="편집 담당자"
              value={project.editor}
              readOnly={readOnly}
              onClick={() => openAssignee("editor", "편집 담당자")}
            />
            <PersonRow
              label="커리큘럼 기획 매니저"
              value={project.curriculumManager}
              readOnly={readOnly}
              onClick={() =>
                openAssignee("curriculumManager", "커리큘럼 기획 매니저")
              }
            />
            <PersonRow
              label="자막 담당자"
              value={project.subtitleEditor}
              readOnly={readOnly}
              onClick={() => openAssignee("subtitleEditor", "자막 담당자")}
            />
            <PersonRow
              label="PM"
              value={project.pm}
              readOnly={readOnly}
              onClick={() => openAssignee("pm", "PM")}
            />
            <PersonRow
              label="검수 담당자"
              value={project.reviewer}
              readOnly={readOnly}
              onClick={() => openAssignee("reviewer", "검수 담당자")}
            />
          </div>
        </div>

        {/* 담당자 배정 모달 */}
        {assigneeModal && onAssigneeChange && (
          <AssigneeModal
            open={true}
            onOpenChange={(o) => {
              if (!o) setAssigneeModal(null);
            }}
            label={assigneeModal.label}
            currentValue={getAssigneeValue(assigneeModal.role)}
            candidates={candidates}
            onSave={(value) => {
              onAssigneeChange(assigneeModal.role, value);
            }}
          />
        )}

        {/* 바로가기 + 메모 */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm space-y-3">
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              바로가기
            </span>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <LinkChip
                icon={<FileText className="h-4 w-4" />}
                label="교안"
                href={project.lessonPlanLink}
                readOnly={readOnly}
              />
              <LinkChip
                icon={<HardDrive className="h-4 w-4" />}
                label="드라이브"
                href={project.driveLink}
                readOnly={readOnly}
              />
              <LinkChip
                icon={<LayoutDashboard className="h-4 w-4" />}
                label="백오피스"
                href={project.backofficeLink}
                readOnly={readOnly}
              />
              <LinkChip
                icon={<Sheet className="h-4 w-4" />}
                label="커리큘럼"
                href={project.curriculumSheetLink}
                readOnly={readOnly}
              />
              <SlackChip
                channel={project.slackChannel}
                channelId={project.slackChannelId}
                onSave={readOnly ? undefined : onSlackChange}
                readOnly={readOnly}
              />
            </div>
          </div>
          {/* 메모 */}
          <div className="border-t border-neutral-100 pt-3">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              메모
            </span>
            {readOnly ? (
              <div className="mt-1.5 min-h-[36px] rounded-lg bg-neutral-50 px-3 py-2 text-[12px] text-neutral-600 leading-relaxed whitespace-pre-wrap">
                {project.note || (
                  <span className="text-neutral-300">메모가 없습니다</span>
                )}
              </div>
            ) : editingNote ? (
              <textarea
                autoFocus
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onNoteChange?.(draftNote);
                    setEditingNote(false);
                  }
                }}
                onBlur={() => {
                  onNoteChange?.(draftNote);
                  setEditingNote(false);
                }}
                className="mt-1.5 w-full min-h-[60px] rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2 text-[12px] text-neutral-700 leading-relaxed focus:border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-200 resize-none"
                placeholder="메모를 입력하세요... (Enter 저장, Shift+Enter 줄바꿈)"
              />
            ) : (
              <div
                onClick={() => {
                  setDraftNote(project.note || "");
                  setEditingNote(true);
                }}
                className="mt-1.5 min-h-[36px] rounded-lg bg-neutral-50 px-3 py-2 text-[12px] text-neutral-600 leading-relaxed cursor-text hover:bg-neutral-100/70 transition-colors whitespace-pre-wrap"
              >
                {project.note || (
                  <span className="text-neutral-300">메모를 입력하세요...</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
