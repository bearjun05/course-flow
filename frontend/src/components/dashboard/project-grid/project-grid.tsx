"use client";

import { useState, useMemo } from "react";
import { Search, Filter, PartyPopper } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project, ProjectStatus, BusinessUnit } from "@/lib/types";
import { PROJECT_STATUSES, BUSINESS_UNITS, KDT_TRACKS } from "@/lib/constants";
import { DeadlineListView } from "./deadline-list-view";
import { cn } from "@/lib/utils";
import { STATUS_BADGE_THEMES, useStatusBadgeTheme } from "./status-badge-theme";

interface ProjectGridProps {
  projects: Project[];
}

type TabMode = "active" | "all";

export function ProjectGrid({ projects }: ProjectGridProps) {
  const [tab, setTab] = useState<TabMode>("active");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">(
    "all",
  );
  const [businessFilter, setBusinessFilter] = useState<BusinessUnit | "all">(
    "all",
  );
  const [trackFilter, setTrackFilter] = useState<string>("all");

  // 공통 필터 (검색/사업부/트랙/상태)
  function applyFilters(list: Project[]): Project[] {
    let result = list.filter((p) => !p.hidden);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q));
    }

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (businessFilter !== "all") {
      result = result.filter((p) => p.businessUnit === businessFilter);
    }

    if (businessFilter === "KDT" && trackFilter !== "all") {
      result = result.filter((p) => p.trackName === trackFilter);
    }

    return result;
  }

  // 진행 중 탭: 완료·중단 제외
  const activeProjects = useMemo(
    () =>
      applyFilters(
        projects.filter((p) => p.status !== "완료" && p.status !== "중단"),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects, search, statusFilter, businessFilter, trackFilter],
  );

  // 전체 탭: 중단만 제외 (완료 포함)
  const allProjects = useMemo(
    () => applyFilters(projects.filter((p) => p.status !== "중단")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects, search, statusFilter, businessFilter, trackFilter],
  );

  const displayProjects = tab === "active" ? activeProjects : allProjects;

  return (
    <div>
      {/* 헤더: 탭 + 카운트 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            전체 프로젝트
          </h2>
          <Badge variant="secondary" className="text-[10px] font-normal">
            {displayProjects.length}
          </Badge>
        </div>
        <div className="flex items-center rounded-lg border border-border p-0.5 gap-0.5">
          <button
            onClick={() => setTab("active")}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs transition-colors",
              tab === "active"
                ? "bg-background shadow-sm text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            진행 중
          </button>
          <button
            onClick={() => setTab("all")}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs transition-colors",
              tab === "all"
                ? "bg-background shadow-sm text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            전체
          </button>
        </div>
      </div>

      {/* 검색 + 필터 */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="강의명 검색…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-56 pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              if (v) setStatusFilter(v as ProjectStatus | "all");
            }}
          >
            <SelectTrigger className="h-8 w-auto gap-1 border-border text-xs">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                전체 상태
              </SelectItem>
              {PROJECT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={businessFilter}
            onValueChange={(v) => {
              if (v) {
                setBusinessFilter(v as BusinessUnit | "all");
                if (v !== "KDT") setTrackFilter("all");
              }
            }}
          >
            <SelectTrigger className="h-8 w-auto gap-1 border-border text-xs">
              <SelectValue placeholder="사업부" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                전체 사업부
              </SelectItem>
              {BUSINESS_UNITS.map((bu) => (
                <SelectItem key={bu} value={bu} className="text-xs">
                  {bu}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {businessFilter === "KDT" && (
            <Select
              value={trackFilter}
              onValueChange={(v) => {
                if (v) setTrackFilter(v);
              }}
            >
              <SelectTrigger className="h-8 w-auto gap-1 border-border text-xs">
                <SelectValue placeholder="트랙" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  전체 트랙
                </SelectItem>
                {KDT_TRACKS.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* 상태 배지 색상 디버그 */}
        <StatusBadgeToggle />
      </div>

      {/* 목록 */}
      {displayProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <PartyPopper className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {search
              ? "검색 결과가 없습니다"
              : "모든 강의 제작이 마무리되었습니다!"}
          </p>
        </div>
      ) : (
        <DeadlineListView projects={displayProjects} flat={tab === "all"} />
      )}
    </div>
  );
}

function StatusBadgeToggle() {
  const { themeKey, setThemeKey } = useStatusBadgeTheme();
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground">배지색</span>
      <div className="flex items-center rounded-md border border-border p-0.5 gap-0.5">
        {STATUS_BADGE_THEMES.map((t) => (
          <button
            key={t.key}
            onClick={() => setThemeKey(t.key)}
            className={cn(
              "rounded px-2 py-0.5 text-[10px] transition-colors",
              themeKey === t.key
                ? "bg-background shadow-sm text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-1">
              <span
                className={cn(
                  "inline-block w-2 h-2 rounded-full",
                  t.style.split(" ")[0],
                )}
              />
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
