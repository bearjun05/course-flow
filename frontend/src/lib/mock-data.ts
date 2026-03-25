import type { Project, ChapterTask, TaskType, TaskStatus, Lecture, VideoFeedback, VideoReview } from "./types";

const TASK_TYPES_PER_CHAPTER: TaskType[] = [
  "교안제작",
  "촬영",
  "편집",
  "자막",
  "검수",
];

function createChapterTasks(
  projectId: string,
  chapterCount: number,
  statusFn: (chapter: number, taskType: TaskType) => TaskStatus,
  assigneeFn?: (chapter: number, taskType: TaskType) => string | undefined,
  dateFn?: (chapter: number, taskType: TaskType) => { start?: string; end?: string }
): ChapterTask[] {
  const tasks: ChapterTask[] = [];

  // Common tasks (chapter 0)
  const commonTasks: { type: TaskType }[] = [
    { type: "리허설" },
    { type: "롤아웃" },
  ];
  for (const { type } of commonTasks) {
    const status = statusFn(0, type);
    const dates = dateFn?.(0, type);
    tasks.push({
      id: `${projectId}-c0-${type}`,
      projectId,
      chapter: 0,
      taskType: type,
      status,
      assignee: assigneeFn?.(0, type),
      startDate: dates?.start,
      endDate: dates?.end,
    });
  }

  // Per-chapter tasks
  for (let ch = 1; ch <= chapterCount; ch++) {
    for (const taskType of TASK_TYPES_PER_CHAPTER) {
      const status = statusFn(ch, taskType);
      const dates = dateFn?.(ch, taskType);
      tasks.push({
        id: `${projectId}-c${ch}-${taskType}`,
        projectId,
        chapter: ch,
        taskType,
        status,
        assignee: assigneeFn?.(ch, taskType),
        startDate: dates?.start,
        endDate: dates?.end,
      });
    }
  }

  return tasks;
}

// Project 1: 완료, KDC, 4 chapters, all done
const project1Tasks = createChapterTasks(
  "proj-1",
  4,
  () => "완료",
  () => undefined,
  (ch, type) => {
    const day = ch === 0 ? (type === "리허설" ? 5 : 18) : 10 + ch * 5 + TASK_TYPES_PER_CHAPTER.indexOf(type);
    const d = Math.min(28, Math.max(1, day));
    return {
      start: `2025-12-${String(d).padStart(2, "0")}`,
      end: `2025-12-${String(Math.min(28, d + 2)).padStart(2, "0")}`,
    };
  }
);

// Project 2: 촬영, 5 chapters, mix of completed/in-progress
const project2Tasks = createChapterTasks(
  "proj-2",
  5,
  (ch, type) => {
    if (ch === 0) return type === "리허설" ? "완료" : "대기";
    if (ch <= 2) {
      const idx = TASK_TYPES_PER_CHAPTER.indexOf(type);
      return idx <= 2 ? "완료" : idx === 3 ? "진행" : "대기";
    }
    if (ch === 3) {
      const idx = TASK_TYPES_PER_CHAPTER.indexOf(type);
      return idx <= 1 ? "완료" : idx === 2 ? "진행" : "대기";
    }
    return type === "교안제작" ? "완료" : type === "촬영" ? "진행" : "대기";
  },
  (ch, type) => {
    if (ch === 0) return type === "리허설" ? "김선용" : undefined;
    return type === "편집" ? "강태경" : type === "검수" ? "유재성" : undefined;
  },
  (ch, type) => {
    if (ch === 0)
      return type === "리허설"
        ? { start: "2026-02-10", end: "2026-02-12" }
        : {};
    const idx = TASK_TYPES_PER_CHAPTER.indexOf(type);
    const completed = (ch <= 2 && idx <= 2) || (ch === 3 && idx <= 1) || (ch >= 4 && type === "교안제작");
    const inProgress = (ch <= 2 && idx === 3) || (ch === 3 && idx === 2) || (ch >= 4 && type === "촬영");
    if (completed) return { start: "2026-02-15", end: "2026-03-01" };
    if (inProgress) return { start: "2026-03-02", end: undefined };
    return {};
  }
);

