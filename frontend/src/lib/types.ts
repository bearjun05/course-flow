export type ProjectStatus =
  | "기획"
  | "교안"
  | "촬영"
  | "편집·검수"
  | "롤아웃"
  | "완료"
  | "중단";

export type BusinessUnit = "KDT" | "KDC" | "기타";

export type ProductionType = "신규" | "리뉴얼";

export type TrafficLight = "green" | "yellow" | "red";

export type TaskType =
  | "교안제작"
  | "커리큘럼 기획"
  | "촬영"
  | "편집"
  | "자막"
  | "검수"
  | "승인"
  | "업로드"
  | "롤아웃";

export type TaskStatus = "대기" | "진행" | "리뷰" | "완료";

export interface ChapterTask {
  id: string;
  projectId: string;
  chapter: number;
  taskType: TaskType;
  status: TaskStatus;
  assignee?: string;
  startDate?: string;
  endDate?: string;
  note?: string;
}

export interface Project {
  id: string;
  title: string;
  version: string;
  status: ProjectStatus;
  businessUnit: BusinessUnit;
  trackName?: string;
  productionType: ProductionType;
  rolloutDate: string;
  paymentDate: string;
  chapterCount: number;
  chapterDurations: number[];
  chapterTitles?: string[];
  tutor?: string;
  curriculumManager?: string;
  editor?: string;
  reviewer?: string;
  slackChannel?: string;
  slackChannelId?: string;
  driveLink?: string;
  chapterDriveLinks?: string[];
  lessonPlanLink?: string;
  backofficeLink?: string;
  trafficLight: TrafficLight;
  tasks: ChapterTask[];
  lectures: Lecture[];
  videoFeedbacks: VideoFeedback[];
  curriculumSheetLink?: string;
  note?: string;
  hidden?: boolean;
  createdAt: string;
}

export type KanbanColumn = "교안" | "촬영" | "편집·검수" | "롤아웃";

export interface DdayGroup {
  label: string;
  min: number;
  max: number;
}

// --- Page 2: 강의 상세 ---

export interface Lecture {
  id: string;
  projectId: string;
  chapter: number;
  lectureNumber: number;
  label: string;
  title?: string; // 강 제목
  videoUrls: string[];
  /** 공정별 결과물 링크 (업로드 시 자동 생성) */
  lessonPlanUrl?: string; // 교안 링크 (Notion)
  rawVideoUrl?: string; // 촬영 원본 영상
  editedVideoUrl?: string; // 편집 완료 영상
  subtitleUrl?: string; // 자막 파일
  reviewUrl?: string; // 검수 (백오피스 링크)
  approved?: boolean; // 승인 여부 (강 단위)
}

export interface ReviewScore {
  questionId: string;
  score: number;
  comment: string;
}

export type FeedbackVerdict = "승인" | "보완" | "재촬영" | null;

export interface VideoReview {
  reviewer: "pm" | "cm";
  scores: ReviewScore[];
  averageScore: number;
  completedAt: string | null;
}

export interface VideoFeedback {
  id: string;
  lectureId: string;
  pmReview: VideoReview | null;
  cmReview: VideoReview | null;
  verdict: FeedbackVerdict;
  feedbackText: string | null;
}

export const PM_QUESTIONS = [
  {
    id: "pm-q1",
    text: "음성은 또렷하고 안정적으로 전달되는가?",
    critical: true,
  },
  {
    id: "pm-q2",
    text: "영상의 화면 구성과 가독성이 적절한가?",
    critical: false,
  },
  { id: "pm-q3", text: "촬영/녹화 품질이 일정 수준 이상인가?", critical: true },
  { id: "pm-q4", text: "진행 속도와 호흡이 자연스러운가?", critical: false },
  {
    id: "pm-q5",
    text: "전체적으로 완성도 있는 시청 경험을 주는가?",
    critical: false,
  },
  {
    id: "pm-q6",
    text: "재촬영 없이 편집으로 보완 가능한 수준인가?",
    critical: false,
  },
] as const;

export const CM_QUESTIONS = [
  {
    id: "cm-q1",
    text: "이번 수업의 학습 목표가 영상에 충분히 반영되었는가?",
    critical: true,
  },
  {
    id: "cm-q2",
    text: "설명이 정확하고 오해 없이 전달되는가?",
    critical: true,
  },
  {
    id: "cm-q3",
    text: "수강생 입장에서 이해하기 쉽게 설명되었는가?",
    critical: false,
  },
  {
    id: "cm-q4",
    text: "예시와 데모가 학습 내용을 잘 뒷받침하는가?",
    critical: false,
  },
  {
    id: "cm-q5",
    text: "커리큘럼 의도와 흐름에 맞게 구성되었는가?",
    critical: false,
  },
  {
    id: "cm-q6",
    text: "불필요하거나 빠진 내용 없이 적절한 범위로 구성되었는가?",
    critical: false,
  },
] as const;
