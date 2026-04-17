/**
 * Mock 로그인 시스템
 *
 * 프로덕션에서는 실제 로그인 정보로 대체될 예정.
 * 현재는 디버그 편의를 위해 에듀웍스 페이지에서 "로그인한 사용자"로 표시할
 * mock 사용자를 여기에 정의한다.
 *
 * 에듀웍스는 외부 관계자(튜터/편집자/자막자/검수자)만 사용하므로,
 * mock 로그인도 이 역할 중 하나여야 한다.
 */

export type MockUserRole = "tutor" | "editor" | "subtitleEditor" | "reviewer";

export interface MockUser {
  name: string;
  role: MockUserRole;
}

/** 현재 로그인된 mock 사용자 (디버그 편의상 고정) */
export const MOCK_CURRENT_USER: MockUser = {
  name: "강태경",
  role: "editor",
};

/** 디버그용 선택 가능한 mock 사용자 목록 */
export const MOCK_USERS: MockUser[] = [
  { name: "김선용", role: "tutor" },
  { name: "이준혁", role: "tutor" },
  { name: "오승환", role: "tutor" },
  { name: "강태경", role: "editor" },
  { name: "김다은", role: "editor" },
  { name: "김하늘", role: "editor" },
  { name: "조현우", role: "subtitleEditor" },
  { name: "송민아", role: "subtitleEditor" },
  { name: "유재성", role: "reviewer" },
  { name: "박지훈", role: "reviewer" },
  { name: "박민서", role: "reviewer" },
];
