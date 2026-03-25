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
import type { Project, ProjectStatus, TrafficLight, BusinessUnit } from "@/lib/types";
import { getDday } from "@/lib/utils";
import { PROJECT_STATUSES, BUSINESS_UNITS, KDT_TRACKS } from "@/lib/constants";
import { ColumnView } from "./column-view";

interface ProjectGridProps {
  projects: Project[];
  onStatusChange: (projectId: string, status: ProjectStatus) => void;
  onTrafficLightChange: (projectId: string, light: TrafficLight) => void;
  onRolloutChange: (projectId: string, date: string) => void;
  onDelete: (projectId: string) => void;
  onDuplicate: (projectId: string) => void;
  onHide: (projectId: string) => void;
}

const COMPLETE_HIDE_DAYS = 7;

export function ProjectGrid({
  projects,
  onStatusChange,
  onTrafficLightChange,
  onRolloutChange,
  onDelete,
  onDuplicate,
  onHide,
}: ProjectGridProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [businessFilter, setBusinessFilter] = useState<BusinessUnit | "all">("all");
  const [trackFilter, setTrackFilter] = useState<string>("all");

  const filteredProjects = useMemo(() => {
    let result = projects.filter((p) => !p.hidden);

    if (!search) {
      result = result.filter((p) => {
        if (p.status === "중단") return false;
        if (p.status === "완료") {
          const daysSincePayment = -getDday(p.paymentDate);
          return daysSincePayment < COMPLETE_HIDE_DAYS;
        }
        return true;
      });
    }

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
  }, [projects, search, statusFilter, businessFilter, trackFilter]);

  const viewProps = {
    projects: filteredProjects,
    onStatusChange,
    onTrafficLightChange,
    onRolloutChange,
    onDelete,
    onDuplicate,
    onHide,
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            전체 프로젝트
          </h2>
          <Badge variant="secondary" className="text-[10px] font-normal">
            {filteredProjects.length}
          </Badge>
        </div>
      </div>

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
            onValueChange={(v) => { if (v) setStatusFilter(v as ProjectStatus | "all"); }}
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
              onValueChange={(v) => { if (v) setTrackFilter(v); }}
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
      </div>

      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <PartyPopper className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {search
              ? "검색 결과가 없습니다"
              : "모든 강의 제작이 마무리되었습니다!"}
          </p>
        </div>
      ) : (
        <ColumnView {...viewProps} />
      )}
    </div>
  );
}
