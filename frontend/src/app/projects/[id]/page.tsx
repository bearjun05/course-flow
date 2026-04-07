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
} from "@/lib/types";
import DetailHeader from "@/components/detail/detail-header";
import InfoGuideTab from "@/components/detail/info-guide-tab";
import MondayBoard from "@/components/detail/monday-board";
import WorkStatusTab from "@/components/detail/work-status-tab";
import WeeklyCalendar from "@/components/detail/weekly-calendar";
import { Separator } from "@/components/ui/separator";

type ScheduleTab = "schedule" | "calendar" | "work-status";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const baseProject = useMemo(
    () => mockProjects.find((p) => p.id === projectId),
    [projectId],
  );

  const [tasks, setTasks] = useState<ChapterTask[]>(baseProject?.tasks ?? []);
  const [status, setStatus] = useState<ProjectStatus>(
    baseProject?.status ?? "기획",
  );
  const [trafficLight, setTrafficLight] = useState<TrafficLight>(
    baseProject?.trafficLight ?? "green",
  );
  const [rolloutDate, setRolloutDate] = useState(
    baseProject?.rolloutDate ?? "",
  );
  const [paymentDate, setPaymentDate] = useState(
    baseProject?.paymentDate ?? "",
  );
  const [chapterDurations, setChapterDurations] = useState<number[]>(
    baseProject?.chapterDurations ?? [],
  );
  const [note, setNote] = useState(baseProject?.note ?? "");
  const [scheduleTab, setScheduleTab] = useState<ScheduleTab>("schedule");
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
      tasks,
      status,
      trafficLight,
      rolloutDate,
      paymentDate,
      chapterDurations,
      note,
    };
  }, [
    baseProject,
    tasks,
    status,
    trafficLight,
    rolloutDate,
    paymentDate,
    chapterDurations,
    note,
  ]);

  const handleTasksChange = useCallback((newTasks: ChapterTask[]) => {
    setTasks(newTasks);
  }, []);

  const handleAddChapter = useCallback(() => {
    const maxChapter = tasks.reduce((max, t) => Math.max(max, t.chapter), 0);
    const newCh = maxChapter + 1;
    const taskTypes: TaskType[] = [
      "교안제작",
      "촬영",
      "편집",
      "자막",
      "검수",
      "승인",
    ];
    const newTasks: ChapterTask[] = taskTypes.map((taskType) => ({
      id: `${projectId}-c${newCh}-${taskType}`,
      projectId: projectId!,
      chapter: newCh,
      taskType,
      status: "대기" as const,
    }));
    setTasks((prev) => [...prev, ...newTasks]);
    setChapterDurations((prev) => [...prev, 0]);
  }, [tasks, projectId]);

  const handleDeleteChapter = useCallback((chapter: number) => {
    setTasks((prev) => {
      // 해당 장의 태스크 제거
      const filtered = prev.filter((t) => t.chapter !== chapter);
      // 삭제된 장보다 큰 번호를 가진 장들의 번호를 1씩 당기기
      return filtered.map((t) =>
        t.chapter > chapter ? { ...t, chapter: t.chapter - 1 } : t,
      );
    });
    setChapterDurations((prev) => {
      const next = [...prev];
      next.splice(chapter - 1, 1); // 1장 = index 0
      return next;
    });
  }, []);

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
      <DetailHeader project={project} onTrafficLightChange={setTrafficLight} />

      <div className="space-y-6 px-6 py-6">
        {/* 강의 핵심 지표 + 상세 */}
        <InfoGuideTab
          project={project}
          onStatusChange={setStatus}
          onRolloutDateChange={setRolloutDate}
          onPaymentDateChange={setPaymentDate}
          onChapterDurationsChange={setChapterDurations}
          onNoteChange={setNote}
        />

        <Separator />

        {/* 제작 일정 보드 */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 bg-muted/30">
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
                캘린더
              </button>
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
            </div>
          </div>

          {scheduleTab === "schedule" && (
            <MondayBoard
              tasks={tasks}
              onTasksChange={handleTasksChange}
              onAddChapter={handleAddChapter}
              onDeleteChapter={handleDeleteChapter}
              projectStartDate={project.createdAt}
              paymentDate={project.paymentDate}
            />
          )}
          {scheduleTab === "calendar" && (
            <WeeklyCalendar
              tasks={tasks}
              weekStart={weekStart}
              onWeekChange={setWeekStart}
              projectStartDate={project.createdAt}
              paymentDate={project.paymentDate}
              onTaskToggle={(taskId) => {
                handleTasksChange(
                  tasks.map((t) =>
                    t.id === taskId
                      ? { ...t, status: t.status === "완료" ? "진행" : "완료" }
                      : t,
                  ),
                );
              }}
            />
          )}
          {scheduleTab === "work-status" && (
            <WorkStatusTab
              tasks={tasks}
              lectures={project.lectures}
              chapterCount={project.chapterCount}
              chapterTitles={project.chapterTitles}
            />
          )}
        </section>
      </div>
    </div>
  );
}
