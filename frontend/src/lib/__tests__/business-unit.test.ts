import { describe, it, expect } from "vitest";
import type { BusinessUnit } from "../types";
import {
  BUSINESS_UNITS,
  tracksFor,
  AI_CAMPUS_TRACKS,
  KDT_TRACKS,
} from "../constants";

// 컴파일 타임 가드: BusinessUnit 유니온의 모든 값을 키로 가져야 한다.
// 타입에 사업부를 추가하고 여기를 안 고치면 tsc(typecheck)가 컴파일 에러로 잡는다.
const ALL_UNITS: Record<BusinessUnit, true> = {
  KDT: true,
  KDC: true,
  "AI 캠퍼스": true,
  기타: true,
};

describe("T-A1: 사업부 상수 ↔ 타입 일치 (회귀 R1 방지)", () => {
  it("BUSINESS_UNITS가 BusinessUnit 전체와 정확히 일치", () => {
    // 타입에만 추가하고 배열을 안 고치면(또는 그 반대) 여기서 실패
    expect([...BUSINESS_UNITS].sort()).toEqual(Object.keys(ALL_UNITS).sort());
  });

  it("AI 캠퍼스가 선택지에 존재", () => {
    expect(BUSINESS_UNITS).toContain("AI 캠퍼스");
  });
});

describe("T-A2: tracksFor (사업부별 트랙 분기)", () => {
  it("KDT → KDT_TRACKS", () => {
    expect(tracksFor("KDT")).toEqual(KDT_TRACKS);
  });
  it("AI 캠퍼스 → AI_CAMPUS_TRACKS", () => {
    expect(tracksFor("AI 캠퍼스")).toEqual(AI_CAMPUS_TRACKS);
  });
  it("KDC → 트랙 없음", () => {
    expect(tracksFor("KDC")).toEqual([]);
  });
  it("기타 → 트랙 없음", () => {
    expect(tracksFor("기타")).toEqual([]);
  });
});
