"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Send, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BusinessUnit, ProductionType } from "@/lib/types";
import { BUSINESS_UNITS, KDT_TRACKS, PRODUCTION_TYPES } from "@/lib/constants";

const DRAFT_KEY = "courseflow_draft_project";

const TUTORS = ["구민정", "김선용", "이준혁", "박서연", "조하늘", "한지수"];
const MANAGERS = ["최진영", "이수민", "박준호"];

interface FormData {
  title: string;
  businessUnit: BusinessUnit | "";
  trackName: string;
  productionType: ProductionType | "";
  rolloutDate: string;
  paymentDate: string;
  chapterCount: number;
  chapterDurations: string[];
  tutor: string;
  curriculumManager: string;
  lessonPlanLink: string;
  driveLink: string;
  note: string;
}

const DEFAULT_FORM: FormData = {
  title: "",
  businessUnit: "",
  trackName: "",
  productionType: "",
  rolloutDate: "",
  paymentDate: "",
  chapterCount: 0,
  chapterDurations: [],
  tutor: "",
  curriculumManager: "",
  lessonPlanLink: "",
  driveLink: "",
  note: "",
};

export function ProjectRequestForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        setForm(JSON.parse(saved));
        setHasDraft(true);
      } catch {
        /* ignore corrupt data */
      }
    }
  }, []);

  const update = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    setHasDraft(true);
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setForm(DEFAULT_FORM);
    setHasDraft(false);
  };

  const handleChapterCountChange = (count: number) => {
    const clamped = Math.max(0, Math.min(20, count));
    const durations = Array.from(
      { length: clamped },
      (_, i) => form.chapterDurations[i] ?? "",
    );
    setForm((prev) => ({
      ...prev,
      chapterCount: clamped,
      chapterDurations: durations,
    }));
  };

  const updateDuration = (index: number, value: string) => {
    const updated = [...form.chapterDurations];
    updated[index] = value;
    setForm((prev) => ({ ...prev, chapterDurations: updated }));
  };

  const handleSubmit = () => {
    const newId = `proj-${Date.now()}`;
    localStorage.removeItem(DRAFT_KEY);
    router.push(`/projects/${newId}`);
  };

  const isBasicComplete =
    form.title &&
    form.businessUnit &&
    form.productionType &&
    form.rolloutDate &&
    form.paymentDate;

  return (
    <div className="mx-auto max-w-2xl">
      <section className="space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">기본 정보</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            강의 제작에 필요한 핵심 정보를 입력하세요
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">
              강의명 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="예: 실시간 채팅을 위한 아키텍처 설계"
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">
                사용처 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.businessUnit}
                onValueChange={(v) => {
                  if (v) update("businessUnit", v as BusinessUnit);
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_UNITS.map((bu) => (
                    <SelectItem key={bu} value={bu}>
                      {bu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">
                제작 유형 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.productionType}
                onValueChange={(v) => {
                  if (v) update("productionType", v as ProductionType);
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTION_TYPES.map((pt) => (
                    <SelectItem key={pt.value} value={pt.value}>
                      {pt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.businessUnit === "KDT" && (
            <div>
              <Label className="text-xs">트랙명</Label>
              <Select
                value={form.trackName}
                onValueChange={(v) => update("trackName", v ?? "")}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {KDT_TRACKS.map((track) => (
                    <SelectItem key={track} value={track}>
                      {track}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">
                롤아웃 (목표 출시일) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={form.rolloutDate}
                onChange={(e) => update("rolloutDate", e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs">
                강의 지급일 <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={form.paymentDate}
                onChange={(e) => update("paymentDate", e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
        </div>
      </section>

      <Separator className="my-8" />

      <section className="space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            커리큘럼 정보
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            커리큘럼 확정 후 추가로 입력합니다
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">장 수</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => handleChapterCountChange(form.chapterCount - 1)}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <Input
                type="number"
                min={0}
                max={20}
                value={form.chapterCount || ""}
                onChange={(e) =>
                  handleChapterCountChange(parseInt(e.target.value) || 0)
                }
                className="w-20 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => handleChapterCountChange(form.chapterCount + 1)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {form.chapterCount > 0 && (
            <div>
              <Label className="text-xs">장별 예상 분량 (시간)</Label>
              <div className="mt-1.5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {Array.from({ length: form.chapterCount }, (_, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-10 text-right text-[11px] text-muted-foreground">
                      CH{i + 1}
                    </span>
                    <Input
                      value={form.chapterDurations[i] ?? ""}
                      onChange={(e) => updateDuration(i, e.target.value)}
                      placeholder="1.5"
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">튜터</Label>
              <Select
                value={form.tutor}
                onValueChange={(v) => update("tutor", v ?? "")}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {TUTORS.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">커리큘럼기획 매니저</Label>
              <Select
                value={form.curriculumManager}
                onValueChange={(v) => update("curriculumManager", v ?? "")}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {MANAGERS.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">교안 링크</Label>
            <Input
              value={form.lessonPlanLink}
              onChange={(e) => update("lessonPlanLink", e.target.value)}
              placeholder="노션 또는 구글 드라이브 링크"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-xs">구글 드라이브 링크</Label>
            <Input
              value={form.driveLink}
              onChange={(e) => update("driveLink", e.target.value)}
              placeholder="강의 자료 드라이브 폴더 링크"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-xs">비고</Label>
            <Textarea
              value={form.note}
              onChange={(e) => update("note", e.target.value)}
              placeholder="참고 사항이 있다면 입력하세요"
              className="mt-1.5 min-h-[80px]"
            />
          </div>
        </div>
      </section>

      <Separator className="my-8" />

      <div className="flex items-center justify-between pb-10">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={saveDraft}
            className="gap-1.5 text-xs"
          >
            <Save className="h-3.5 w-3.5" />
            임시 저장
          </Button>
          {hasDraft && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDraft}
              className="gap-1.5 text-xs text-muted-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
              초기화
            </Button>
          )}
        </div>

        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!isBasicComplete}
          className="gap-1.5"
        >
          <Send className="h-3.5 w-3.5" />
          제작 요청 제출
        </Button>
      </div>
    </div>
  );
}
