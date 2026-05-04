import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useCreateEvaluation,
  useCreateQuestion,
  useListCourses,
  getListCoursesQueryKey,
} from "@workspace/api-client-react";
import type { Course } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Plus, Trash2, Loader2, CheckCircle2, ClipboardList, GripVertical
} from "lucide-react";
import { Link, useLocation } from "@/lib/router";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface QuestionDraft {
  id: string;
  text: string;
  points: number;
  options: { text: string; isCorrect: boolean }[];
  correctAnswer: string;
}

const EV_TYPES = ["QCM", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY", "MIXED"] as const;

export default function EvaluationNewPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const createEvaluation = useCreateEvaluation();
  const createQuestion = useCreateQuestion();
  const { data: coursesRaw } = useListCourses();
  const courses: Course[] = Array.isArray(coursesRaw)
    ? coursesRaw
    : (coursesRaw as { courses?: Course[] })?.courses ?? [];

  const [step, setStep] = useState<"info" | "questions" | "done">("info");
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [evalCourseId, setEvalCourseId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    type: "QCM" as typeof EV_TYPES[number],
    courseId: "",
    duration: "30",
    passMark: "60",
  });

  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [newQ, setNewQ] = useState<Omit<QuestionDraft, "id">>({
    text: "",
    points: 1,
    options: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
    correctAnswer: "",
  });
  const [saving, setSaving] = useState(false);

  const updateForm = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleCreateEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.courseId) {
      toast({ title: t("eval_form.required_fields"), variant: "destructive" });
      return;
    }
    try {
      const result = await createEvaluation.mutateAsync({
        courseId: form.courseId,
        data: {
          title: form.title.trim(),
          type: form.type as "QCM" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "MIXED",
          duration: Number(form.duration),
          passMark: Number(form.passMark),
        },
      });
      const id = (result as { id?: string })?.id;
      if (id) {
        setEvaluationId(id);
        setEvalCourseId(form.courseId);
        setStep("questions");
        toast({ title: t("eval_form.created") });
      }
    } catch {
      toast({ title: t("common.error"), description: t("eval_form.create_error"), variant: "destructive" });
    }
  };

  const addQuestion = () => {
    if (!newQ.text.trim()) {
      toast({ title: t("eval_form.question_required"), variant: "destructive" });
      return;
    }
    setQuestions((prev) => [
      ...prev,
      { ...newQ, id: crypto.randomUUID() },
    ]);
    setNewQ({
      text: "",
      points: 1,
      options: [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
      correctAnswer: "",
    });
  };

  const removeQuestion = (id: string) =>
    setQuestions((prev) => prev.filter((q) => q.id !== id));

  const setCorrectOption = (optIdx: number) => {
    setNewQ((prev) => ({
      ...prev,
      options: prev.options.map((o, i) => ({ ...o, isCorrect: i === optIdx })),
    }));
  };

  const updateOption = (optIdx: number, text: string) => {
    setNewQ((prev) => ({
      ...prev,
      options: prev.options.map((o, i) => (i === optIdx ? { ...o, text } : o)),
    }));
  };

  const handleSaveQuestions = async () => {
    if (!evaluationId) return;
    setSaving(true);
    try {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const hasOptions = form.type === "QCM" || form.type === "TRUE_FALSE" || form.type === "MIXED";
        await createQuestion.mutateAsync({
          evaluationId,
          data: {
            text: q.text,
            points: q.points,
            order: i + 1,
            options: hasOptions ? q.options.filter((o) => o.text.trim()) : undefined,
            correctAnswer: form.type === "SHORT_ANSWER" || form.type === "ESSAY"
              ? q.correctAnswer || undefined
              : undefined,
          },
        });
      }
      toast({ title: t("eval_form.questions_saved") });
      setStep("done");
    } catch {
      toast({ title: t("common.error"), description: t("eval_form.save_error"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const needsOptions = form.type === "QCM" || form.type === "TRUE_FALSE" || form.type === "MIXED";

  if (step === "done") {
    return (
      <AppLayout>
        <div className="p-8 max-w-lg mx-auto text-center space-y-6">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="text-2xl font-bold">{t("eval_form.done_title")}</h1>
          <p className="text-muted-foreground">
            {t("eval_form.done_desc", { count: questions.length })}
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link href="/dashboard/teacher">{t("eval_form.back_dashboard")}</Link>
            </Button>
            {evalCourseId && (
              <Button variant="outline" asChild>
                <Link href={`/courses/${evalCourseId}/edit`}>{t("eval_form.edit_course")}</Link>
              </Button>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="-ml-2">
            <Link href="/dashboard/teacher">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Link>
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("eval_form.new_title")}</h1>
          <p className="text-muted-foreground">{t("eval_form.new_desc")}</p>
        </div>

        {step === "info" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                {t("eval_form.step_info")}
              </CardTitle>
              <CardDescription>{t("eval_form.step_info_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEvaluation} className="space-y-5">
                <div className="space-y-2">
                  <Label>{t("eval_form.course")} *</Label>
                  <Select value={form.courseId} onValueChange={(v) => updateForm("courseId", v)}>
                    <SelectTrigger data-testid="select-eval-course">
                      <SelectValue placeholder={t("eval_form.course_placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eval-title">{t("eval_form.title")} *</Label>
                  <Input
                    id="eval-title"
                    value={form.title}
                    onChange={(e) => updateForm("title", e.target.value)}
                    placeholder={t("eval_form.title_placeholder")}
                    required
                    data-testid="input-eval-title"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{t("eval_form.type")}</Label>
                    <Select value={form.type} onValueChange={(v) => updateForm("type", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EV_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">{t("eval_form.duration_min")}</Label>
                    <Input
                      id="duration"
                      type="number"
                      min={5}
                      value={form.duration}
                      onChange={(e) => updateForm("duration", e.target.value)}
                      data-testid="input-eval-duration"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passMark">{t("eval_form.pass_mark")}</Label>
                    <Input
                      id="passMark"
                      type="number"
                      min={0}
                      max={100}
                      value={form.passMark}
                      onChange={(e) => updateForm("passMark", e.target.value)}
                      data-testid="input-eval-passmark"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={createEvaluation.isPending}
                    className="flex-1"
                    data-testid="button-submit-eval"
                  >
                    {createEvaluation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {createEvaluation.isPending ? t("common.saving") : t("eval_form.next_questions")}
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/teacher">{t("common.cancel")}</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === "questions" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("eval_form.step_questions")}</CardTitle>
                <CardDescription>{t("eval_form.step_questions_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h3 className="font-semibold text-sm">{t("eval_form.add_question")}</h3>
                  <div className="space-y-2">
                    <Label>{t("eval_form.question_text")} *</Label>
                    <Textarea
                      value={newQ.text}
                      onChange={(e) => setNewQ((p) => ({ ...p, text: e.target.value }))}
                      placeholder={t("eval_form.question_placeholder")}
                      rows={2}
                      data-testid="input-question-text"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="space-y-1 w-24">
                      <Label>{t("eval_form.points")}</Label>
                      <Input
                        type="number"
                        min={1}
                        value={newQ.points}
                        onChange={(e) => setNewQ((p) => ({ ...p, points: Number(e.target.value) }))}
                        data-testid="input-question-points"
                      />
                    </div>
                  </div>
                  {needsOptions && (
                    <div className="space-y-2">
                      <Label>{t("eval_form.options")} ({t("eval_form.click_correct")})</Label>
                      {newQ.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCorrectOption(i)}
                            className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                              opt.isCorrect
                                ? "bg-green-500 border-green-500 text-white"
                                : "border-muted-foreground hover:border-green-400"
                            }`}
                          >
                            {opt.isCorrect && <CheckCircle2 className="h-3.5 w-3.5" />}
                          </button>
                          <Input
                            value={opt.text}
                            onChange={(e) => updateOption(i, e.target.value)}
                            placeholder={`${t("eval_form.option")} ${i + 1}`}
                            data-testid={`input-option-${i}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {(form.type === "SHORT_ANSWER" || form.type === "ESSAY") && (
                    <div className="space-y-2">
                      <Label>{t("eval_form.expected_answer")}</Label>
                      <Textarea
                        value={newQ.correctAnswer}
                        onChange={(e) => setNewQ((p) => ({ ...p, correctAnswer: e.target.value }))}
                        placeholder={t("eval_form.expected_answer_placeholder")}
                        rows={2}
                      />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addQuestion}
                    className="w-full"
                    data-testid="button-add-question"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("eval_form.add_question_btn")}
                  </Button>
                </div>

                {questions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      {t("eval_form.question_list")}
                      <Badge variant="secondary">{questions.length}</Badge>
                    </h3>
                    {questions.map((q, idx) => (
                      <div key={q.id} className="flex items-start gap-3 p-3 border rounded-lg bg-background">
                        <GripVertical className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{idx + 1}. {q.text}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {q.points} {q.points > 1 ? t("eval_form.points") : t("eval_form.point")}
                          </p>
                          {q.options.some((o) => o.text) && (
                            <div className="mt-2 space-y-1">
                              {q.options.filter((o) => o.text).map((o, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-xs">
                                  <span className={`w-2 h-2 rounded-full ${o.isCorrect ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                                  <span className={o.isCorrect ? "font-medium text-green-700" : "text-muted-foreground"}>
                                    {o.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive shrink-0"
                          onClick={() => removeQuestion(q.id)}
                          data-testid={`button-remove-question-${idx}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />
                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveQuestions}
                    disabled={saving || questions.length === 0}
                    className="flex-1"
                    data-testid="button-save-questions"
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {saving ? t("common.saving") : t("eval_form.save_questions", { count: questions.length })}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setStep("done")}
                    data-testid="button-skip-questions"
                  >
                    {t("eval_form.skip_questions")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