// Project 3: 편집_검수, 3 chapters, most filming done
const project3Tasks = createChapterTasks(
  "proj-3",
  3,
  (ch, type) => {
    if (ch === 0) return type === "리허설" ? "완료" : "대기";
    const idx = TASK_TYPES_PER_CHAPTER.indexOf(type);
    if (idx <= 2) return "완료"; // 교안, 촬영, 편집 done
    return idx === 3 ? "진행" : "대기"; // 자막 진행, 검수 대기
  },
  () => "이준혁",
  (ch, type) => {
    const idx = TASK_TYPES_PER_CHAPTER.indexOf(type);
    if (idx <= 2)
      return { start: "2026-02-01", end: "2026-02-28" };
    if (idx === 3)
      return { start: "2026-03-01", end: undefined };
    return {};
  }
);

// Project 4: 교안작성, 6 chapters, early stage
const project4Tasks = createChapterTasks(
  "proj-4",
  6,
  (ch, type) => {
    if (ch === 0) return "대기";
    if (type === "교안제작") return ch <= 3 ? "진행" : "대기";
    return "대기";
  },
  (ch, type) => (type === "교안제작" && ch <= 3 ? "박서연" : undefined),
  (ch, type) => {
    if (type === "교안제작" && ch <= 3)
      return { start: "2026-02-25", end: undefined };
    return {};
  }
);

function createLectures(projectId: string, chapterDurations: number[]): Lecture[] {
  const lectures: Lecture[] = [];
  chapterDurations.forEach((dur, idx) => {
    const ch = idx + 1;
    const count = Math.max(1, Math.round(dur));
    for (let l = 1; l <= count; l++) {
      lectures.push({
        id: `${projectId}-lec-${ch}-${l}`,
        projectId,
        chapter: ch,
        lectureNumber: l,
        label: `${ch}-${l}`,
        videoUrls: l <= 1 ? [`https://videos.example.com/${projectId}/${ch}-${l}.mp4`] : [],
      });
    }
  });
  return lectures;
}

const proj2Lectures = createLectures("proj-2", [2.0, 2.5, 2.0, 2.5, 2.0]);

function makePmReview(scores: number[]): VideoReview {
  const qIds = ["pm-q1","pm-q2","pm-q3","pm-q4","pm-q5","pm-q6"];
  return {
    reviewer: "pm",
    scores: qIds.map((id, i) => ({ questionId: id, score: scores[i], comment: "" })),
    averageScore: +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
    completedAt: "2026-03-05T14:00:00Z",
  };
}

function makeCmReview(scores: number[]): VideoReview {
  const qIds = ["cm-q1","cm-q2","cm-q3","cm-q4","cm-q5","cm-q6"];
  return {
    reviewer: "cm",
    scores: qIds.map((id, i) => ({ questionId: id, score: scores[i], comment: "" })),
    averageScore: +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
    completedAt: "2026-03-05T16:00:00Z",
  };
}

const proj2Feedbacks: VideoFeedback[] = [
  {
    id: "fb-1",
    lectureId: "proj-2-lec-1-1",
    pmReview: makePmReview([5, 4, 5, 4, 5, 4]),
    cmReview: makeCmReview([4, 5, 4, 4, 5, 4]),
    verdict: "승인",
    feedbackText: "전반적으로 의도한 내용과 영상 퀄리티가 충분히 확보되어 승인 가능합니다.",
  },
  {
    id: "fb-2",
    lectureId: "proj-2-lec-1-2",
    pmReview: makePmReview([3, 3, 4, 3, 3, 4]),
    cmReview: makeCmReview([4, 3, 3, 3, 4, 3]),
    verdict: "보완",
    feedbackText: "핵심 방향은 적절하나 일부 보완이 필요하여 수정 후 재검토가 필요합니다.",
  },
  {
    id: "fb-3",
    lectureId: "proj-2-lec-2-1",
    pmReview: null,
    cmReview: null,
    verdict: null,
    feedbackText: null,
  },
];

