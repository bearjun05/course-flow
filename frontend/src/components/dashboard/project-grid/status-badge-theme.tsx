"use client";

import { createContext, useContext, useState } from "react";

export type StatusBadgeThemeKey = "warm-gray" | "neutral" | "slate-blue";

interface StatusBadgeThemeOption {
  key: StatusBadgeThemeKey;
  label: string;
  style: string;
}

export const STATUS_BADGE_THEMES: StatusBadgeThemeOption[] = [
  {
    key: "warm-gray",
    label: "웜 그레이",
    style: "bg-[#F0EDE8] text-[#7A7060]",
  },
  {
    key: "neutral",
    label: "뉴트럴",
    style: "bg-[#F0F0F0] text-[#6B6B6B]",
  },
  {
    key: "slate-blue",
    label: "슬레이트블루",
    style: "bg-[#E8EDF5] text-[#5A6A8A]",
  },
];

interface StatusBadgeThemeContextValue {
  themeKey: StatusBadgeThemeKey;
  style: string;
  setThemeKey: (key: StatusBadgeThemeKey) => void;
}

const StatusBadgeThemeContext = createContext<StatusBadgeThemeContextValue>({
  themeKey: "warm-gray",
  style: STATUS_BADGE_THEMES[0].style,
  setThemeKey: () => {},
});

export function StatusBadgeThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [themeKey, setThemeKey] = useState<StatusBadgeThemeKey>("warm-gray");
  const current = STATUS_BADGE_THEMES.find((t) => t.key === themeKey)!;
  return (
    <StatusBadgeThemeContext.Provider
      value={{ themeKey, style: current.style, setThemeKey }}
    >
      {children}
    </StatusBadgeThemeContext.Provider>
  );
}

export function useStatusBadgeTheme() {
  return useContext(StatusBadgeThemeContext);
}
