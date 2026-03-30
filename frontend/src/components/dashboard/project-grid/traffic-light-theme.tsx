"use client";

import { createContext, useContext, useState } from "react";
import type { TrafficLight } from "@/lib/types";

export type TrafficLightThemeKey = "default" | "pastel" | "vintage";

interface TrafficLightThemeOption {
  key: TrafficLightThemeKey;
  label: string;
  colors: Record<TrafficLight, string>;
}

export const TRAFFIC_LIGHT_THEMES: TrafficLightThemeOption[] = [
  {
    key: "default",
    label: "기본",
    colors: {
      green: "bg-emerald-500",
      yellow: "bg-amber-500",
      red: "bg-red-500",
    },
  },
  {
    key: "pastel",
    label: "파스텔",
    colors: {
      green: "bg-[#A8D8B9]",
      yellow: "bg-[#F5D98E]",
      red: "bg-[#F2A7A7]",
    },
  },
  {
    key: "vintage",
    label: "빈티지",
    colors: {
      green: "bg-[#6ECC9A]",
      yellow: "bg-[#F5C842]",
      red: "bg-[#F47A8A]",
    },
  },
];

interface TrafficLightThemeContextValue {
  themeKey: TrafficLightThemeKey;
  colors: Record<TrafficLight, string>;
  setThemeKey: (key: TrafficLightThemeKey) => void;
}

const TrafficLightThemeContext = createContext<TrafficLightThemeContextValue>({
  themeKey: "default",
  colors: TRAFFIC_LIGHT_THEMES[0].colors,
  setThemeKey: () => {},
});

export function TrafficLightThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [themeKey, setThemeKey] = useState<TrafficLightThemeKey>("default");
  const current = TRAFFIC_LIGHT_THEMES.find((t) => t.key === themeKey)!;
  return (
    <TrafficLightThemeContext.Provider
      value={{ themeKey, colors: current.colors, setThemeKey }}
    >
      {children}
    </TrafficLightThemeContext.Provider>
  );
}

export function useTrafficLightTheme() {
  return useContext(TrafficLightThemeContext);
}
