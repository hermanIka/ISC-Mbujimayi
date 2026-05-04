import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useCreateCourse,
  useListFilieres,
  getListCoursesQueryKey,
} from "@workspace/api-client-react";
import type { Filiere } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { Link, useLocation } from "@/lib/router";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export default function CourseNewPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const createCourse = useCreateCourse();
  const { data: filieresRaw } = useListFilieres();
  const filieres: Filiere[] = Array.isArray(filieresRaw)
    ? filieresRaw
    : (filieresRaw as unknown as { filieres?: Filiere[] })?.filieres ?? [];

  const [form, setForm] = useState({
    title: "",
    description: "",
    level: "BEGINNER",
    filiereId: "",
    duration: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast({ title: t("course_form.required_fields"), variant: "destructive" });
      return;
    }
    try {
      const result = await createCourse.mutateAsync({
        data: {
          title: form.title.trim(),
          description: form.description.trim(),
          level: form.level,
          filiereId: form.filiereId || undefined,
          duration: form.duration ? Number(form.duration) : undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
      toast({ title: t("course_form.created") });
      const courseId = (result as { id?: string })?.id;
      navigate(courseId ? `/courses/${courseId}/edit` : "/dashboard/teacher");
    } catch {
      toast({ title: t("common.error"), description: t("course_form.create_error"), variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="-ml-2">
            <Link href="/dashboard/teacher">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Link>
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("course_form.new_title")}</h1>
          <p className="text-muted-foreground">{t("course_form.new_desc")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t("course_form.basic_info")}
            </CardTitle>
            <CardDescription>{t("course_form.basic_info_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">{t("course_form.title")} *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder={t("course_form.title_placeholder")}
                  required
                  data-testid="input-course-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("course_form.description")} *</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder={t("course_form.description_placeholder")}
                  rows={4}
                  required
                  data-testid="input-course-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("course_form.level")}</Label>
                  <Select value={form.level} onValueChange={(v) => update("level", v)}>
                    <SelectTrigger data-testid="select-course-level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEGINNER">{t("course_form.level_beginner")}</SelectItem>
                      <SelectItem value="INTERMEDIATE">{t("course_form.level_intermediate")}</SelectItem>
                      <SelectItem value="ADVANCED">{t("course_form.level_advanced")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">{t("course_form.duration_min")}</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={1}
                    value={form.duration}
                    onChange={(e) => update("duration", e.target.value)}
                    placeholder="60"
                    data-testid="input-course-duration"
                  />
                </div>
              </div>

              {filieres.length > 0 && (
                <div className="space-y-2">
                  <Label>{t("course_form.filiere")}</Label>
                  <Select value={form.filiereId} onValueChange={(v) => update("filiereId", v)}>
                    <SelectTrigger data-testid="select-course-filiere">
                      <SelectValue placeholder={t("course_form.filiere_placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {filieres.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={createCourse.isPending}
                  className="flex-1"
                  data-testid="button-submit-course"
                >
                  {createCourse.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {createCourse.isPending ? t("common.saving") : t("course_form.create_and_edit")}
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/teacher">{t("common.cancel")}</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
