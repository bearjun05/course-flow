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
    <header className="flex items-center justify-between border-b border-border bg-background px-6 py-3">
      <h1 className="text-sm font-medium text-foreground">{title}</h1>
      <Link href="/projects/new">
        <Button size="sm" className="gap-1.5 text-xs font-medium">
          <Plus className="h-3.5 w-3.5" />
          강의 제작 요청
        </Button>
      </Link>
    </header>
  );
}
