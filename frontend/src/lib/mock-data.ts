import type {
  Project,
  ChapterTask,
  TaskType,
  TaskStatus,
  Lecture,
  VideoFeedback,
  VideoReview,
} from "./types";

const TASK_TYPES_PER_CHAPTER: TaskType[] = [
  "교안제작",
  "촬영",
  "편집",
  "자막",
  "검수",
  "승인",
];

function createChapterTasks(
  projectId: string,
  chapterCount: number,
  statusFn: (chapter: number, taskType: TaskType) => TaskStatus,
  assigneeFn?: (chapter: number, taskType: TaskType) => string | undefined,
  dateFn?: (
    chapter: number,
    taskType: TaskType,
  ) => { start?: string; end?: string },
): ChapterTask[] {
  const tasks: ChapterTask[] = [];

  // Common tasks (chapter 0)
  const commonTasks: { type: TaskType }[] = [
    { type: "커리큘럼 기획" },
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
    const day =
      ch === 0
        ? type === "커리큘럼 기획"
          ? 5
          : 18
        : 10 + ch * 5 + TASK_TYPES_PER_CHAPTER.indexOf(type);
    const d = Math.min(28, Math.max(1, day));
    return {
      start: `2025-12-${String(d).padStart(2, "0")}`,
      end: `2025-12-${String(Math.min(28, d + 2)).padStart(2, "0")}`,
    };
  },
);

// Project 2: 촬영, 5 chapters, mix of completed/in-progress
const project2Tasks = createChapterTasks(
  "proj-2",
  5,
  (ch, type) => {
    if (ch === 0) return type === "커리큘럼 기획" ? "완료" : "대기";
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
    if (ch === 0) return type === "커리큘럼 기획" ? "김선용" : undefined;
    return type === "편집" ? "강태경" : type === "검수" ? "유재성" : undefined;
  },
  (ch, type) => {
    if (ch === 0)
      return type === "커리큘럼 기획"
        ? { start: "2026-02-10", end: "2026-02-12" }
        : {};
    const idx = TASK_TYPES_PER_CHAPTER.indexOf(type);
    // CH1~2: 교안~편집 완료(3월), 자막 진행중(이번주)
    if (ch <= 2) {
      if (idx <= 2) return { start: "2026-03-01", end: "2026-03-20" }; // 완료
      if (idx === 3) return { start: "2026-04-06", end: "2026-04-10" }; // 자막 진행중 (이번주)
      if (idx === 4) return { start: "2026-04-11", end: "2026-04-14" }; // 검수 예정 (이번주~다음주)
      return {}; // 승인 미정
    }
    // CH3: 촬영 완료, 편집 진행중(이번주)
    if (ch === 3) {
      if (idx <= 1) return { start: "2026-03-10", end: "2026-03-28" }; // 교안/촬영 완료
      if (idx === 2) return { start: "2026-04-07", end: "2026-04-12" }; // 편집 진행중 (이번주)
      return {}; // 나머지 미정
    }
    // CH4~5: 교안 완료, 촬영 이번주 진행
    if (type === "교안제작") return { start: "2026-03-15", end: "2026-03-25" };
    if (type === "촬영") return { start: "2026-04-08", end: "2026-04-11" }; // 이번주
    return {};
  },
);

// Project 3: 편집_검수, 3 chapters, most filming done
const project3Tasks = createChapterTasks(
  "proj-3",
  3,
  (ch, type) => {
    if (ch === 0) return type === "커리큘럼 기획" ? "완료" : "대기";
    const idx = TASK_TYPES_PER_CHAPTER.indexOf(type);
    if (idx <= 2) return "완료"; // 교안, 촬영, 편집 done
    return idx === 3 ? "진행" : "대기"; // 자막 진행, 검수 대기
  },
  () => "이준혁",
  (ch, type) => {
    const idx = TASK_TYPES_PER_CHAPTER.indexOf(type);
    if (idx <= 2) return { start: "2026-02-01", end: "2026-02-28" };
    if (idx === 3) return { start: "2026-03-01", end: "2026-04-05" }; // 자막 마감 초과
    return {};
  },
);

