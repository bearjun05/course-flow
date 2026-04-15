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
  // 1. 강의명
  title: string;
  // 2. 튜터
  tutorAssigned: "yes" | "no" | "";
  tutorName: string;
  // 3. 사용처
  businessUnit: BusinessUnit | "";
  trackName: string;
  businessUnitOther: string;
  // 4. 제작 유형
  productionType: ProductionType | "";
  renewalType: "부분" | "전체" | "";
  previousTitleSame: boolean;
  previousTitle: string;
  renewalScope: string;
  // 5. 롤아웃
  rolloutDate: string;
  // 6. 강의 지급일
  paymentDate: string;
  // 7. 세부 제작 일정
  needSchedule: "yes" | "no" | "";
  customSchedule: string;
  // 8. 예상 분량
  estimatedDuration: string;
  // 9. 예상 챕터 수
  estimatedChapters: string;
  // 10. 커리큘럼 초안
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

function SectionNumber({ n }: { n: number }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
      {n}
    </span>
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
            <p className="mt-1 text-sm text-muted-foreground">
              PM이 빠른 시일 내에 내용 확인할게요.
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
    <div className="mx-auto max-w-2xl space-y-7">
      {/* 1. 강의명 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <SectionNumber n={1} />
          <Label className="text-sm font-medium">
            강의명 <span className="text-red-500">*</span>
          </Label>
        </div>
        <Input
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="예: 실시간 채팅을 위한 아키텍처 설계"
        />
      </div>

      <Separator />

      {/* 2. 튜터 배정 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <SectionNumber n={2} />
          <Label className="text-sm font-medium">
            튜터 배정 완료 여부 <span className="text-red-500">*</span>
          </Label>
        </div>
        <RadioGroup
          value={form.tutorAssigned}
          onValueChange={(v) => {
            update("tutorAssigned", v as "yes" | "no");
            if (v === "no") update("tutorName", "");
          }}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="tutor-yes" />
            <Label htmlFor="tutor-yes" className="text-sm font-normal">
              O 배정 완료
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="tutor-no" />
            <Label htmlFor="tutor-no" className="text-sm font-normal">
              X 미배정
            </Label>
          </div>
        </RadioGroup>
        {form.tutorAssigned === "yes" && (
          <Input
            value={form.tutorName}
            onChange={(e) => update("tutorName", e.target.value)}
            placeholder="튜터 이름을 입력하세요"
          />
        )}
        {form.tutorAssigned === "no" && (
          <p className="text-xs text-muted-foreground">
            → 구인 중으로 표시됩니다
          </p>
        )}
      </div>

      <Separator />

      {/* 3. 사용처 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <SectionNumber n={3} />
          <Label className="text-sm font-medium">
            어디에서 사용돼? <span className="text-red-500">*</span>
          </Label>
        </div>
        <RadioGroup
          value={form.businessUnit}
          onValueChange={(v) => {
            update("businessUnit", v as BusinessUnit);
            if (v !== "KDT") update("trackName", "");
            if (v !== "기타") update("businessUnitOther", "");
          }}
          className="flex gap-4"
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
              <SelectValue placeholder="트랙을 선택하세요" />
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
            placeholder="어떤 용도인지 입력해주세요"
          />
        )}
      </div>

      <Separator />

      {/* 4. 제작 유형 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <SectionNumber n={4} />
          <Label className="text-sm font-medium">
            신규 제작이야, 리뉴얼이야? <span className="text-red-500">*</span>
          </Label>
        </div>
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
          className="flex gap-4"
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
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
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
              <div className="flex items-center gap-2">
                <Checkbox
                  id="same-title"
                  checked={form.previousTitleSame}
                  onCheckedChange={(checked) =>
                    update("previousTitleSame", !!checked)
                  }
                />
                <Label htmlFor="same-title" className="text-xs font-normal">
                  이전 강의명과 동일
                </Label>
              </div>
              {!form.previousTitleSame && (
                <Input
                  value={form.previousTitle}
                  onChange={(e) => update("previousTitle", e.target.value)}
                  placeholder="이전 강의명을 입력하세요"
                />
              )}
            </div>

            {form.renewalType === "부분" && (
              <div className="space-y-2">
                <Label className="text-xs">리뉴얼 범위 설명</Label>
                <Textarea
                  value={form.renewalScope}
                  onChange={(e) => update("renewalScope", e.target.value)}
                  placeholder="어떤 부분을 리뉴얼하는지 설명해주세요"
                  className="min-h-[60px]"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* 5 & 6. 일정 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <SectionNumber n={5} />
          <Label className="text-sm font-medium">
            롤아웃이 언제야? <span className="text-red-500">*</span>
          </Label>
        </div>
        <Input
          type="date"
          value={form.rolloutDate}
          onChange={(e) => update("rolloutDate", e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <SectionNumber n={6} />
          <Label className="text-sm font-medium">
            강의 지급일은 언제야? <span className="text-red-500">*</span>
          </Label>
        </div>
        <Input
          type="date"
          value={form.paymentDate}
          onChange={(e) => update("paymentDate", e.target.value)}
        />
      </div>

      <Separator />

      {/* 7. 세부 제작 일정 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <SectionNumber n={7} />
          <Label className="text-sm font-medium">
            세부 제작 일정 산정이 필요해?
          </Label>
        </div>
        <RadioGroup
          value={form.needSchedule}
          onValueChange={(v) => {
            update("needSchedule", v as "yes" | "no");
            if (v === "yes") update("customSchedule", "");
          }}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="sched-yes" />
            <Label htmlFor="sched-yes" className="text-sm font-normal">
              필요해
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="sched-no" />
            <Label htmlFor="sched-no" className="text-sm font-normal">
              아니, 내가 산정했어
            </Label>
          </div>
        </RadioGroup>
        {form.needSchedule === "yes" && (
          <p className="text-xs text-muted-foreground">
            → PM이 예상 분량과 롤아웃 기준으로 일정을 산정해서 드릴게요. 그
            일정을 토대로 튜터와 논의해서 확정하시면 됩니다.
          </p>
        )}
        {form.needSchedule === "no" && (
          <Textarea
            value={form.customSchedule}
            onChange={(e) => update("customSchedule", e.target.value)}
            placeholder="산정한 강의 일정을 공유해주세요"
            className="min-h-[60px]"
          />
        )}
      </div>

      <Separator />

      {/* 8. 예상 분량 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <SectionNumber n={8} />
          <Label className="text-sm font-medium">
            강의 예상 분량은? <span className="text-red-500">*</span>
          </Label>
        </div>
        <Input
          value={form.estimatedDuration}
          onChange={(e) => update("estimatedDuration", e.target.value)}
          placeholder="예: 총 10시간, 챕터당 약 1.5시간"
        />
      </div>

      <Separator />

      {/* 9. 예상 챕터 수 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <SectionNumber n={9} />
          <Label className="text-sm font-medium">예상 챕터 개수는?</Label>
        </div>
        <Input
          value={form.estimatedChapters}
          onChange={(e) => update("estimatedChapters", e.target.value)}
          placeholder="있으면 적고, 없으면 넘어가세요"
        />
      </div>

      <Separator />

      {/* 10. 커리큘럼 초안 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <SectionNumber n={10} />
          <Label className="text-sm font-medium">커리큘럼 초안 있어?</Label>
        </div>
        <RadioGroup
          value={form.hasCurriculum}
          onValueChange={(v) => {
            update("hasCurriculum", v as "yes" | "no");
            if (v === "yes") update("conceptDescription", "");
            if (v === "no") update("curriculumLink", "");
          }}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="cur-yes" />
            <Label htmlFor="cur-yes" className="text-sm font-normal">
              있어
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="cur-no" />
            <Label htmlFor="cur-no" className="text-sm font-normal">
              아직 없어
            </Label>
          </div>
        </RadioGroup>
        {form.hasCurriculum === "yes" && (
          <div className="space-y-2">
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={form.curriculumLink}
                onChange={(e) => update("curriculumLink", e.target.value)}
                placeholder="커리큘럼 링크를 붙여넣으세요"
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              * 최종 커리큘럼에는 각 장별, 강별 예상 분량이 포함되어야 해요. 그
              기준으로 촬영 일정을 잡습니다.
            </p>
          </div>
        )}
        {form.hasCurriculum === "no" && (
          <div className="space-y-2">
            <Textarea
              value={form.conceptDescription}
              onChange={(e) => update("conceptDescription", e.target.value)}
              placeholder="간단하게 강의 컨셉을 설명해주세요"
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              * 최종 커리큘럼에는 각 장별, 강별 예상 분량이 포함되어야 해요. 그
              기준으로 촬영 일정을 잡습니다.
            </p>
          </div>
        )}
      </div>

      <Separator />

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
