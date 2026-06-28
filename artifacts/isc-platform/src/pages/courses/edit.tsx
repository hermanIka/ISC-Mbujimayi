import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "@/lib/router";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useGetCourseById,
  useUpdateCourse,
  useListModules,
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
  useCreateChapter,
  useUpdateChapter,
  useDeleteChapter,
  getGetCourseByIdQueryKey,
  getListModulesQueryKey,
} from "@workspace/api-client-react";
import type { Module, Chapter } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Plus, Trash2, Loader2, BookOpen, FileText,
  PlayCircle, Presentation, Edit2, ChevronDown, ChevronUp, Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PUBLISHED: "bg-green-100 text-green-700",
  ARCHIVED: "bg-orange-100 text-orange-700",
};

const CHAPTER_ICONS: Record<string, React.ElementType> = {
  VIDEO: PlayCircle,
  PDF: FileText,
  PRESENTATION: Presentation,
  TEXT: BookOpen,
};

export default function CourseEditPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/courses/:id/edit");
  const courseId = params?.id || "";

  const { data: course, isLoading } = useGetCourseById(courseId, {
    query: { enabled: !!courseId, queryKey: getGetCourseByIdQueryKey(courseId) },
  });
  const { data: modulesRaw, isLoading: modulesLoading } = useListModules(courseId, {
    query: { enabled: !!courseId, queryKey: getListModulesQueryKey(courseId) },
  });
  const modules: Module[] = Array.isArray(modulesRaw)
    ? modulesRaw
    : (modulesRaw as unknown as { modules?: Module[] })?.modules ?? [];

  const updateCourse = useUpdateCourse();
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();
  const createChapter = useCreateChapter();
  const updateChapter = useUpdateChapter();
  const deleteChapter = useDeleteChapter();

  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    level: "",
    status: "",
    thumbnail: "",
    duration: "",
  });
  const [courseFormDirty, setCourseFormDirty] = useState(false);

  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);

  const [newChapterState, setNewChapterState] = useState<Record<string, {
    title: string; type: string; content: string; duration: string;
  }>>({});
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [chapterDialogOpen, setChapterDialogOpen] = useState<string | null>(null);

  const [editingChapter, setEditingChapter] = useState<{
    chapter: Chapter; moduleId: string;
  } | null>(null);

  const invCourse = () => queryClient.invalidateQueries({ queryKey: getGetCourseByIdQueryKey(courseId) });
  const invModules = () => queryClient.invalidateQueries({ queryKey: getListModulesQueryKey(courseId) });

  useEffect(() => {
    if (course && !courseFormDirty) {
      setCourseForm({
        title: course.title ?? "",
        description: course.description ?? "",
        level: course.level ?? "BEGINNER",
        status: course.status ?? "DRAFT",
        thumbnail: course.thumbnail ?? "",
        duration: course.duration != null ? String(course.duration) : "",
      });
      setCourseFormDirty(true);
    }
  }, [course, courseFormDirty]);

  const [submitting, setSubmitting] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    try {
      await fetch(`/api/courses/${courseId}/submit`, { method: "PUT",
        headers: { "X-Demo-User-Id": localStorage.getItem("isc_demo_user_id") ?? "" },
      });
      await invCourse();
      toast({ title: "Cours soumis pour validation !", description: "L'administrateur va examiner votre cours." });
    } catch {
      toast({ title: "Erreur", description: "Impossible de soumettre le cours.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCourse.mutateAsync({
        id: courseId,
        data: {
          title: courseForm.title,
          description: courseForm.description,
          level: courseForm.level,
          status: courseForm.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
          thumbnail: courseForm.thumbnail || undefined,
          duration: courseForm.duration ? Number(courseForm.duration) : undefined,
        },
      });
      invCourse();
      toast({ title: t("course_edit.saved") });
    } catch {
      toast({ title: t("common.error"), description: t("course_edit.save_error"), variant: "destructive" });
    }
  };

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    setAddingModule(true);
    try {
      await createModule.mutateAsync({
        courseId,
        data: { title: newModuleTitle.trim(), order: modules.length + 1 },
      });
      setNewModuleTitle("");
      invModules();
      toast({ title: t("course_edit.module_added") });
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setAddingModule(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm(t("course_edit.confirm_delete_module"))) return;
    try {
      await deleteModule.mutateAsync({ id: moduleId });
      invModules();
      toast({ title: t("course_edit.module_deleted") });
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  };

  const handleAddChapter = async (moduleId: string) => {
    const state = newChapterState[moduleId];
    if (!state?.title?.trim()) return;
    try {
      await createChapter.mutateAsync({
        moduleId,
        data: {
          title: state.title.trim(),
          type: (state.type || "TEXT") as "VIDEO" | "PDF" | "PRESENTATION" | "TEXT",
          content: state.content || undefined,
          duration: state.duration ? Number(state.duration) : undefined,
          order: 999,
        },
      });
      setNewChapterState((prev) => ({ ...prev, [moduleId]: { title: "", type: "TEXT", content: "", duration: "" } }));
      setChapterDialogOpen(null);
      invCourse();
      toast({ title: t("course_edit.chapter_added") });
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm(t("course_edit.confirm_delete_chapter"))) return;
    try {
      await deleteChapter.mutateAsync({ id: chapterId });
      invCourse();
      toast({ title: t("course_edit.chapter_deleted") });
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  };

  const handleSaveChapter = async () => {
    if (!editingChapter) return;
    const { chapter } = editingChapter;
    try {
      await updateChapter.mutateAsync({
        id: chapter.id,
        data: {
          title: chapter.title,
          type: chapter.type as "VIDEO" | "PDF" | "PRESENTATION" | "TEXT",
          content: chapter.content ?? undefined,
          duration: chapter.duration ?? undefined,
        },
      });
      invCourse();
      setEditingChapter(null);
      toast({ title: t("course_edit.chapter_saved") });
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  };

  const toggleModule = (id: string) =>
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const courseModules = (course as unknown as { modules?: Array<Module & { chapters: Chapter[] }> })?.modules ?? [];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 space-y-4 max-w-4xl mx-auto">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="-ml-2">
            <Link href="/dashboard/teacher">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Link>
          </Button>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("course_edit.title")}</h1>
            <p className="text-muted-foreground line-clamp-1">{course?.title}</p>
          </div>
          <Badge className={STATUS_COLORS[course?.status ?? "DRAFT"]}>
            {course?.status ?? "DRAFT"}
          </Badge>
        </div>

        <Tabs defaultValue="info">
          <TabsList className="grid grid-cols-2 w-full max-w-xs">
            <TabsTrigger value="info">{t("course_edit.tab_info")}</TabsTrigger>
            <TabsTrigger value="content">{t("course_edit.tab_content")}</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("course_edit.basic_info")}</CardTitle>
                <CardDescription>{t("course_edit.basic_info_desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveCourse} className="space-y-5">
                  <div className="space-y-2">
                    <Label>{t("course_form.title")} *</Label>
                    <Input
                      value={courseForm.title}
                      onChange={(e) => setCourseForm((p) => ({ ...p, title: e.target.value }))}
                      required
                      data-testid="input-edit-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("course_form.description")} *</Label>
                    <Textarea
                      value={courseForm.description}
                      onChange={(e) => setCourseForm((p) => ({ ...p, description: e.target.value }))}
                      rows={4}
                      required
                      data-testid="input-edit-description"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{t("course_form.level")}</Label>
                      <Select value={courseForm.level} onValueChange={(v) => setCourseForm((p) => ({ ...p, level: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BEGINNER">{t("course_form.level_beginner")}</SelectItem>
                          <SelectItem value="INTERMEDIATE">{t("course_form.level_intermediate")}</SelectItem>
                          <SelectItem value="ADVANCED">{t("course_form.level_advanced")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("course_edit.status")}</Label>
                      <Select value={courseForm.status} onValueChange={(v) => setCourseForm((p) => ({ ...p, status: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">DRAFT</SelectItem>
                          <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
                          <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("course_form.duration_min")}</Label>
                      <Input
                        type="number"
                        min={1}
                        value={courseForm.duration}
                        onChange={(e) => setCourseForm((p) => ({ ...p, duration: e.target.value }))}
                        data-testid="input-edit-duration"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("course_edit.thumbnail_url")}</Label>
                    <Input
                      value={courseForm.thumbnail}
                      onChange={(e) => setCourseForm((p) => ({ ...p, thumbnail: e.target.value }))}
                      placeholder="https://..."
                      data-testid="input-edit-thumbnail"
                    />
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <Button type="submit" disabled={updateCourse.isPending} data-testid="button-save-course">
                      {updateCourse.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {updateCourse.isPending ? t("common.saving") : t("common.save")}
                    </Button>
                    {(course?.status === "DRAFT" || course?.status === "REJECTED") && (
                      <Button
                        type="button"
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={submitting}
                        onClick={handleSubmitForReview}
                      >
                        {submitting
                          ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          : <Send className="mr-2 h-4 w-4" />}
                        Soumettre pour validation
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("course_edit.modules_title")}</CardTitle>
                <CardDescription>{t("course_edit.modules_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    placeholder={t("course_edit.module_name_placeholder")}
                    onKeyDown={(e) => e.key === "Enter" && handleAddModule()}
                    data-testid="input-new-module"
                  />
                  <Button onClick={handleAddModule} disabled={addingModule || !newModuleTitle.trim()} data-testid="button-add-module">
                    {addingModule ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>

                {modulesLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : courseModules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="mx-auto h-10 w-10 opacity-20 mb-2" />
                    <p className="text-sm">{t("course_edit.no_modules")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {courseModules.map((mod, modIdx) => {
                      const isExpanded = expandedModules.has(mod.id);
                      const chapters: Chapter[] = mod.chapters ?? [];
                      const nc = newChapterState[mod.id] ?? { title: "", type: "TEXT", content: "", duration: "" };
                      return (
                        <div key={mod.id} className="border rounded-lg overflow-hidden">
                          <div
                            className="flex items-center justify-between px-4 py-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => toggleModule(mod.id)}
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              <span className="font-medium text-sm">
                                {modIdx + 1}. {mod.title}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {chapters.length} {t("course_edit.chapters_count")}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={(e) => { e.stopPropagation(); handleDeleteModule(mod.id); }}
                              data-testid={`button-delete-module-${modIdx}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {isExpanded && (
                            <div className="divide-y">
                              {chapters.map((ch, chIdx) => {
                                const Icon = CHAPTER_ICONS[ch.type] ?? BookOpen;
                                return (
                                  <div key={ch.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 group">
                                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{ch.title}</p>
                                      <p className="text-xs text-muted-foreground">{ch.type}</p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => setEditingChapter({ chapter: ch, moduleId: mod.id })}
                                        data-testid={`button-edit-chapter-${chIdx}`}
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive"
                                        onClick={() => handleDeleteChapter(ch.id)}
                                        data-testid={`button-delete-chapter-${chIdx}`}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}

                              <div className="p-4 bg-muted/10">
                                <Dialog open={chapterDialogOpen === mod.id} onOpenChange={(o) => setChapterDialogOpen(o ? mod.id : null)}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full" data-testid={`button-add-chapter-${modIdx}`}>
                                      <Plus className="mr-2 h-3.5 w-3.5" />
                                      {t("course_edit.add_chapter")}
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>{t("course_edit.add_chapter_to", { module: mod.title })}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-2">
                                      <div className="space-y-2">
                                        <Label>{t("course_edit.chapter_title")} *</Label>
                                        <Input
                                          value={nc.title}
                                          onChange={(e) => setNewChapterState((p) => ({ ...p, [mod.id]: { ...nc, title: e.target.value } }))}
                                          placeholder={t("course_edit.chapter_title_placeholder")}
                                          data-testid="input-chapter-title"
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                          <Label>{t("course_edit.chapter_type")}</Label>
                                          <Select
                                            value={nc.type}
                                            onValueChange={(v) => setNewChapterState((p) => ({ ...p, [mod.id]: { ...nc, type: v } }))}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {["VIDEO", "PDF", "TEXT", "PRESENTATION"].map((t) => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-2">
                                          <Label>{t("course_edit.chapter_duration_min")}</Label>
                                          <Input
                                            type="number"
                                            min={1}
                                            value={nc.duration}
                                            onChange={(e) => setNewChapterState((p) => ({ ...p, [mod.id]: { ...nc, duration: e.target.value } }))}
                                            data-testid="input-chapter-duration"
                                          />
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>{t("course_edit.chapter_content_url")}</Label>
                                        <Input
                                          value={nc.content}
                                          onChange={(e) => setNewChapterState((p) => ({ ...p, [mod.id]: { ...nc, content: e.target.value } }))}
                                          placeholder="https://..."
                                          data-testid="input-chapter-content"
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button
                                        onClick={() => handleAddChapter(mod.id)}
                                        disabled={!nc.title.trim() || createChapter.isPending}
                                        data-testid="button-confirm-add-chapter"
                                      >
                                        {createChapter.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {t("course_edit.add_chapter")}
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {editingChapter && (
        <Dialog open onOpenChange={() => setEditingChapter(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("course_edit.edit_chapter")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>{t("course_edit.chapter_title")}</Label>
                <Input
                  value={editingChapter.chapter.title}
                  onChange={(e) => setEditingChapter((p) => p ? { ...p, chapter: { ...p.chapter, title: e.target.value } } : null)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("course_edit.chapter_type")}</Label>
                  <Select
                    value={editingChapter.chapter.type}
                    onValueChange={(v) => setEditingChapter((p) => p ? { ...p, chapter: { ...p.chapter, type: v as "VIDEO" | "PDF" | "PRESENTATION" | "TEXT" } } : null)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["VIDEO", "PDF", "TEXT", "PRESENTATION"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("course_edit.chapter_duration_min")}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editingChapter.chapter.duration ?? ""}
                    onChange={(e) => setEditingChapter((p) => p ? { ...p, chapter: { ...p.chapter, duration: Number(e.target.value) } } : null)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("course_edit.chapter_content_url")}</Label>
                <Input
                  value={editingChapter.chapter.content ?? ""}
                  onChange={(e) => setEditingChapter((p) => p ? { ...p, chapter: { ...p.chapter, content: e.target.value } } : null)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveChapter} disabled={updateChapter.isPending}>
                {updateChapter.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