// Project 6: 롤아웃, 3 chapters, all done
const project6Tasks = createChapterTasks(
  "proj-6",
  3,
  (ch, type) => {
    if (ch === 0) return type === "커리큘럼 기획" ? "완료" : "진행";
    return "완료";
  },
  () => "김선우",
  (ch, type) => {
    if (ch === 0)
      return type === "커리큘럼 기획"
        ? { start: "2026-01-20", end: "2026-01-22" }
        : { start: "2026-03-27", end: undefined };
    return { start: "2026-02-01", end: "2026-03-20" };
  },
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
  },
);

/** 강별 샘플 제목 */
const SAMPLE_LECTURE_TITLES: Record<string, string[][]> = {
  "proj-1": [
    ["객체 지향 개요", "클래스와 인스턴스"],
    ["상속과 다형성", "인터페이스 활용"],
    ["디자인 패턴 입문"],
    ["팩토리 패턴", "싱글톤 패턴"],
  ],
  "proj-2": [
    ["실시간 통신 개요", "WebSocket 기초"],
    ["Socket.IO 설정", "이벤트 핸들링", "네임스페이스"],
    ["채팅방 구현", "메시지 브로드캐스트"],
    ["Redis Pub/Sub", "스케일 아웃 전략", "로드밸런싱"],
    ["배포와 모니터링", "장애 대응"],
  ],
  "proj-3": [
    ["데이터 전처리", "판다스 기초", "결측치 처리"],
    ["시각화 기본", "matplotlib", "seaborn"],
    ["통계 분석 기초", "가설 검정", "회귀 분석"],
  ],
};

function createLectures(
  projectId: string,
  chapterDurations: number[],
  /** 완료 챕터 수 (이 장까지 결과물 링크 생성) */
  completedChapters = 0,
): Lecture[] {
  const lectures: Lecture[] = [];
  const titles = SAMPLE_LECTURE_TITLES[projectId];
  chapterDurations.forEach((dur, idx) => {
    const ch = idx + 1;
    const count = Math.max(1, Math.round(dur));
    const hasDeliverables = ch <= completedChapters;
    const chTitles = titles?.[idx];
    for (let l = 1; l <= count; l++) {
      lectures.push({
        id: `${projectId}-lec-${ch}-${l}`,
        projectId,
        chapter: ch,
        lectureNumber: l,
        label: `${ch}-${l}`,
        title: chTitles?.[l - 1],
        videoUrls:
          l <= 1
            ? [`https://videos.example.com/${projectId}/${ch}-${l}.mp4`]
            : [],
        ...(hasDeliverables
          ? {
              lessonPlanUrl: `https://notion.so/${projectId}-ch${ch}-${l}`,
              rawVideoUrl: `https://drive.google.com/file/d/${projectId}-raw-${ch}-${l}`,
              editedVideoUrl: `https://drive.google.com/file/d/${projectId}-edit-${ch}-${l}`,
              subtitleUrl: `https://drive.google.com/file/d/${projectId}-sub-${ch}-${l}.srt`,
              reviewUrl: `https://backoffice.example.com/${projectId}/review/${ch}-${l}`,
            }
          : {}),
      });
    }
  });
  return lectures;
}

const proj2Lectures = createLectures("proj-2", [2.0, 2.5, 2.0, 2.5, 2.0], 2);
// 1장 자막: 1강만 업로드 (2강은 아직) → 50%
proj2Lectures
  .filter((l) => l.chapter === 1)
  .forEach((l, i) => {
    if (i === 0)
      l.subtitleUrl = `https://drive.google.com/file/d/proj-2-sub-1-1.srt`;
  });
// 3장 편집: 1강만 업로드 (2강은 아직) → 50%
proj2Lectures
  .filter((l) => l.chapter === 3)
  .forEach((l, i) => {
    if (i === 0)
      l.editedVideoUrl = `https://drive.google.com/file/d/proj-2-edit-3-1.mp4`;
  });

function makePmReview(scores: number[]): VideoReview {
  const qIds = ["pm-q1", "pm-q2", "pm-q3", "pm-q4", "pm-q5", "pm-q6"];
  return {
    reviewer: "pm",
    scores: qIds.map((id, i) => ({
      questionId: id,
      score: scores[i],
      comment: "",
    })),
    averageScore: +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(
      1,
    ),
    completedAt: "2026-03-05T14:00:00Z",
  };
}

