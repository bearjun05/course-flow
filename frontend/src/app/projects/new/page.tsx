import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProjectRequestForm } from "@/components/form/project-request-form";

export default function NewProjectPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              강의 제작 요청
            </h1>
            <p className="text-xs text-muted-foreground">
              새로운 강의 제작을 요청합니다
            </p>
          </div>
        </div>
      </header>

      <div className="px-6 py-8">
        <ProjectRequestForm />
      </div>
    </div>
  );
}
