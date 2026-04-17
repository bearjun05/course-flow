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
import { MOCK_CURRENT_USER, MOCK_USERS, type MockUser } from "@/lib/mock-auth";
import { isAssignedAs } from "@/lib/utils";

/**
 * 에듀웍스: 외부 관계자(튜터/편집자/자막자/검수자) 전용 페이지.
 * 커기매는 에듀옵스(`/`)를 사용하므로 여기에 포함되지 않음.
 *
 * 프로덕션에서는 로그인 정보로 사용자가 결정되지만,
 * 현재는 mock-auth.ts의 MOCK_CURRENT_USER를 기본값으로 사용하고
 * 상단에 디버그용 "다른 사용자로 보기" 드롭다운을 제공한다.
 */

/** 해당 사용자가 담당인 프로젝트 필터 (복수 담당자 지원) */
function filterProjectsForUser(projects: Project[], user: MockUser): Project[] {
  return projects.filter((p) => isAssignedAs(p, user.role, user.name));
}

const ROLE_LABEL: Record<MockUser["role"], string> = {
  tutor: "튜터",
  editor: "편집자",
  subtitleEditor: "자막자",
  reviewer: "검수자",
};

/** 역할별 담당 단계 (진척표 강조용) */
const ROLE_STAGE: Record<MockUser["role"], string> = {
  tutor: "촬영",
  editor: "편집·자막",
  subtitleEditor: "편집·자막",
  reviewer: "검수",
};

export default function EduworksPage() {
  // 프로덕션에서는 로그인 정보 기반. 현재는 mock + 디버그 드롭다운.
  const [currentUser, setCurrentUser] = useState<MockUser>(MOCK_CURRENT_USER);

  const filteredProjects = useMemo(
    () => filterProjectsForUser(mockProjects, currentUser),
    [currentUser],
  );

  return (
    <BadgeThemeProvider>
      <div className="min-h-screen">
        <AppHeader title="에듀웍스" showAddButton={false} />

        <div className="space-y-6 px-6 py-6">
          {/* 현재 로그인 사용자 + 디버그 선택 */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">안녕하세요,</p>
              <p className="text-lg font-semibold">
                {currentUser.name}{" "}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  {ROLE_LABEL[currentUser.role]}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                담당 강의 {filteredProjects.length}개
              </p>
            </div>

            {/* 디버그용 사용자 전환 — 프로덕션 시 제거 */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="mock-user-select"
                className="text-[11px] text-muted-foreground/70 whitespace-nowrap"
              >
                (디버그) 사용자 전환
              </label>
              <select
                id="mock-user-select"
                value={currentUser.name}
                onChange={(e) => {
                  const next = MOCK_USERS.find(
                    (u) => u.name === e.target.value,
                  );
                  if (next) setCurrentUser(next);
                }}
                className="rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {MOCK_USERS.map((u) => (
                  <option key={u.name} value={u.name}>
                    {u.name} ({ROLE_LABEL[u.role]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Separator />

          {filteredProjects.length === 0 ? (
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
                personParam={currentUser.name}
                highlightedStage={ROLE_STAGE[currentUser.role]}
              />

              <TaskCalendar
                projects={filteredProjects}
                selectedPerson={currentUser.name}
              />
            </>
          )}
        </div>
      </div>
    </BadgeThemeProvider>
  );
}
