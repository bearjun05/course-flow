"use client";

import { createContext, useContext, useState } from "react";

export type BadgeThemeKey = "A" | "B" | "C";

export interface BadgeTheme {
  label: string;
  description: string;
  unitBadge: string; // 사업부 (칸반)
  typeBadge: string; // 리뉴얼 (칸반)
  versionBadge: string; // 버전 (리스트)
  listUnitBadge: string; // 사업부 (리스트)
}

export const BADGE_THEMES: Record<BadgeThemeKey, BadgeTheme> = {
  A: {
    label: "A",
    description: "뉴트럴",
    unitBadge: "bg-neutral-100 text-neutral-500",
    typeBadge: "bg-neutral-100 text-neutral-400",
    versionBadge: "bg-neutral-100 text-neutral-400",
    listUnitBadge: "bg-neutral-100 text-neutral-400",
  },
  B: {
    label: "B",
    description: "올리브+뉴트럴",
    unitBadge: "bg-[#F5F0E8] text-[#8B7A55]",
    typeBadge: "bg-[#EEF0E6] text-[#6E7A55]",
    versionBadge: "bg-neutral-100 text-neutral-400",
    listUnitBadge: "bg-[#F5F0E8] text-[#8B7A55]",
  },
  C: {
    label: "C",
    description: "어스톤",
    unitBadge: "bg-[#FFF0D6] text-[#A07830]",
    typeBadge: "bg-[#F5E6DC] text-[#9A5A3A]",
    versionBadge: "bg-[#E0E8F5] text-[#4A5E8A]",
    listUnitBadge: "bg-[#FFF0D6] text-[#A07830]",
  },
};

interface BadgeThemeContextValue {
  themeKey: BadgeThemeKey;
  theme: BadgeTheme;
  setThemeKey: (key: BadgeThemeKey) => void;
}

const BadgeThemeContext = createContext<BadgeThemeContextValue>({
  themeKey: "B",
  theme: BADGE_THEMES.B,
  setThemeKey: () => {},
});

export function BadgeThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [themeKey, setThemeKey] = useState<BadgeThemeKey>("B");
  return (
    <BadgeThemeContext.Provider
      value={{ themeKey, theme: BADGE_THEMES[themeKey], setThemeKey }}
    >
      {children}
    </BadgeThemeContext.Provider>
  );
}

export function useBadgeTheme() {
  return useContext(BadgeThemeContext);
}
