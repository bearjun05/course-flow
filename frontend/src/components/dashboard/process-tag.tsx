"use client";

import { Check } from "lucide-react";
import type { ProcessInfo } from "@/lib/process-helpers";
import { cn } from "@/lib/utils";

interface ProcessTagProps {
  label: string;
  info: ProcessInfo;
  accent: {
    dot: string;
    activeBg: string;
    activeText: string;
    doneBg: string;
    doneText: string;
  };
  interactive?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

export function ProcessTag({
  label,
  info,
  accent,
  interactive = false,
  isActive = false,
  onClick,
}: ProcessTagProps) {
  const Tag = interactive ? "button" : "span";

  return (
    <Tag
      {...(interactive && onClick ? { onClick } : {})}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-[3px] text-[10px] leading-none transition-all",
        info.allDone && [
          accent.doneBg,
          accent.doneText,
          "border-emerald-200",
        ],
        !info.allDone &&
          info.activeChapters.length > 0 && [
            accent.activeBg,
            accent.activeText,
            "border-transparent font-medium",
          ],
        info.noneStarted && [
          "border-neutral-200/80 bg-neutral-50 text-neutral-400",
        ],
        !info.allDone &&
          !info.noneStarted &&
          info.activeChapters.length === 0 && [
            "border-neutral-200 bg-white text-neutral-500",
          ],
        isActive &&
          !info.allDone &&
          "ring-2 ring-offset-1 ring-primary/20",
        interactive && "cursor-pointer hover:shadow-sm active:scale-95"
      )}
    >
      <span
        className={cn(
          "h-[5px] w-[5px] shrink-0 rounded-full",
          info.allDone
            ? "bg-emerald-500"
            : info.activeChapters.length > 0
              ? accent.dot
              : "bg-neutral-300"
        )}
      />

      <span className="tracking-tight">{label}</span>

      {info.allDone ? (
        <Check className="h-2.5 w-2.5 text-emerald-600" strokeWidth={2.5} />
      ) : info.activeChapters.length > 0 ? (
        <span className="font-mono text-[9px] font-semibold tracking-tighter">
          CH{info.activeChapters.join(",")}
        </span>
      ) : !info.noneStarted ? (
        <span className="font-mono text-[9px] opacity-50">
          {info.doneCount}/{info.total}
        </span>
      ) : null}
    </Tag>
  );
}

export const PROCESS_ACCENTS = {
  촬영: {
    dot: "bg-sky-500",
    activeBg: "bg-sky-50",
    activeText: "text-sky-700",
    doneBg: "bg-emerald-50",
    doneText: "text-emerald-700",
  },
  편집: {
    dot: "bg-violet-500",
    activeBg: "bg-violet-50",
    activeText: "text-violet-700",
    doneBg: "bg-emerald-50",
    doneText: "text-emerald-700",
  },
  자막: {
    dot: "bg-indigo-500",
    activeBg: "bg-indigo-50",
    activeText: "text-indigo-700",
    doneBg: "bg-emerald-50",
    doneText: "text-emerald-700",
  },
  검수: {
    dot: "bg-amber-500",
    activeBg: "bg-amber-50",
    activeText: "text-amber-700",
    doneBg: "bg-emerald-50",
    doneText: "text-emerald-700",
  },
} as const;