export const mockProjects: Project[] = [
  {
    id: "proj-1",
    title: "웹개발이 처음이어도 쉽게 배우는 GPT 웹개발",
    version: "v2.0",
    status: "완료",
    businessUnit: "KDC",
    productionType: "전체리뉴얼",
    rolloutDate: "2026-01-15",
    paymentDate: "2026-02-15",
    chapterCount: 4,
    chapterDurations: [1.5, 2.0, 1.5, 2.0],
    tutor: "구민정",
    curriculumManager: "한지민",
    slackChannel: "#courseflow-webdev-v2",
    driveLink: "https://drive.google.com/drive/folders/proj1",
    lessonPlanLink: "https://docs.google.com/document/d/proj1-lesson",
    backofficeLink: "https://backoffice.example.com/proj-1",
    trafficLight: "green",
    tasks: project1Tasks,
    lectures: createLectures("proj-1", [1.5, 2.0, 1.5, 2.0]),
    videoFeedbacks: [],
    createdAt: "2025-10-01T09:00:00Z",
  },
  {
    id: "proj-2",
    title: "실시간 채팅을 위한 아키텍처 설계",
    version: "v1.0",
    status: "촬영",
    businessUnit: "KDT",
    trackName: "클라우드",
    productionType: "신규",
    rolloutDate: "2026-03-20",
    paymentDate: "2026-04-20",
    chapterCount: 5,
    chapterDurations: [2.0, 2.5, 2.0, 2.5, 2.0],
    tutor: "김선용",
    curriculumManager: "최민수",
    editor: "강태경",
    reviewer: "유재성",
    slackChannel: "#courseflow-chat-arch",
    driveLink: "https://drive.google.com/drive/folders/proj2",
    lessonPlanLink: "https://docs.google.com/document/d/proj2-lesson",
    backofficeLink: "https://backoffice.example.com/proj-2",
    trafficLight: "green",
    tasks: project2Tasks,
    lectures: proj2Lectures,
    videoFeedbacks: proj2Feedbacks,
    curriculumSheetLink: "https://docs.google.com/spreadsheets/d/proj2-sheet",
    note: "촬영 3~4챕터 진행 중",
    createdAt: "2025-11-15T10:00:00Z",
  },
  {
    id: "proj-3",
    title: "LLM 파인튜닝 마스터클래스",
    version: "v1.0",
    status: "편집_검수",
    businessUnit: "KDT",
    trackName: "AI",
    productionType: "신규",
    rolloutDate: "2026-03-13",
    paymentDate: "2026-04-13",
    chapterCount: 3,
    chapterDurations: [2.5, 3.0, 2.5],
    tutor: "이준혁",
    curriculumManager: "정수진",
    editor: "김다은",
    reviewer: "박지훈",
    slackChannel: "#courseflow-llm-finetuning",
    driveLink: "https://drive.google.com/drive/folders/proj3",
    lessonPlanLink: "https://docs.google.com/document/d/proj3-lesson",
    backofficeLink: "https://backoffice.example.com/proj-3",
    trafficLight: "yellow",
    tasks: project3Tasks,
    lectures: createLectures("proj-3", [2.5, 3.0, 2.5]),
    videoFeedbacks: [],
    note: "자막 작업 진행 중, 롤아웃 D-7",
    createdAt: "2025-12-01T09:00:00Z",
  },
  {
    id: "proj-4",
    title: "비전공자를 위한 데이터 분석",
    version: "v1.0",
    status: "교안작성",
    businessUnit: "KDC",
    productionType: "신규",
    rolloutDate: "2026-04-05",
    paymentDate: "2026-05-05",
    chapterCount: 6,
    chapterDurations: [1.5, 2.0, 1.5, 2.0, 1.5, 2.0],
    tutor: "박서연",
    curriculumManager: "윤서현",
    slackChannel: "#courseflow-data-analysis",
    driveLink: "https://drive.google.com/drive/folders/proj4",
    lessonPlanLink: "https://docs.google.com/document/d/proj4-lesson",
    backofficeLink: "https://backoffice.example.com/proj-4",
    trafficLight: "green",
    tasks: project4Tasks,
    lectures: createLectures("proj-4", [1.5, 2.0, 1.5, 2.0, 1.5, 2.0]),
    videoFeedbacks: [],
    note: "1~3챕터 교안 작성 중",
    createdAt: "2026-01-20T10:00:00Z",
  },
  {
    id: "proj-5",
    title: "시니어를 위한 AI 활용법",
    version: "v1.0",
    status: "기획",
    businessUnit: "신사업",
    productionType: "신규",
    rolloutDate: "2026-04-20",
    paymentDate: "2026-05-20",
    chapterCount: 0,
    chapterDurations: [],
    curriculumManager: "송미래",
    slackChannel: "#courseflow-senior-ai",
    driveLink: "https://drive.google.com/drive/folders/proj5",
    backofficeLink: "https://backoffice.example.com/proj-5",
    trafficLight: "green",
    tasks: [],
    lectures: [],
    videoFeedbacks: [],
    note: "튜터 섭외 중",
    createdAt: "2026-02-15T09:00:00Z",
  },
];
