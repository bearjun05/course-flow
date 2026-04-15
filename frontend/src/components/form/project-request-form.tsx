"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Send,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Link as LinkIcon,
} from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import type { BusinessUnit, ProductionType } from "@/lib/types";
import { KDT_TRACKS } from "@/lib/constants";

const DRAFT_KEY = "courseflow_draft_project";

interface FormData {
  title: string;
  tutorAssigned: "yes" | "no" | "";
  tutorName: string;
  businessUnit: BusinessUnit | "";
  trackName: string;
  businessUnitOther: string;
  productionType: ProductionType | "";
  renewalType: "부분" | "전체" | "";
  previousTitleSame: boolean;
  previousTitle: string;
  renewalScope: string;
  rolloutDate: string;
  paymentDate: string;
  needSchedule: "yes" | "no" | "";
  customSchedule: string;
  estimatedDuration: string;
  estimatedChapters: string;
  hasCurriculum: "yes" | "no" | "";
  curriculumLink: string;
  conceptDescription: string;
}

const DEFAULT_FORM: FormData = {
  title: "",
  tutorAssigned: "",
  tutorName: "",
  businessUnit: "",
  trackName: "",
  businessUnitOther: "",
  productionType: "",
  renewalType: "",
  previousTitleSame: true,
  previousTitle: "",
  renewalScope: "",
  rolloutDate: "",
  paymentDate: "",
  needSchedule: "",
  customSchedule: "",
  estimatedDuration: "",
  estimatedChapters: "",
  hasCurriculum: "",
  curriculumLink: "",
  conceptDescription: "",
};

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export function ProjectRequestForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [hasDraft, setHasDraft] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [newProjectId, setNewProjectId] = useState("");

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

  const handleSubmit = () => {
    const newId = `proj-${Date.now()}`;
    localStorage.removeItem(DRAFT_KEY);
    setNewProjectId(newId);
    setSubmitted(true);
  };

  const isComplete =
    form.title &&
    form.tutorAssigned &&
    form.businessUnit &&
    (form.businessUnit !== "KDT" || form.trackName) &&
    (form.businessUnit !== "기타" || form.businessUnitOther) &&
    form.productionType &&
    (form.productionType !== "리뉴얼" || form.renewalType) &&
    form.rolloutDate &&
    form.paymentDate &&
    form.estimatedDuration;

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              제작 요청이 제출되었습니다
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              PM이 빠른 시일 내에 내용을 확인하겠습니다.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-1.5"
            onClick={() => router.push(`/projects/${newProjectId}`)}
          >
            프로젝트 페이지로 이동
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* ──────────────── 섹션 1: 강의 기본 정보 ──────────────── */}
      <section className="space-y-5">
        <SectionHeader
          title="강의 기본 정보"
          description="강의명, 튜터, 사용처, 제작 유형을 입력해 주세요."
        />

        <div className="space-y-4">
          {/* 강의명 */}
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

          {/* 튜터 배정 */}
          <div className="space-y-2">
            <Label className="text-xs">
              튜터 배정 여부 <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={form.tutorAssigned}
              onValueChange={(v) => {
                update("tutorAssigned", v as "yes" | "no");
                if (v === "no") update("tutorName", "");
              }}
              className="mt-1.5 flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="tutor-yes" />
                <Label htmlFor="tutor-yes" className="text-sm font-normal">
                  배정 완료
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="tutor-no" />
                <Label htmlFor="tutor-no" className="text-sm font-normal">
                  미배정
                </Label>
              </div>
            </RadioGroup>
            {form.tutorAssigned === "yes" && (
              <Input
                value={form.tutorName}
                onChange={(e) => update("tutorName", e.target.value)}
                placeholder="튜터 이름을 입력해 주세요"
                className="mt-1"
              />
            )}
            {form.tutorAssigned === "no" && (
              <p className="text-xs text-muted-foreground">
                프로젝트에 &lsquo;구인 중&rsquo;으로 표시됩니다.
              </p>
            )}
          </div>

          {/* 사용처 */}
          <div className="space-y-2">
            <Label className="text-xs">
              사용처 <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={form.businessUnit}
              onValueChange={(v) => {
                update("businessUnit", v as BusinessUnit);
                if (v !== "KDT") update("trackName", "");
                if (v !== "기타") update("businessUnitOther", "");
              }}
              className="mt-1.5 flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="KDT" id="bu-kdt" />
                <Label htmlFor="bu-kdt" className="text-sm font-normal">
                  KDT
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="KDC" id="bu-kdc" />
                <Label htmlFor="bu-kdc" className="text-sm font-normal">
                  KDC
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="기타" id="bu-etc" />
                <Label htmlFor="bu-etc" className="text-sm font-normal">
                  기타
                </Label>
              </div>
            </RadioGroup>

            {form.businessUnit === "KDT" && (
              <Select
                value={form.trackName}
                onValueChange={(v) => update("trackName", v ?? "")}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="트랙을 선택해 주세요" />
                </SelectTrigger>
                <SelectContent>
                  {KDT_TRACKS.map((track) => (
                    <SelectItem key={track} value={track}>
                      {track}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {form.businessUnit === "기타" && (
              <Input
                value={form.businessUnitOther}
                onChange={(e) => update("businessUnitOther", e.target.value)}
                placeholder="사용 목적을 입력해 주세요"
                className="mt-1"
              />
            )}
          </div>

          {/* 제작 유형 */}
          <div className="space-y-2">
            <Label className="text-xs">
              제작 유형 <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={form.productionType}
              onValueChange={(v) => {
                update("productionType", v as ProductionType);
                if (v === "신규") {
                  update("renewalType", "");
                  update("previousTitle", "");
                  update("previousTitleSame", true);
                  update("renewalScope", "");
                }
              }}
              className="mt-1.5 flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="신규" id="pt-new" />
                <Label htmlFor="pt-new" className="text-sm font-normal">
                  신규 제작
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="리뉴얼" id="pt-renewal" />
                <Label htmlFor="pt-renewal" className="text-sm font-normal">
                  리뉴얼
                </Label>
              </div>
            </RadioGroup>

            {form.productionType === "리뉴얼" && (
              <div className="mt-2 space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                <div className="space-y-2">
                  <Label className="text-xs">리뉴얼 범위</Label>
                  <RadioGroup
                    value={form.renewalType}
                    onValueChange={(v) =>
                      update("renewalType", v as "부분" | "전체")
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="부분" id="rn-partial" />
                      <Label
                        htmlFor="rn-partial"
                        className="text-sm font-normal"
                      >
                        부분 리뉴얼
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="전체" id="rn-full" />
                      <Label htmlFor="rn-full" className="text-sm font-normal">
                        전체 리뉴얼
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">이전 강의명</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="same-title"
                      checked={form.previousTitleSame}
                      onCheckedChange={(checked) =>
                        update("previousTitleSame", !!checked)
                      }
                    />
                    <Label
                      htmlFor="same-title"
                      className="text-xs font-normal text-muted-foreground"
                    >
                      위에 입력한 강의명과 동일합니다
                    </Label>
                  </div>
                  {!form.previousTitleSame && (
                    <Input
                      value={form.previousTitle}
                      onChange={(e) => update("previousTitle", e.target.value)}
                      placeholder="이전 강의명을 입력해 주세요"
                    />
                  )}
                </div>

                {form.renewalType === "부분" && (
                  <div className="space-y-2">
                    <Label className="text-xs">리뉴얼 범위 설명</Label>
                    <Textarea
                      value={form.renewalScope}
                      onChange={(e) => update("renewalScope", e.target.value)}
                      placeholder="어떤 부분을 리뉴얼하는지 설명해 주세요 (예: 3장 전체 + 5장 2~4강)"
                      className="min-h-[60px]"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <Separator className="my-8" />

      {/* ──────────────── 섹션 2: 일정 ──────────────── */}
      <section className="space-y-5">
        <SectionHeader
          title="일정"
          description="목표 출시일과 강의 지급일, 세부 일정 산정 여부를 입력해 주세요."
        />

        <div className="space-y-4">
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

          {/* 세부 일정 산정 */}
          <div className="space-y-2">
            <Label className="text-xs">세부 제작 일정 산정</Label>
            <RadioGroup
              value={form.needSchedule}
              onValueChange={(v) => {
                update("needSchedule", v as "yes" | "no");
                if (v === "yes") update("customSchedule", "");
              }}
              className="mt-1.5 flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="sched-yes" />
                <Label htmlFor="sched-yes" className="text-sm font-normal">
                  PM에게 산정 요청
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="sched-no" />
                <Label htmlFor="sched-no" className="text-sm font-normal">
                  직접 산정 완료
                </Label>
              </div>
            </RadioGroup>
            {form.needSchedule === "yes" && (
              <p className="text-xs text-muted-foreground">
                PM이 예상 분량과 롤아웃 일정을 기준으로 세부 일정을 산정해
                드립니다. 해당 일정을 토대로 튜터와 논의하여 확정해 주세요.
              </p>
            )}
            {form.needSchedule === "no" && (
              <Textarea
                value={form.customSchedule}
                onChange={(e) => update("customSchedule", e.target.value)}
                placeholder="산정하신 제작 일정을 공유해 주세요"
                className="min-h-[60px]"
              />
            )}
          </div>
        </div>
      </section>

      <Separator className="my-8" />

      {/* ──────────────── 섹션 3: 강의 구성 ──────────────── */}
      <section className="space-y-5">
        <SectionHeader
          title="강의 구성"
          description="예상 분량, 챕터 수, 커리큘럼 초안 정보를 입력해 주세요."
        />

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">
                예상 분량 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.estimatedDuration}
                onChange={(e) => update("estimatedDuration", e.target.value)}
                placeholder="예: 총 10시간"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs">예상 챕터 수</Label>
              <Input
                value={form.estimatedChapters}
                onChange={(e) => update("estimatedChapters", e.target.value)}
                placeholder="미정이면 비워두세요"
                className="mt-1.5"
              />
            </div>
          </div>

          {/* 커리큘럼 초안 */}
          <div className="space-y-2">
            <Label className="text-xs">커리큘럼 초안</Label>
            <RadioGroup
              value={form.hasCurriculum}
              onValueChange={(v) => {
                update("hasCurriculum", v as "yes" | "no");
                if (v === "yes") update("conceptDescription", "");
                if (v === "no") update("curriculumLink", "");
              }}
              className="mt-1.5 flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="cur-yes" />
                <Label htmlFor="cur-yes" className="text-sm font-normal">
                  있음 (링크 공유)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="cur-no" />
                <Label htmlFor="cur-no" className="text-sm font-normal">
                  아직 없음
                </Label>
              </div>
            </RadioGroup>
            {form.hasCurriculum === "yes" && (
              <div className="space-y-1.5">
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={form.curriculumLink}
                    onChange={(e) => update("curriculumLink", e.target.value)}
                    placeholder="노션 또는 구글 독스 링크를 붙여넣어 주세요"
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  최종 커리큘럼에는 각 장별·강별 예상 분량이 포함되어야 합니다.
                  해당 분량을 기준으로 촬영 일정을 산정합니다.
                </p>
              </div>
            )}
            {form.hasCurriculum === "no" && (
              <div className="space-y-1.5">
                <Textarea
                  value={form.conceptDescription}
                  onChange={(e) => update("conceptDescription", e.target.value)}
                  placeholder="강의 컨셉을 간단히 설명해 주세요 (예: 대상, 목표, 주요 내용)"
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  최종 커리큘럼에는 각 장별·강별 예상 분량이 포함되어야 합니다.
                  해당 분량을 기준으로 촬영 일정을 산정합니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Separator className="my-8" />

      {/* 하단 버튼 */}
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
          disabled={!isComplete}
          className="gap-1.5"
        >
          <Send className="h-3.5 w-3.5" />
          제작 요청 제출
        </Button>
      </div>
    </div>
  );
}
