"use client";

import { useParams } from "next/navigation";
import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { CalendarDays, ClipboardList, Calendar } from "lucide-react";
import { mockProjects } from "@/lib/mock-data";
import type {
  ChapterTask,
  ProjectStatus,
  TrafficLight,
  TaskType,
  Lecture,
  Project,
} from "@/lib/types";
import DetailHeader from "@/components/detail/detail-header";
import InfoGuideTab from "@/components/detail/info-guide-tab";
import MondayBoard from "@/components/detail/monday-board";
import WorkStatusTab from "@/components/detail/work-status-tab";
import WeeklyCalendar from "@/components/detail/weekly-calendar";
import { TaskCalendar } from "@/components/dashboard/task-calendar";
import { Separator } from "@/components/ui/separator";

type ScheduleTab = "schedule" | "calendar" | "work-status";

/**
 * 프로젝트 상세 페이지에서 편집 가능한 필드들을 하나의 객체로 묶음.
 * 원래 19개의 개별 useState였으나, 단일 state + patch 헬퍼로 통합.
 * UI 전용 state(scheduleTab, weekStart)는 별도 useState 유지.
 */
interface ProjectDraft {
  title: string;
  pm: string;
  tutor: string;
  editor: string;
  subtitleEditor: string;
  reviewer: string;
  curriculumManager: string;
  tasks: ChapterTask[];
  status: ProjectStatus;
  trafficLight: TrafficLight;
  rolloutDate: string;
  paymentDate: string;
  chapterDurations: number[];
  note: string;
  slackChannel: string;
  slackChannelId: string;
  projectLectures: Lecture[];
  planningComplete: boolean;
  lessonPlanLink: string;
  chapterTitles: string[];
  chapterDriveLinks: string[];
}

function initFromBase(base?: Project): ProjectDraft {
  return {
    title: base?.title ?? "",
    pm: base?.pm ?? "",
    tutor: base?.tutor ?? "",
    editor: base?.editor ?? "",
    subtitleEditor: base?.subtitleEditor ?? "",
    reviewer: base?.reviewer ?? "",
    curriculumManager: base?.curriculumManager ?? "",
    tasks: base?.tasks ?? [],
    status: base?.status ?? "기획",
    trafficLight: base?.trafficLight ?? "green",
    rolloutDate: base?.rolloutDate ?? "",
    paymentDate: base?.paymentDate ?? "",
    chapterDurations: base?.chapterDurations ?? [],
    note: base?.note ?? "",
    slackChannel: base?.slackChannel ?? "",
    slackChannelId: base?.slackChannelId ?? "",
    projectLectures: base?.lectures ?? [],
    planningComplete: base?.status !== "기획",
    lessonPlanLink: base?.lessonPlanLink ?? "",
    chapterTitles: base?.chapterTitles ?? [],
    chapterDriveLinks: base?.chapterDriveLinks ?? [],
  };
}

