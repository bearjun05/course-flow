import { describe, it, expect } from "vitest";
import { setLectureField } from "../process-helpers";
import type { Lecture } from "../types";

function lec(over: Partial<Lecture>): Lecture {
  return {
    id: "l1",
    projectId: "p",
    chapter: 1,
    lectureNumber: 1,
    label: "1-1",
    videoUrls: [],
    ...over,
  };
}

describe("T-C1: 교안 링크 등록/교체/삭제 (setLectureField)", () => {
  const lectures = [
    lec({ id: "l1" }),
    lec({ id: "l2", lessonPlanUrl: "https://old" }),
  ];

  it("등록: 빈 강에 링크 설정", () => {
    const r = setLectureField(lectures, "l1", "lessonPlanUrl", "https://new");
    expect(r.find((l) => l.id === "l1")!.lessonPlanUrl).toBe("https://new");
  });

  it("교체: 기존 링크를 새 링크로", () => {
    const r = setLectureField(lectures, "l2", "lessonPlanUrl", "https://new2");
    expect(r.find((l) => l.id === "l2")!.lessonPlanUrl).toBe("https://new2");
  });

  it("삭제: 빈 문자열로 비움", () => {
    const r = setLectureField(lectures, "l2", "lessonPlanUrl", "");
    expect(r.find((l) => l.id === "l2")!.lessonPlanUrl).toBe("");
  });

  it("다른 강·원본은 변경하지 않음 (불변)", () => {
    const r = setLectureField(lectures, "l1", "lessonPlanUrl", "https://x");
    expect(r.find((l) => l.id === "l2")!.lessonPlanUrl).toBe("https://old");
    expect(r).not.toBe(lectures);
  });
});
