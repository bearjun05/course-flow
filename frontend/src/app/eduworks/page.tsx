"use client";

import { useState, useMemo } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { SummaryMetrics } from "@/components/dashboard/summary-metrics";
import { ProgressTable } from "@/components/dashboard/progress-table/progress-table";
import { TaskCalendar } from "@/components/dashboard/task-calendar";
import { Separator } from "@/components/ui/separator";
import { mockProjects } from "@/lib/mock-data";
import type { Project } from "@/lib/types";
import { BadgeThemeProvider } from "@/lib/badge-theme";

/** 프로젝트에서 관련된 사람 이름을 모두 추출 */
function getPeopleFromProject(project: Project): string[] {
  const names = new Set<string>();
  if (project.tutor) names.add(project.tutor);
  if (project.editor) names.add(project.editor);
  if (project.reviewer) names.add(project.reviewer);
  if (project.curriculumManager) names.add(project.curriculumManager);
  for (const task of project.tasks) {
    if (task.assignee) names.add(task.assignee);
  }
  return Array.from(names);
}

/** 전체 프로젝트에서 고유한 사람 목록 추출 */
function getAllPeople(projects: Project[]): string[] {
  const names = new Set<string>();
  for (const p of projects) {
    for (const name of getPeopleFromProject(p)) {
      names.add(name);
    }
  }
  return Array.from(names).sort();
}

/** 선택된 사람이 담당한 프로젝트만 필터 */
function filterProjectsByPerson(
  projects: Project[],
  person: string,
): Project[] {
  return projects.filter((p) => getPeopleFromProject(p).includes(person));
}

export default function EduworksPage() {
  const allPeople = useMemo(() => getAllPeople(mockProjects), []);
  const [selectedPerson, setSelectedPerson] = useState<string>("");

  const filteredProjects = useMemo(() => {
    if (!selectedPerson) return [];
    return filterProjectsByPerson(mockProjects, selectedPerson);
  }, [selectedPerson]);

  return (
    <BadgeThemeProvider>
      <div className="min-h-screen">
        <AppHeader title="에듀웍스" showAddButton={false} />

        <div className="space-y-6 px-6 py-6">
          {/* 담당자 선택 */}
          <div className="flex items-center gap-3">
            <label
              htmlFor="person-select"
              className="text-sm font-medium text-muted-foreground whitespace-nowrap"
            >
              내 이름 선택
            </label>
            <select
              id="person-select"
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">선택해주세요</option>
              {allPeople.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {selectedPerson && (
              <span className="text-sm text-muted-foreground">
                담당 강의 {filteredProjects.length}개
              </span>
            )}
          </div>

          {!selectedPerson ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              이름을 선택하면 담당 강의를 볼 수 있습니다
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              담당한 강의가 없습니다
            </div>
          ) : (
            <>
              <SummaryMetrics projects={filteredProjects} />

              <Separator />

              <ProgressTable
                projects={filteredProjects}
                title="나의 프로젝트"
                basePath="/eduworks"
                personParam={selectedPerson}
              />

              <TaskCalendar
                projects={filteredProjects}
                selectedPerson={selectedPerson}
              />
            </>
          )}
        </div>
      </div>
    </BadgeThemeProvider>
  );
}