const TASK_TYPES_ON_PLANNING: TaskType[] = [
  "교안제작",
  "촬영",
  "편집",
  "자막",
  "검수",
  "승인",
];

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const baseProject = useMemo(
    () => mockProjects.find((p) => p.id === projectId),
    [projectId],
  );

  const [draft, setDraft] = useState<ProjectDraft>(() =>
    initFromBase(baseProject),
  );
  const patch = useCallback((p: Partial<ProjectDraft>) => {
    setDraft((d) => ({ ...d, ...p }));
  }, []);

  const [scheduleTab, setScheduleTab] = useState<ScheduleTab>("work-status");
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
  });

  const project = useMemo(() => {
    if (!baseProject) return null;
    return {
      ...baseProject,
      title: draft.title,
      pm: draft.pm || undefined,
      tutor: draft.tutor || undefined,
      editor: draft.editor || undefined,
      subtitleEditor: draft.subtitleEditor || undefined,
      reviewer: draft.reviewer || undefined,
      curriculumManager: draft.curriculumManager || undefined,
      tasks: draft.tasks,
      status: draft.status,
      trafficLight: draft.trafficLight,
      rolloutDate: draft.rolloutDate,
      paymentDate: draft.paymentDate,
      chapterDurations: draft.chapterDurations,
      chapterCount: draft.chapterDurations.length,
      chapterTitles: draft.chapterTitles,
      chapterDriveLinks: draft.chapterDriveLinks,
      note: draft.note,
      slackChannel: draft.slackChannel || undefined,
      slackChannelId: draft.slackChannelId || undefined,
      lessonPlanLink: draft.lessonPlanLink || undefined,
      lectures: draft.projectLectures,
    };
  }, [baseProject, draft]);

  const handleTasksChange = useCallback(
    (newTasks: ChapterTask[]) => {
      patch({ tasks: newTasks });
    },
    [patch],
  );

  const handleLectureUrlChange = useCallback(
    (lectureId: string, field: string, url: string) => {
      setDraft((d) => ({
        ...d,
        projectLectures: d.projectLectures.map((l) =>
          l.id === lectureId ? { ...l, [field]: url } : l,
        ),
      }));
    },
    [],
  );

  const handleAddChapter = useCallback(() => {
    setDraft((d) => {
      const maxChapter = d.tasks.reduce(
        (max, t) => Math.max(max, t.chapter),
        0,
      );
      const newCh = maxChapter + 1;
      const newTasks: ChapterTask[] = TASK_TYPES_ON_PLANNING.map(
        (taskType) => ({
          id: `${projectId}-c${newCh}-${taskType}`,
          projectId: projectId!,
          chapter: newCh,
          taskType,
          status: "대기" as const,
        }),
      );
      return {
        ...d,
        tasks: [...d.tasks, ...newTasks],
        chapterDurations: [...d.chapterDurations, 0],
      };
    });
  }, [projectId]);

  const handleDeleteChapter = useCallback((chapter: number) => {
    setDraft((d) => {
      const filtered = d.tasks.filter((t) => t.chapter !== chapter);
      const shifted = filtered.map((t) =>
        t.chapter > chapter ? { ...t, chapter: t.chapter - 1 } : t,
      );
      const nextDurations = [...d.chapterDurations];
      nextDurations.splice(chapter - 1, 1);
      return { ...d, tasks: shifted, chapterDurations: nextDurations };
    });
  }, []);

  const handlePlanningComplete = useCallback(
    (data: {
      chapters: {
        title: string;
        duration: number;
        lectures: { title: string }[];
      }[];
      curriculumLink: string;
    }) => {
      const newTasks: ChapterTask[] = [];
      const newLectures: Lecture[] = [];
      data.chapters.forEach((chData, idx) => {
        const ch = idx + 1;
        TASK_TYPES_ON_PLANNING.forEach((taskType) => {
          newTasks.push({
            id: `${projectId}-c${ch}-${taskType}`,
            projectId: projectId!,
            chapter: ch,
            taskType,
            status: "대기" as const,
          });
        });
        chData.lectures.forEach((lec, li) => {
          const lectureNumber = li + 1;
          newLectures.push({
            id: `${projectId}-lec-${ch}-${lectureNumber}`,
            projectId: projectId!,
            chapter: ch,
            lectureNumber,
            label: `${ch}-${lectureNumber}`,
            title: lec.title,
            videoUrls: [],
          });
        });
      });
      // TODO(백엔드 연결): 실제 Google Drive API로 폴더 생성 후 링크 반환
      const driveLinks = data.chapters.map(
        (c, idx) =>
          `https://drive.google.com/drive/folders/${projectId}-ch${idx + 1}-${encodeURIComponent(c.title)}`,
      );
      patch({
        lessonPlanLink: data.curriculumLink,
        tasks: newTasks,
        projectLectures: newLectures,
        chapterDurations: data.chapters.map((c) => c.duration),
        chapterTitles: data.chapters.map((c) => c.title),
        chapterDriveLinks: driveLinks,
        planningComplete: true,
      });
    },
    [projectId, patch],
  );

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-sm text-muted-foreground">
        <p>프로젝트를 찾을 수 없습니다.</p>
        <Link href="/" className="mt-3 text-primary hover:underline text-sm">
          대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DetailHeader
        project={project}
        onTrafficLightChange={(v) => patch({ trafficLight: v })}
        onTitleChange={(v) => patch({ title: v })}
        otherVersions={mockProjects
          .filter((p) => p.title === project.title && p.id !== project.id)
          .map((p) => ({ id: p.id, version: p.version, status: p.status }))}
      />

      <div className="space-y-6 px-6 py-6">
        {/* 강의 핵심 지표 + 상세 */}
        <InfoGuideTab
          project={project}
          onStatusChange={(v) => patch({ status: v })}
          onRolloutDateChange={(v) => patch({ rolloutDate: v })}
          onPaymentDateChange={(v) => patch({ paymentDate: v })}
          onChapterDurationsChange={(v) => patch({ chapterDurations: v })}
          onNoteChange={(v) => patch({ note: v })}
          onSlackChange={(ch, id) =>
            patch({ slackChannel: ch, slackChannelId: id })
          }
          onAssigneeChange={(role, value) => {
            // role 이름과 draft 키가 동일하므로 dynamic key로 바로 patch
            patch({ [role]: value } as Partial<ProjectDraft>);
          }}
        />

        <Separator />

        {/* 제작 일정 보드 */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 bg-muted/30">
              <button
                onClick={() => setScheduleTab("work-status")}
                className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium transition-colors ${
                  scheduleTab === "work-status"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ClipboardList className="h-3.5 w-3.5" />
                작업 현황
              </button>
              <button
                onClick={() => setScheduleTab("schedule")}
                className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium transition-colors ${
                  scheduleTab === "schedule"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                일정
              </button>
              <button
                onClick={() => setScheduleTab("calendar")}
                className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium transition-colors ${
                  scheduleTab === "calendar"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                이번 주
              </button>
            </div>
          </div>

          {scheduleTab === "work-status" && (
            <div className="space-y-6">
              <WorkStatusTab
                tasks={draft.tasks}
                lectures={draft.projectLectures}
                chapterCount={project.chapterCount}
                chapterTitles={project.chapterTitles}
                chapterDriveLinks={project.chapterDriveLinks}
                planningComplete={draft.planningComplete}
                onPlanningComplete={handlePlanningComplete}
                onAddChapter={handleAddChapter}
                onReviewToggle={(lectureId, reviewed) =>
                  setDraft((d) => ({
                    ...d,
                    projectLectures: d.projectLectures.map((l) =>
                      l.id === lectureId ? { ...l, reviewed } : l,
                    ),
                  }))
                }
                onApprovalToggle={(lectureId, approved) =>
                  setDraft((d) => ({
                    ...d,
                    projectLectures: d.projectLectures.map((l) =>
                      l.id === lectureId ? { ...l, approved } : l,
                    ),
                  }))
                }
                onLectureUrlChange={handleLectureUrlChange}
              />
              <TaskCalendar projects={[project]} basePath="/projects" />
            </div>
          )}
          {scheduleTab === "schedule" && (
            <MondayBoard
              tasks={draft.tasks}
              onTasksChange={handleTasksChange}
              onAddChapter={handleAddChapter}
              onDeleteChapter={handleDeleteChapter}
              projectStartDate={project.createdAt}
              paymentDate={project.paymentDate}
              tutor={project.tutor}
              pm={project.pm}
            />
          )}
          {scheduleTab === "calendar" && (
            <WeeklyCalendar
              tasks={draft.tasks}
              lectures={project.lectures}
              weekStart={weekStart}
              onWeekChange={setWeekStart}
              projectStartDate={project.createdAt}
              paymentDate={project.paymentDate}
              tutor={project.tutor}
              pm={project.pm}
              onTaskToggle={(taskId) => {
                setDraft((d) => ({
                  ...d,
                  tasks: d.tasks.map((t) =>
                    t.id === taskId
                      ? { ...t, status: t.status === "완료" ? "진행" : "완료" }
                      : t,
                  ),
                }));
              }}
            />
          )}
        </section>
      </div>
    </div>
  );
}
