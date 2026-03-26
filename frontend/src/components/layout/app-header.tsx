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
        <Button className="gap-2 px-5 py-2.5 text-base font-bold bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50 shadow-sm">
          <Plus className="h-5 w-5" />
          강의 제작 요청
        </Button>
      </Link>
    </header>
  );
}
