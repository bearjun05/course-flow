"use client";

import { useParams } from "next/navigation";
import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { mockProjects } from "@/lib/mock-data";
import type { ChapterTask, ProjectStatus, TrafficLight } from "@/lib/types";
import DetailHeader from "@/components/detail/detail-header";
import InfoGuideTab from "@/components/detail/info-guide-tab";
import MondayBoard from "@/components/detail/monday-board";

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

  const project = useMemo(() => {
    if (!baseProject) return null;
    return { ...baseProject, tasks, status, trafficLight };
  }, [baseProject, tasks, status, trafficLight]);

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
    <div className="min-h-screen bg-background">
      <DetailHeader project={project} activeTab="info" />

      <div className="px-6 py-5 space-y-5">
        {/* 강의 정보 카드 그리드 */}
        <InfoGuideTab
          project={project}
          onStatusChange={setStatus}
          onTrafficLightChange={setTrafficLight}
        />

        {/* 제작 일정 보드 */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">
            제작 일정
          </h2>
          <MondayBoard tasks={tasks} onTasksChange={handleTasksChange} />
        </div>
      </div>
    </div>
  );
}
