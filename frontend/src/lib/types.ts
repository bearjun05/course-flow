export type ProjectStatus =
  | "기획"
  | "교안"
  | "촬영"
  | "편집·검수"
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
  | "승인";

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
  pm?: string;
  tutor?: string;
  curriculumManager?: string;
  editor?: string;
  subtitleEditor?: string;
  reviewer?: string;
  /** 중단 직전 상태 (재개 시 복구용) */
  suspendedFromStatus?: ProjectStatus;
  slackChannel?: string;
  slackChannelId?: string;
  driveLink?: string;
  chapterDriveLinks?: string[];
  lessonPlanLink?: string;
  backofficeLink?: string;
  trafficLight: TrafficLight;
  tasks: ChapterTask[];
  lectures: Lecture[];
  curriculumSheetLink?: string;
  note?: string;
  hidden?: boolean;
  createdAt: string;
}

export type KanbanColumn = "교안" | "촬영" | "편집·검수";

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
  reviewed?: boolean; // 검수 여부 (강 단위)
  approved?: boolean; // 승인 여부 (강 단위)
}
