"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, User } from "lucide-react";

export default function PersonPage() {
  const params = useParams<{ name: string }>();
  const name = decodeURIComponent(params.name);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card/80 px-6 py-4 backdrop-blur-sm">
        <Link
          href="/"
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          {name}
        </h1>
      </header>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
          <User className="w-8 h-8 text-neutral-300" />
        </div>
        <p className="text-sm text-neutral-500">
          {name}님의 담당 강의 및 작업 현황이 여기에 표시될 예정이에요.
        </p>
        <p className="text-xs text-neutral-400 mt-1">
          아직 준비 중인 페이지입니다.
        </p>
      </div>
    </div>
  );
}
