"use client";

import { useParams } from "next/navigation";
import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockProjects } from "@/lib/mock-data";
import type { ChapterTask, ProjectStatus, TrafficLight } from "@/lib/types";
import DetailHeader from "@/components/detail/detail-header";
import ScheduleTaskTab from "@/components/detail/schedule-task-tab";
import InfoGuideTab from "@/components/detail/info-guide-tab";
import VideoFeedbackTab from "@/components/detail/video-feedback-tab";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const baseProject = useMemo(
    () => mockProjects.find((p) => p.id === projectId),
    [projectId]
  );

  const [tasks, setTasks] = useState<ChapterTask[]>(
    baseProject?.tasks ?? []
  );
  const [status, setStatus] = useState<ProjectStatus>(
    baseProject?.status ?? "기획"
  );
  const [trafficLight, setTrafficLight] = useState<TrafficLight>(
    baseProject?.trafficLight ?? "green"
  );
  const [activeTab, setActiveTab] = useState("info");

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
        <Link
          href="/"
          className="mt-3 text-primary hover:underline text-sm"
        >
          대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DetailHeader
        project={project}
        activeTab={activeTab}
        onStatusChange={setStatus}
        onTrafficLightChange={setTrafficLight}
      />

      <div className="px-6 py-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) => v && setActiveTab(v)}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="info">강의 정보</TabsTrigger>
            <TabsTrigger value="schedule">제작 일정</TabsTrigger>
            {/* <TabsTrigger value="feedback">영상 피드백</TabsTrigger> */}
          </TabsList>

          <TabsContent value="info">
            <InfoGuideTab project={project} />
          </TabsContent>

          <TabsContent value="schedule">
            <ScheduleTaskTab
              tasks={tasks}
              onTasksChange={handleTasksChange}
            />
          </TabsContent>

          {/* <TabsContent value="feedback">
            <VideoFeedbackTab project={project} />
          </TabsContent> */}
        </Tabs>
      </div>
    </div>
  );
}
