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
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Link href="/projects/new">
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          강의 제작 요청
        </Button>
      </Link>
    </header>
  );
}
