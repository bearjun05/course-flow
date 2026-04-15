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
  scheduleCurriculum: string;
  scheduleLessonPlan: string;
  scheduleFilming: string;
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
  previousTitleSame: false,
  previousTitle: "",
  renewalScope: "",
  rolloutDate: "",
  paymentDate: "",
  needSchedule: "",
  scheduleCurriculum: "",
  scheduleLessonPlan: "",
  scheduleFilming: "",
  estimatedDuration: "",
  estimatedChapters: "",
  hasCurriculum: "",
  curriculumLink: "",
  conceptDescription: "",
};

/* ── 카드형 질문 래퍼 (구글 폼 스타일) ── */
function QuestionCard({
  question,
  description,
  required,
  children,
}: {
  question: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#e2e8d8] bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-[15px] font-medium text-foreground">
          {question}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </h3>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── 섹션 헤더 (컬러 탑바 포함) ── */
function SectionBanner({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e2e8d8] bg-white shadow-sm">
      <div className="h-2 bg-[#b5c98a]" />
      <div className="px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
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

  /* ── 제출 완료 화면 ── */
  if (submitted) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="flex flex-col items-center gap-5 rounded-xl border border-[#e2e8d8] bg-white px-8 py-16 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF2DC]">
            <CheckCircle2 className="h-7 w-7 text-[#7A9445]" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">
              제작 요청이 제출되었습니다
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              PM이 빠른 시일 내에 내용을 확인하겠습니다.
              <br />
              진행 상황은 프로젝트 페이지에서 확인하실 수 있습니다.
            </p>
          </div>
          <Button
            variant="outline"
            className="mt-2 gap-1.5"
            onClick={() => router.push(`/projects/${newProjectId}`)}
          >
            프로젝트 페이지로 이동
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-3">
      {/* ═══════════ 섹션 1: 강의 정보 ═══════════ */}
      <SectionBanner
        title="강의 정보"
        description="제작할 강의의 기본 정보와 구성을 알려 주세요."
      />

      {/* Q1. 강의명 */}
      <QuestionCard question="강의명" required>
        <Input
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="예: 실시간 채팅을 위한 아키텍처 설계"
        />
      </QuestionCard>

      {/* Q2. 튜터 배정 */}
      <QuestionCard
        question="튜터가 배정되었나요?"
        description="아직 정해지지 않았다면 '미배정'을 선택해 주세요. 프로젝트에 '구인 중'으로 표시됩니다."
        required
      >
        <div className="space-y-3">
          <RadioGroup
            value={form.tutorAssigned}
            onValueChange={(v) => {
              update("tutorAssigned", v as "yes" | "no");
              if (v === "no") update("tutorName", "");
            }}
            className="flex gap-6"
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
            />
          )}
        </div>
      </QuestionCard>

      {/* Q3. 사용처 */}
      <QuestionCard question="이 강의는 어디에서 사용되나요?" required>
        <div className="space-y-3">
          <RadioGroup
            value={form.businessUnit}
            onValueChange={(v) => {
              update("businessUnit", v as BusinessUnit);
              if (v !== "KDT") update("trackName", "");
              if (v !== "기타") update("businessUnitOther", "");
            }}
            className="flex gap-6"
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
              <SelectTrigger>
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
              placeholder="어디에서 사용되는지 입력해 주세요"
            />
          )}
        </div>
      </QuestionCard>

      {/* Q4. 제작 유형 */}
      <QuestionCard
        question="신규 제작인가요, 리뉴얼인가요?"
        description="리뉴얼의 경우 부분/전체 여부와 이전 강의 정보를 추가로 입력해 주세요."
        required
      >
        <div className="space-y-3">
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
            className="flex gap-6"
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
            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">리뉴얼 범위</Label>
                <RadioGroup
                  value={form.renewalType}
                  onValueChange={(v) =>
                    update("renewalType", v as "부분" | "전체")
                  }
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="부분" id="rn-partial" />
                    <Label htmlFor="rn-partial" className="text-sm font-normal">
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
                <Label className="text-xs font-medium">이전 강의명</Label>
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
                  <Label className="text-xs font-medium">
                    어떤 부분을 리뉴얼하나요?
                  </Label>
                  <Textarea
                    value={form.renewalScope}
                    onChange={(e) => update("renewalScope", e.target.value)}
                    placeholder="예: 3장 전체 재촬영 + 5장 2~4강 내용 업데이트"
                    className="min-h-[60px]"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </QuestionCard>

      {/* Q5. 예상 분량 & 챕터 */}
      <QuestionCard
        question="강의 예상 분량은 어느 정도인가요?"
        description="아직 챕터 수가 정해지지 않았다면 비워두셔도 됩니다."
        required
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">
              예상 총 분량 (시간)
            </Label>
            <div className="relative mt-1">
              <Input
                type="number"
                min={0}
                step={0.5}
                value={form.estimatedDuration}
                onChange={(e) => update("estimatedDuration", e.target.value)}
                placeholder="10"
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                시간
              </span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              예상 챕터 수 (선택)
            </Label>
            <div className="relative mt-1">
              <Input
                type="number"
                min={0}
                value={form.estimatedChapters}
                onChange={(e) => update("estimatedChapters", e.target.value)}
                placeholder="8"
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                챕터
              </span>
            </div>
          </div>
        </div>
      </QuestionCard>

      {/* Q6. 커리큘럼 초안 */}
      <QuestionCard
        question="커리큘럼 초안이 있으신가요?"
        description="초안이 있으면 링크를, 아직 없다면 강의 컨셉을 간단히 적어 주세요. 최종 커리큘럼에는 각 장별·강별 예상 분량이 포함되어야 하며, 이를 기준으로 촬영 일정을 산정합니다."
      >
        <div className="space-y-3">
          <RadioGroup
            value={form.hasCurriculum}
            onValueChange={(v) => {
              update("hasCurriculum", v as "yes" | "no");
              if (v === "yes") update("conceptDescription", "");
              if (v === "no") update("curriculumLink", "");
            }}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="yes" id="cur-yes" />
              <Label htmlFor="cur-yes" className="text-sm font-normal">
                있음
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
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={form.curriculumLink}
                onChange={(e) => update("curriculumLink", e.target.value)}
                placeholder="노션 또는 구글 독스 링크를 붙여넣어 주세요"
                className="pl-9"
              />
            </div>
          )}
          {form.hasCurriculum === "no" && (
            <Textarea
              value={form.conceptDescription}
              onChange={(e) => update("conceptDescription", e.target.value)}
              placeholder="강의 대상, 목표, 주요 내용 등을 간단히 적어 주세요"
              className="min-h-[80px]"
            />
          )}
        </div>
      </QuestionCard>

      {/* ═══════════ 섹션 2: 일정 ═══════════ */}
      <div className="pt-4">
        <SectionBanner
          title="일정"
          description="롤아웃 마감일과 강의 지급일(출시일), 제작 일정에 대해 알려 주세요."
        />
      </div>

      {/* Q7. 롤아웃 & 지급일 */}
      <QuestionCard
        question="일정을 알려 주세요"
        description="롤아웃은 내부 최종 마감일이고, 강의 지급일이 실제 출시일입니다."
        required
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">롤아웃</Label>
            <Input
              type="date"
              value={form.rolloutDate}
              onChange={(e) => update("rolloutDate", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">강의 지급일</Label>
            <Input
              type="date"
              value={form.paymentDate}
              onChange={(e) => update("paymentDate", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </QuestionCard>

      {/* Q8. 세부 제작 일정 */}
      <QuestionCard
        question="세부 제작 일정을 알려 주세요"
        description="직접 산정한 일정이 있으면 입력해 주시고, 없으면 PM이 예상 분량과 롤아웃을 기준으로 산정해 드립니다."
      >
        <div className="space-y-3">
          <RadioGroup
            value={form.needSchedule}
            onValueChange={(v) => {
              update("needSchedule", v as "yes" | "no");
              if (v === "yes") {
                update("scheduleCurriculum", "");
                update("scheduleLessonPlan", "");
                update("scheduleFilming", "");
              }
            }}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="no" id="sched-no" />
              <Label htmlFor="sched-no" className="text-sm font-normal">
                직접 산정했습니다
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="yes" id="sched-yes" />
              <Label htmlFor="sched-yes" className="text-sm font-normal">
                PM에게 산정 요청
              </Label>
            </div>
          </RadioGroup>
          {form.needSchedule === "no" && (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">
                각 단계의 예상 완료일을 입력해 주세요.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    커리큘럼 기획
                  </Label>
                  <Input
                    type="date"
                    value={form.scheduleCurriculum}
                    onChange={(e) =>
                      update("scheduleCurriculum", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    교안 제작
                  </Label>
                  <Input
                    type="date"
                    value={form.scheduleLessonPlan}
                    onChange={(e) =>
                      update("scheduleLessonPlan", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    강의 촬영
                  </Label>
                  <Input
                    type="date"
                    value={form.scheduleFilming}
                    onChange={(e) => update("scheduleFilming", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}
          {form.needSchedule === "yes" && (
            <p className="text-xs text-muted-foreground">
              PM이 예상 분량과 롤아웃 일정을 기준으로 세부 일정을 산정해
              드립니다. 해당 일정을 토대로 튜터와 논의하여 확정해 주세요.
            </p>
          )}
        </div>
      </QuestionCard>

      {/* ── 하단 버튼 ── */}
      <div className="flex items-center justify-between pb-10 pt-4">
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
