"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useMemo } from "react";
import Link from "next/link";
import { CalendarDays, ClipboardList, Calendar } from "lucide-react";
import { mockProjects } from "@/lib/mock-data";
import DetailHeader from "@/components/detail/detail-header";
import InfoGuideTab from "@/components/detail/info-guide-tab";
import MondayBoard from "@/components/detail/monday-board";
import WorkStatusTab from "@/components/detail/work-status-tab";
import WeeklyCalendar from "@/components/detail/weekly-calendar";
import { Separator } from "@/components/ui/separator";

type ScheduleTab = "work-status" | "schedule" | "calendar";

export default function EduworksDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const projectId = params.id;
  const person = searchParams.get("person") ?? "";

  const baseProject = useMemo(
    () => mockProjects.find((p) => p.id === projectId) ?? null,
    [projectId],
  );

  const [tasks] = useState(baseProject?.tasks ?? []);
  const [lectures, setLectures] = useState(baseProject?.lectures ?? []);

  const project = useMemo(() => {
    if (!baseProject) return null;
    return { ...baseProject, tasks, lectures };
  }, [baseProject, tasks, lectures]);

  // 검수자만 검수 토글 가능
  const isReviewer = person !== "" && person === project?.reviewer;

  const handleReviewToggle = (lectureId: string, reviewed: boolean) => {
    setLectures((prev) =>
      prev.map((l) => (l.id === lectureId ? { ...l, reviewed } : l)),
    );
  };

  const [scheduleTab, setScheduleTab] = useState<ScheduleTab>("work-status");
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
        <InfoGuideTab project={project} readOnly />

        <Separator />

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
            <WorkStatusTab
              tasks={project.tasks}
              lectures={project.lectures}
              chapterCount={project.chapterCount}
              chapterTitles={project.chapterTitles}
              chapterDriveLinks={project.chapterDriveLinks}
              planningComplete={true}
              onReviewToggle={isReviewer ? handleReviewToggle : undefined}
            />
          )}
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
        </section>
      </div>
    </div>
  );
}
