"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { CalendarDays, ClipboardList, Calendar, Upload } from "lucide-react";
import { mockProjects } from "@/lib/mock-data";
import DetailHeader from "@/components/detail/detail-header";
import InfoGuideTab from "@/components/detail/info-guide-tab";
import MondayBoard from "@/components/detail/monday-board";
import UploadTab from "@/components/detail/upload-tab";
import WeeklyCalendar from "@/components/detail/weekly-calendar";
import { Separator } from "@/components/ui/separator";

type ScheduleTab = "schedule" | "calendar" | "upload";

export default function EduworksDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const projectId = params.id;
  const person = searchParams.get("person") ?? "";

  const baseProject = useMemo(
    () => mockProjects.find((p) => p.id === projectId) ?? null,
    [projectId],
  );

  const [tasks, setTasks] = useState(baseProject?.tasks ?? []);
  const [lectures, setLectures] = useState(baseProject?.lectures ?? []);

  const project = useMemo(() => {
    if (!baseProject) return null;
    return { ...baseProject, tasks, lectures };
  }, [baseProject, tasks, lectures]);

  const handleTaskStatusChange = (
    chapter: number,
    taskType: string,
    newStatus: "대기" | "진행" | "리뷰" | "완료",
  ) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.chapter === chapter && t.taskType === taskType
          ? { ...t, status: newStatus }
          : t,
      ),
    );
  };

  const handleLectureUrlChange = (
    lectureId: string,
    field: string,
    url: string,
  ) => {
    setLectures((prev) =>
      prev.map((l) => (l.id === lectureId ? { ...l, [field]: url } : l)),
    );
  };

  const tabParam = searchParams.get("tab");
  const defaultTab: ScheduleTab =
    tabParam === "work-status" || tabParam === "upload" ? "upload" : "schedule";
  const [scheduleTab, setScheduleTab] = useState<ScheduleTab>(defaultTab);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
  });

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-sm text-muted-foreground">
        <p>프로젝트를 찾을 수 없습니다.</p>
        <Link
          href="/eduworks"
          className="mt-3 text-primary hover:underline text-sm"
        >
          에듀웍스로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DetailHeader project={project} backHref="/eduworks" />

      <div className="space-y-6 px-6 py-6">
        <InfoGuideTab project={project} />

        <Separator />

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
                이번 주
              </button>
              <button
                onClick={() => setScheduleTab("upload")}
                className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium transition-colors ${
                  scheduleTab === "upload"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                결과물 제출
              </button>
            </div>
          </div>

          {scheduleTab === "schedule" && (
            <MondayBoard
              tasks={project.tasks}
              onTasksChange={() => {}}
              projectStartDate={project.createdAt}
              paymentDate={project.paymentDate}
              tutor={project.tutor}
              pm="박진영"
            />
          )}
          {scheduleTab === "calendar" && (
            <WeeklyCalendar
              tasks={project.tasks}
              lectures={project.lectures}
              weekStart={weekStart}
              onWeekChange={setWeekStart}
              projectStartDate={project.createdAt}
              paymentDate={project.paymentDate}
              tutor={project.tutor}
              pm="박진영"
            />
          )}
          {scheduleTab === "upload" && (
            <UploadTab
              project={project}
              person={person}
              onTaskStatusChange={handleTaskStatusChange}
              onLectureUrlChange={handleLectureUrlChange}
            />
          )}
        </section>
      </div>
    </div>
  );
}
