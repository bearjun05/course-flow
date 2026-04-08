"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  title: string;
  description?: string;
  showAddButton?: boolean;
}

export function AppHeader({
  title,
  description,
  showAddButton = true,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/80 px-6 py-4 backdrop-blur-sm">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {showAddButton && (
        <Link href="/projects/new">
          <Button className="gap-2 border border-neutral-200/80 bg-white/60 text-neutral-700 shadow-sm backdrop-blur-md transition-all duration-500 ease-out hover:bg-white/95 hover:border-neutral-300/70 hover:text-neutral-900 hover:shadow-md">
            <Plus className="h-4 w-4" />
            신규 강의 추가
          </Button>
        </Link>
      )}
    </header>
  );
}
