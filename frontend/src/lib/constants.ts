import type { KanbanColumn, ProjectStatus, DdayGroup } from "./types";

export const KANBAN_COLUMNS: { id: KanbanColumn; label: string }[] = [
  { id: "교안", label: "교안" },
  { id: "촬영", label: "촬영" },
  { id: "편집·검수", label: "편집·검수" },
  { id: "롤아웃", label: "롤아웃" },
];

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "기획", label: "기획" },
  { value: "교안", label: "교안" },
  { value: "촬영", label: "촬영" },
  { value: "편집·검수", label: "편집·검수" },
  { value: "롤아웃", label: "롤아웃" },
  { value: "완료", label: "완료" },
  { value: "중단", label: "중단" },
];

export const STATUS_TO_KANBAN: Partial<Record<ProjectStatus, KanbanColumn>> = {
  교안: "교안",
  촬영: "촬영",
  "편집·검수": "편집·검수",
  롤아웃: "롤아웃",
};

export const KANBAN_TO_STATUS: Record<KanbanColumn, ProjectStatus> = {
  교안: "교안",
  촬영: "촬영",
  "편집·검수": "편집·검수",
  롤아웃: "롤아웃",
};

export const BUSINESS_UNITS = ["KDT", "KDC", "기타"] as const;

export const PRODUCTION_TYPES = [
  { value: "신규", label: "신규 제작" },
  { value: "리뉴얼", label: "리뉴얼" },
] as const;

export const KDT_TRACKS = [
  "디지털 마케터",
  "그래픽 디자이너",
  "커머스 Spring",
  "Kotlin & Spring",
  "iOS",
  "Flutter",
  "Unity",
  "데이터분석",
  "UXUI",
  "PM",
  "QAQC",
  "Unreal",
  "단기심화 Spring",
] as const;

export const DDAY_GROUPS: DdayGroup[] = [
  { label: "마감 초과", min: -Infinity, max: -1 },
  { label: "D-Day", min: 0, max: 0 },
  { label: "3일 이내", min: 1, max: 3 },
  { label: "1주 이내", min: 4, max: 7 },
  { label: "2주 이내", min: 8, max: 14 },
  { label: "한 달 이내", min: 15, max: 30 },
  { label: "한 달 이상", min: 31, max: Infinity },
];

export const TRAFFIC_LIGHT_COLORS = {
  green: { bg: "bg-emerald-500", text: "text-emerald-500", label: "정상" },
  yellow: { bg: "bg-amber-500", text: "text-amber-500", label: "주의" },
  red: { bg: "bg-red-500", text: "text-red-500", label: "위험" },
} as const;

export const PRODUCTION_PROCESSES = [
  { taskType: "촬영" as const, label: "촬영" },
  { taskType: "편집" as const, label: "컷" },
  { taskType: "자막" as const, label: "자막" },
  { taskType: "검수" as const, label: "검수" },
] as const;

export const STATUS_BADGE_VARIANT: Record<ProjectStatus, string> = {
  기획: "bg-neutral-100 text-neutral-500",
  교안: "bg-[#EDF2DC] text-[#7A9445]",
  촬영: "bg-[#E5EDCF] text-[#728A3E]",
  "편집·검수": "bg-[#DDE9C2] text-[#6A8438]",
  롤아웃: "bg-[#E5F0D0] text-[#7A9445]",
  완료: "bg-neutral-100 text-neutral-400",
  중단: "bg-neutral-100 text-neutral-400",
};
