import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getDday,
  formatDday,
  getDdayGroupLabel,
  getProgressPercent,
} from "../utils";
import type { ChapterTask } from "../types";

// 스모크 테스트: 테스트 토대(vitest)가 정상 동작하는지 + 기존 순수 함수 회귀 방지
describe("utils (스모크)", () => {
  describe("getDday", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-08T09:00:00"));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("오늘이면 0", () => {
      expect(getDday("2026-06-08")).toBe(0);
    });
    it("3일 후면 3", () => {
      expect(getDday("2026-06-11")).toBe(3);
    });
    it("지난 날짜면 음수", () => {
      expect(getDday("2026-06-01")).toBe(-7);
    });
  });

  describe("formatDday", () => {
    it("0 → D-Day", () => expect(formatDday(0)).toBe("D-Day"));
    it("양수 → D-n", () => expect(formatDday(5)).toBe("D-5"));
    it("음수 → D+n", () => expect(formatDday(-3)).toBe("D+3"));
  });

  describe("getDdayGroupLabel", () => {
    it("-1 → 마감 초과", () => expect(getDdayGroupLabel(-1)).toBe("마감 초과"));
    it("0 → D-Day", () => expect(getDdayGroupLabel(0)).toBe("D-Day"));
    it("7 → 1주 이내", () => expect(getDdayGroupLabel(7)).toBe("1주 이내"));
  });

  describe("getProgressPercent", () => {
    it("빈 배열 → 0", () => expect(getProgressPercent([])).toBe(0));
    it("절반 완료 → 50", () => {
      const tasks = [{ status: "완료" }, { status: "진행" }] as ChapterTask[];
      expect(getProgressPercent(tasks)).toBe(50);
    });
  });
});
