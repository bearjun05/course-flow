"use client";

import { useParams } from "next/navigation";
import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { CalendarDays, ClipboardList } from "lucide-react";
import { mockProjects } from "@/lib/mock-data";
import type { ChapterTask, ProjectStatus, TrafficLight } from "@/lib/types";
import DetailHeader from "@/components/detail/detail-header";
import InfoGuideTab from "@/components/detail/info-guide-tab";
import MondayBoard from "@/components/detail/monday-board";
import WorkStatusTab from "@/components/detail/work-status-tab";
import { Separator } from "@/components/ui/separator";

type ScheduleTab = "schedule" | "work-status";

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
            <h2 className="text-sm font-semibold text-foreground">제작 일정</h2>
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

          {scheduleTab === "schedule" ? (
            <MondayBoard tasks={tasks} onTasksChange={handleTasksChange} />
          ) : (
            <WorkStatusTab
              tasks={tasks}
              lectures={project.lectures}
              chapterCount={project.chapterCount}
            />
          )}
        </section>
      </div>
    </div>
  );
}
