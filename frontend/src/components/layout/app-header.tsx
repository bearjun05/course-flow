"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  title: string;
  description?: string;
}

export function AppHeader({ title, description }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card/80 px-6 py-4 backdrop-blur-sm">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <Link href="/projects/new">
        <Button
          size="sm"
          className="gap-1.5 border border-neutral-200/80 bg-white/60 text-neutral-700 shadow-sm backdrop-blur-md transition-all duration-500 ease-out hover:bg-amber-50/70 hover:border-amber-200/60 hover:text-neutral-900 hover:shadow-md"
        >
          <Plus className="h-3.5 w-3.5" />
          강의 제작 요청
        </Button>
      </Link>
    </header>
  );
}
