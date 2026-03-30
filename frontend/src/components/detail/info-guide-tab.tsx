"use client";

import {
  FileText,
  HardDrive,
  LayoutDashboard,
  Sheet,
  Hash,
  ExternalLink,
  UserPlus,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Project } from "@/lib/types";
import { PRODUCTION_TYPES } from "@/lib/constants";

interface InfoGuideTabProps {
  project: Project;
}

function PersonField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {value ? (
        <span className="text-sm font-medium">{value}</span>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 text-xs text-primary"
        >
          <UserPlus className="h-3 w-3" />
          배정하기
        </Button>
      )}
    </div>
  );
}

function LinkButton({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
}) {
  if (!href) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-2 text-xs text-muted-foreground border-dashed"
      >
        <Plus className="h-3.5 w-3.5" />
        {label} 추가하기
      </Button>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 h-9 px-3 text-xs rounded-md border border-border bg-background hover:bg-accent hover:text-foreground transition-colors"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      <ExternalLink className="h-3 w-3 text-muted-foreground" />
    </a>
  );
}

export default function InfoGuideTab({ project }: InfoGuideTabProps) {
  const prodTypeLabel =
    PRODUCTION_TYPES.find((p) => p.value === project.productionType)?.label ??
    project.productionType;

  const totalDuration = project.chapterDurations.reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Key info grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">사용처</p>
            <p className="text-sm font-medium">
              {project.businessUnit}
              {project.trackName && (
                <span className="text-muted-foreground">
                  {" "}
                  · {project.trackName}
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">제작 유형</p>
            <Badge variant="outline" className="text-xs">
              {prodTypeLabel}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">챕터</p>
            <p className="text-sm font-medium">
              {project.chapterCount}개
              {totalDuration > 0 && (
                <span className="text-muted-foreground">
                  {" "}
                  ({totalDuration}시간)
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">챕터별 분량</p>
            <p className="text-sm font-medium text-muted-foreground">
              {project.chapterDurations.length > 0
                ? project.chapterDurations.map((d) => `${d}h`).join(" / ")
                : "—"}
            </p>
          </div>
        </div>

        <Separator />

        {/* People — 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div>
            <PersonField label="튜터" value={project.tutor} />
            <PersonField
              label="커리큘럼기획 매니저"
              value={project.curriculumManager}
            />
            <PersonField label="PM" value="박진영" />
          </div>
          <div>
            <PersonField label="편집 담당자" value={project.editor} />
            <PersonField label="자막 담당자" />
            <PersonField label="검수 담당자" value={project.reviewer} />
          </div>
        </div>

        <Separator />

        {/* Memo */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">메모</p>
          <div className="min-h-[60px] rounded-lg border border-border p-3 text-sm bg-muted/20">
            {project.note || (
              <span className="text-muted-foreground">
                메모를 입력하세요...
              </span>
            )}
          </div>
        </div>

        <Separator />

        {/* Work Links — 카드 안으로 이동 */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">작업 링크</p>
          <div className="flex flex-wrap gap-2">
            <LinkButton
              icon={FileText}
              label="강의 교안"
              href={project.lessonPlanLink}
            />
            <LinkButton
              icon={HardDrive}
              label="구글 드라이브"
              href={project.driveLink}
            />
            <LinkButton
              icon={LayoutDashboard}
              label="플랫폼 백오피스"
              href={project.backofficeLink}
            />
            <LinkButton
              icon={Sheet}
              label="커리큘럼 시트"
              href={project.curriculumSheetLink}
            />
            <LinkButton
              icon={Hash}
              label={project.slackChannel ?? "슬랙 채널"}
              href={
                project.slackChannel
                  ? `https://slack.com/app_redirect?channel=${project.slackChannel.replace("#", "")}`
                  : undefined
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
