import { describe, it, expect } from "vitest";
import {
  getDisabledTaskTypes,
  isStageDisabled,
  getChapterFileProgress,
  getChapterDetailedStage,
  getEffectiveKanbanColumn,
} from "../process-helpers";
import { mockProjects } from "../mock-data";
import type { Project, ChapterTask } from "../types";

function makeProject(over: Partial<Project>): Project {
  return {
    id: "p",
    title: "t",
    version: "v1.0",
    status: "교안",
    businessUnit: "KDT",
    productionType: "신규",
    rolloutDate: "2026-07-01",
    paymentDate: "2026-07-01",
    chapterCount: 1,
    chapterDurations: [1],
    trafficLight: "green",
    tasks: [],
    lectures: [],
    createdAt: "2026-05-01T00:00:00Z",
    ...over,
  };
}

function task(over: Partial<ChapterTask>): ChapterTask {
  return {
    id: "x",
    projectId: "p",
    chapter: 1,
    taskType: "교안제작",
    status: "대기",
    ...over,
  };
}

describe("T-B2: 사업부 비활성 단계 판정", () => {
  it("AI 캠퍼스는 촬영·편집·자막 공정 제외", () => {
    expect(getDisabledTaskTypes("AI 캠퍼스")).toEqual(["촬영", "편집", "자막"]);
  });
  it("KDT/KDC는 제외 공정 없음", () => {
    expect(getDisabledTaskTypes("KDT")).toEqual([]);
    expect(getDisabledTaskTypes("KDC")).toEqual([]);
  });
  it("isStageDisabled: 공정 키 + 합본 키(편집·자막) 모두 처리", () => {
    expect(isStageDisabled("AI 캠퍼스", "촬영")).toBe(true);
    expect(isStageDisabled("AI 캠퍼스", "편집")).toBe(true);
    expect(isStageDisabled("AI 캠퍼스", "편집·자막")).toBe(true);
    expect(isStageDisabled("AI 캠퍼스", "교안")).toBe(false);
    expect(isStageDisabled("AI 캠퍼스", "검수")).toBe(false);
    expect(isStageDisabled("KDT", "촬영")).toBe(false);
  });
});

describe("T-B1: KDT/KDC 진행률 분모 회귀 없음", () => {
  it("KDT 장 진행률 분모는 6 그대로", () => {
    const statuses = {
      교안제작: "완료",
      촬영: "완료",
      편집: "완료",
      검수: "완료",
      승인: "완료",
    };
    const p = getChapterFileProgress(statuses, "KDT");
    expect(p.total).toBe(6); // 교안·촬영·편집·검수·승인·완료
    expect(p.completed).toBe(5); // '완료' 컬럼은 taskStatuses에 없음(기존 동작 유지)
  });
});

describe("T-B3: AI 캠퍼스 진행률 — 빠진 단계 때문에 갇히지 않음 (R2)", () => {
  it("AI 장은 분모에서 촬영·편집 제외 → 4", () => {
    const statuses = { 교안제작: "완료", 검수: "완료", 승인: "완료" };
    const p = getChapterFileProgress(statuses, "AI 캠퍼스");
    expect(p.total).toBe(4); // 교안·검수·승인·완료 (촬영·편집·자막 제외)
    expect(p.completed).toBe(3);
  });
  it("고정 6분모였다면 50%에 갇혔을 진행률이 그보다 높음", () => {
    const statuses = { 교안제작: "완료", 검수: "완료", 승인: "완료" };
    const p = getChapterFileProgress(statuses, "AI 캠퍼스");
    expect(p.completed / p.total).toBeGreaterThan(0.5);
  });
});

describe("T-B2(보강): getChapterDetailedStage가 AI에서 유효 단계만 반환 (R4)", () => {
  it("AI 챕터 단계는 촬영/편집·자막이 아님", () => {
    const ai = makeProject({
      businessUnit: "AI 캠퍼스",
      tasks: [
        task({ taskType: "교안제작", status: "완료" }),
        task({ taskType: "검수", status: "진행" }),
      ],
    });
    const stage = getChapterDetailedStage(ai, 1);
    expect(["교안", "검수", "승인", "완료"]).toContain(stage);
    expect(["촬영", "편집·자막"]).not.toContain(stage);
  });
});

describe("T-B5: AI 캠퍼스가 '진행 중인 강의' 목록에서 사라지지 않음", () => {
  it("status 교안 → 칸반 열 '교안'", () => {
    const ai = makeProject({ businessUnit: "AI 캠퍼스", status: "교안" });
    expect(getEffectiveKanbanColumn(ai)).toBe("교안");
  });
});

describe("통합: AI 캠퍼스 샘플 데이터가 분기대로 생성됨", () => {
  const sample = mockProjects.find((p) => p.id === "proj-ai-1");

  it("샘플이 존재", () => {
    expect(sample).toBeDefined();
  });
  it("촬영·편집·자막 태스크가 없음", () => {
    const types = new Set(sample!.tasks.map((t) => t.taskType));
    expect(types.has("촬영")).toBe(false);
    expect(types.has("편집")).toBe(false);
    expect(types.has("자막")).toBe(false);
    expect(types.has("교안제작")).toBe(true);
    expect(types.has("검수")).toBe(true);
  });
  it("영상·자막 결과물 링크가 없음", () => {
    const hasVideo = sample!.lectures.some(
      (l) => l.rawVideoUrl || l.editedVideoUrl || l.subtitleUrl,
    );
    expect(hasVideo).toBe(false);
  });
});