function makeCmReview(scores: number[]): VideoReview {
  const qIds = ["cm-q1", "cm-q2", "cm-q3", "cm-q4", "cm-q5", "cm-q6"];
  return {
    reviewer: "cm",
    scores: qIds.map((id, i) => ({
      questionId: id,
      score: scores[i],
      comment: "",
    })),
    averageScore: +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(
      1,
    ),
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
    feedbackText:
      "전반적으로 의도한 내용과 영상 퀄리티가 충분히 확보되어 승인 가능합니다.",
  },
  {
    id: "fb-2",
    lectureId: "proj-2-lec-1-2",
    pmReview: makePmReview([3, 3, 4, 3, 3, 4]),
    cmReview: makeCmReview([4, 3, 3, 3, 4, 3]),
    verdict: "보완",
    feedbackText:
      "핵심 방향은 적절하나 일부 보완이 필요하여 수정 후 재검토가 필요합니다.",
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
    productionType: "리뉴얼",
    rolloutDate: "2026-01-15",
    paymentDate: "2026-02-15",
    chapterCount: 4,
    chapterDurations: [1.5, 2.0, 1.5, 2.0],
    chapterTitles: [
      "객체 지향 프로그래밍",
      "상속과 다형성",
      "디자인 패턴 입문",
      "디자인 패턴 활용",
    ],
    tutor: "구민정",
    curriculumManager: "한지민",
    slackChannel: "#courseflow-webdev-v2",
    driveLink: "https://drive.google.com/drive/folders/proj1",
    lessonPlanLink: "https://docs.google.com/document/d/proj1-lesson",
    backofficeLink: "https://backoffice.example.com/proj-1",
    trafficLight: "green",
    tasks: project1Tasks,
    lectures: createLectures("proj-1", [1.5, 2.0, 1.5, 2.0], 4),
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
    rolloutDate: "2026-04-20",
    paymentDate: "2026-04-20",
    chapterCount: 5,
    chapterDurations: [2.0, 2.5, 2.0, 2.5, 2.0],
    chapterTitles: [
      "실시간 통신 기초",
      "Socket.IO 심화",
      "채팅방 구현",
      "스케일링 전략",
      "배포와 운영",
    ],
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
    status: "편집·검수",
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
    lectures: createLectures("proj-3", [2.5, 3.0, 2.5], 3),
    videoFeedbacks: [],
    note: "자막 작업 진행 중, 롤아웃 D-7",
    createdAt: "2025-12-01T09:00:00Z",
  },
  {
    id: "proj-4",
    title: "비전공자를 위한 데이터 분석",
    version: "v1.0",
    status: "교안",
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
    id: "proj-6",
    title: "마케팅 실무의 이해",
    version: "v1.0",
    status: "롤아웃",
    businessUnit: "KDT",
    trackName: "디지털 마케터",
    productionType: "리뉴얼",
    rolloutDate: "2026-03-27",
    paymentDate: "2026-04-27",
    chapterCount: 3,
    chapterDurations: [2.0, 2.0, 2.0],
    tutor: "김선우",
    slackChannel: "#courseflow-marketing",
    trafficLight: "green",
    tasks: project6Tasks,
    lectures: createLectures("proj-6", [2.0, 2.0, 2.0], 3),
    videoFeedbacks: [],
    createdAt: "2025-12-01T09:00:00Z",
  },
  {
    id: "proj-5",
    title: "시니어를 위한 AI 활용법",
    version: "v1.0",
    status: "기획",
    businessUnit: "기타",
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
  {
    id: "proj-7",
    title: "파이썬으로 배우는 자동화 업무",
    version: "v1.0",
    status: "편집·검수",
    businessUnit: "KDC",
    productionType: "신규",
    rolloutDate: "2026-05-10",
    paymentDate: "2026-06-10",
    chapterCount: 7,
    chapterDurations: [2.0, 2.0, 2.0, 2.0, 1.5, 2.0, 1.5],
    chapterTitles: [
      "파이썬 기초와 환경설정",
      "파일 자동화",
      "웹 크롤링",
      "엑셀 자동화",
      "이메일 자동화",
      "업무 스케줄링",
      "종합 프로젝트",
    ],
    tutor: "이현우",
    curriculumManager: "김민지",
    editor: "정민호",
    slackChannel: "#courseflow-python-auto",
    trafficLight: "green",
    tasks: createChapterTasks("proj-7", 7, (ch, type) => {
      if (ch === 0) return type === "커리큘럼 기획" ? "완료" : "대기";
      // 1~2장: 전부 완료
      if (ch <= 2) return "완료";
      // 3장: 검수 진행
      if (ch === 3) {
        const idx = TASK_TYPES_PER_CHAPTER.indexOf(type);
        if (idx <= 3) return "완료";
        if (idx === 4) return "진행";
        return "대기";
      }
      // 4장: 편집 진행
      if (ch === 4) {
        if (type === "교안제작" || type === "촬영") return "완료";
        if (type === "편집") return "진행";
        return "대기";
      }
      // 5장: 촬영 진행
      if (ch === 5) {
        if (type === "교안제작") return "완료";
        if (type === "촬영") return "진행";
        return "대기";
      }
      // 6장: 교안 진행
      if (ch === 6) {
        if (type === "교안제작") return "진행";
        return "대기";
      }
      // 7장: 대기
      return "대기";
    }),
    lectures: createLectures("proj-7", [2.0, 2.0, 2.0, 2.0, 1.5, 2.0, 1.5]),
    videoFeedbacks: [],
    createdAt: "2026-02-01T09:00:00Z",
  },
  {
    id: "proj-8",
    title: "엑셀 없이 구글 스프레드시트 마스터",
    version: "v2.0",
    status: "편집·검수",
    businessUnit: "KDC",
    productionType: "리뉴얼",
    rolloutDate: "2026-04-15",
    paymentDate: "2026-05-15",
    chapterCount: 3,
    chapterDurations: [1.5, 2.0, 1.5],
    tutor: "최유진",
    curriculumManager: "박현아",
    editor: "정민호",
    slackChannel: "#courseflow-sheets",
    trafficLight: "yellow",
    tasks: createChapterTasks("proj-8", 3, (ch, type) => {
      if (ch === 0) return type === "커리큘럼 기획" ? "완료" : "대기";
      if (type === "교안제작" || type === "촬영") return "완료";
      if (type === "편집") return ch <= 2 ? "완료" : "진행";
      return "대기";
    }),
    lectures: createLectures("proj-8", [1.5, 2.0, 1.5]),
    videoFeedbacks: [],
    createdAt: "2026-01-15T09:00:00Z",
  },
  {
    id: "proj-9",
    title: "SQL 입문부터 실전까지",
    version: "v1.0",
    status: "편집·검수",
    businessUnit: "KDT",
    trackName: "백엔드",
    productionType: "신규",
    rolloutDate: "2026-04-01",
    paymentDate: "2026-05-01",
    chapterCount: 4,
    chapterDurations: [2.0, 2.5, 2.0, 2.0],
    tutor: "강동훈",
    curriculumManager: "이소영",
    editor: "김태준",
    reviewer: "박민서",
    slackChannel: "#courseflow-sql",
    trafficLight: "yellow",
    tasks: createChapterTasks("proj-9", 4, (ch, type) => {
      if (ch === 0) return type === "커리큘럼 기획" ? "완료" : "대기";
      if (
        type === "교안제작" ||
        type === "촬영" ||
        type === "편집" ||
        type === "자막"
      )
        return "완료";
      if (type === "검수") return ch <= 2 ? "완료" : "진행";
      return "대기";
    }),
    lectures: createLectures("proj-9", [2.0, 2.5, 2.0, 2.0]),
    videoFeedbacks: [],
    createdAt: "2026-01-01T09:00:00Z",
  },
  {
    id: "proj-10",
    title: "풀스택 프로젝트로 배우는 Next.js",
    version: "v1.0",
    status: "편집·검수",
    businessUnit: "KDT",
    trackName: "커머스 Spring",
    productionType: "신규",
    rolloutDate: "2026-04-25",
    paymentDate: "2026-05-25",
    chapterCount: 5,
    chapterDurations: [2.0, 2.5, 2.0, 2.5, 2.0],
    tutor: "오승환",
    curriculumManager: "이수빈",
    editor: "김하늘",
    reviewer: "정예린",
    slackChannel: "#courseflow-nextjs",
    trafficLight: "yellow",
    tasks: createChapterTasks("proj-10", 5, (ch, type) => {
      if (ch === 0) return type === "커리큘럼 기획" ? "완료" : "대기";
      if (ch === 1) return "완료";
      if (ch === 2) {
        if (type === "교안제작" || type === "촬영" || type === "편집")
          return "완료";
        if (type === "자막") return "진행";
        return "대기";
      }
      if (ch === 3) {
        if (type === "교안제작") return "완료";
        if (type === "촬영") return "진행";
        return "대기";
      }
      if (ch === 4) {
        if (type === "교안제작") return "진행";
        return "대기";
      }
      return "대기";
    }),
    lectures: createLectures("proj-10", [2.0, 2.5, 2.0, 2.5, 2.0]),
    videoFeedbacks: [],
    createdAt: "2026-02-10T09:00:00Z",
  },
  {
    id: "proj-11",
    title: "AI 서비스 기획부터 배포까지 완전 정복",
    version: "v1.0",
    status: "편집·검수",
    businessUnit: "KDT",
    trackName: "AI",
    productionType: "신규",
    rolloutDate: "2026-05-20",
    paymentDate: "2026-06-20",
    chapterCount: 10,
    chapterDurations: [2.0, 1.5, 2.5, 2.0, 1.5, 2.0, 2.5, 2.0, 1.5, 2.0],
    chapterTitles: [
      "AI 서비스 기획",
      "데이터 수집과 전처리",
      "모델 선정과 학습",
      "프롬프트 엔지니어링",
      "API 설계와 구현",
      "프론트엔드 연동",
      "테스트와 품질 관리",
      "배포 파이프라인",
      "모니터링과 운영",
      "비용 최적화와 스케일링",
    ],
    tutor: "김선용",
    curriculumManager: "이소영",
    editor: "강태경",
    reviewer: "박민서",
    slackChannel: "#courseflow-ai-fullstack",
    trafficLight: "yellow",
    tasks: createChapterTasks(
      "proj-11",
      10,
      (ch, type) => {
        if (ch === 0) return type === "커리큘럼 기획" ? "완료" : "대기";
        // 전체 장: 교안~편집 완료, 자막 진행
        const idx = TASK_TYPES_PER_CHAPTER.indexOf(type);
        if (idx <= 2) return "완료"; // 교안, 촬영, 편집
        if (idx === 3) return "진행"; // 자막
        return "대기"; // 검수, 승인
      },
      (ch, type) => {
        if (ch === 0) return type === "커리큘럼 기획" ? "이소영" : undefined;
        if (type === "편집") return "강태경";
        if (type === "검수") return "박민서";
        return undefined;
      },
      (ch, type) => {
        if (ch === 0)
          return type === "커리큘럼 기획"
            ? { start: "2026-01-15", end: "2026-01-20" }
            : {};
        const idx = TASK_TYPES_PER_CHAPTER.indexOf(type);
        const baseWeek = Math.ceil(ch / 2);
        const startDay = 5 + baseWeek * 7 + idx * 3;
        const s = `2026-03-${String(Math.min(28, startDay)).padStart(2, "0")}`;
        const e = `2026-03-${String(Math.min(28, startDay + 2)).padStart(2, "0")}`;
        if (ch <= 5 && idx <= 3) return { start: s, end: e };
        if (ch <= 7 && idx <= 2) return { start: s, end: e };
        if (ch === 8 && idx <= 1)
          return { start: "2026-04-06", end: "2026-04-10" };
        if (ch === 9 && idx === 0)
          return { start: "2026-04-08", end: "2026-04-15" };
        return {};
      },
    ),
    lectures: createLectures(
      "proj-11",
      [2.0, 1.5, 2.5, 2.0, 1.5, 2.0, 2.5, 2.0, 1.5, 2.0],
      3,
    ),
    videoFeedbacks: [],
    createdAt: "2026-01-10T09:00:00Z",
  },
];
