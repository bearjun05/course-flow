import type {
  KanbanColumn,
  ProjectStatus,
  DdayGroup,
  TrafficLight,
} from "./types";

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "기획", label: "기획" },
  { value: "교안", label: "교안" },
  { value: "촬영", label: "촬영" },
  { value: "편집·검수", label: "편집·검수" },
  { value: "완료", label: "완료" },
  { value: "중단", label: "중단" },
];

export const STATUS_TO_KANBAN: Partial<Record<ProjectStatus, KanbanColumn>> = {
  교안: "교안",
  촬영: "촬영",
  "편집·검수": "편집·검수",
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

/**
 * 신호등 단일 소스.
 * - hex: 배경/박스섀도우 등 style inline 용
 * - label: 한글 라벨
 * 신호등은 PM 수동 조작만 있으며 자동 변경 로직 없음.
 */
export const TRAFFIC_LIGHT_HEX: Record<TrafficLight, string> = {
  green: "#6ECC9A",
  yellow: "#F5C842",
  red: "#F47A8A",
};

export const TRAFFIC_LIGHT_LABEL: Record<TrafficLight, string> = {
  green: "정상",
  yellow: "주의",
  red: "위험",
};

export const TRAFFIC_LIGHT_ORDER: TrafficLight[] = ["green", "yellow", "red"];

export const STATUS_BADGE_VARIANT: Record<ProjectStatus, string> = {
  기획: "bg-neutral-100 text-neutral-500",
  교안: "bg-[#EDF2DC] text-[#7A9445]",
  촬영: "bg-[#E5EDCF] text-[#728A3E]",
  "편집·검수": "bg-[#DDE9C2] text-[#6A8438]",
  완료: "bg-neutral-100 text-neutral-400",
  중단: "bg-neutral-100 text-neutral-400",
};

/**
 * 챕터별 색상 팔레트 (12색, chapter 번호로 순환).
 * 0번은 사전 준비(neutral), 1번부터 색상 시작.
 * monday-board / work-status-tab / upload-tab / weekly-calendar / task-calendar
 * 전역에서 동일한 매핑을 쓰기 위한 단일 소스.
 */
export const CHAPTER_COLORS = [
  "#909090", // CH0 사전 (neutral)
  "#D07070", // CH1 분홍
  "#D08A6A", // CH2 살구
  "#D0A858", // CH3 주황
  "#C4A840", // CH4 노랑
  "#8AAE50", // CH5 연두
  "#50B880", // CH6 초록
  "#50AAAA", // CH7 민트
  "#5090C0", // CH8 하늘
  "#8070C0", // CH9 보라
  "#B870A0", // CH10 자주
  "#A89070", // CH11 베이지
] as const;

/** 챕터 번호 → 색상 (12색 순환) */
export function getChapterColor(chapter: number): string {
  return CHAPTER_COLORS[chapter % CHAPTER_COLORS.length];
}
