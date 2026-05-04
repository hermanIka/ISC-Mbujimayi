import { useState } from "react";
import { useRoute, Link } from "@/lib/router";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useGetCourseById,
  useMarkChapterProgress,
  useListEnrollments,
  getGetCourseByIdQueryKey,
} from "@workspace/api-client-react";
import type { Enrollment } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, PlayCircle, FileText, CheckCircle2, MessageSquare,
  ClipboardList, BookOpen, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";
import ReactPlayer from "react-player";

interface CourseChapter {
  id: string;
  title: string;
  type: "VIDEO" | "PDF" | "TEXT" | "PRESENTATION";
  content: string | null;
  order: number;
}

interface CourseModule {
  id: string;
  title: string;
  order: number;
  chapters: CourseChapter[];
}

interface CourseWithModules {
  modules: CourseModule[];
}

export default function CourseLearnPage() {
  const { t } = useTranslation();
  const [, params] = useRoute("/courses/:id/learn");
  const courseId = params?.id || "";
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data: course, isLoading: courseLoading } = useGetCourseById(courseId, {
    query: { enabled: !!courseId, queryKey: getGetCourseByIdQueryKey(courseId) },
  });

  const { data: enrollmentsData } = useListEnrollments();
  const enrollments: Enrollment[] = enrollmentsData?.enrollments ?? [];
  const enrollment = enrollments.find((e) => e.courseId === courseId);
  const enrollmentId = enrollment?.id;

  const markProgress = useMarkChapterProgress();

  const courseWithModules = course as unknown as CourseWithModules & typeof course;
  const allModules: CourseModule[] = courseWithModules?.modules ?? [];
  const allChapters: CourseChapter[] = allModules.flatMap((m) => m.chapters ?? []);
  const activeChapter: CourseChapter | null =
    allChapters.find((c) => c.id === activeChapterId) ?? allChapters[0] ?? null;

  const totalChapters = allChapters.length;
  const completedCount = completedChapters.size;
  const progressPercent = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

  const handleMarkComplete = async (chapterId: string) => {
    if (!enrollmentId) {
      toast({
        title: t("learn.not_enrolled_title"),
        description: t("learn.not_enrolled_desc"),
        variant: "destructive",
      });
      return;
    }
    try {
      await markProgress.mutateAsync({
        chapterId,
        data: { enrollmentId, completed: true },
      });
      setCompletedChapters((prev) => new Set([...prev, chapterId]));
      toast({ title: t("learn.chapter_done") });

      const idx = allChapters.findIndex((c) => c.id === chapterId);
      if (idx !== -1 && idx < allChapters.length - 1) {
        setActiveChapterId(allChapters[idx + 1].id);
      }
    } catch {
      toast({ title: t("common.error"), description: t("learn.mark_error"), variant: "destructive" });
    }
  };

  if (courseLoading) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-4rem)]">
          <div className="w-80 border-r bg-muted/20 p-4 space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="flex-1 p-8 space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-80 border-r bg-muted/20 flex-col hidden md:flex">
          <div className="p-4 border-b space-y-3">
            <Button variant="ghost" asChild className="-ml-2" data-testid="button-back-course">
              <Link href={`/courses/${courseId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("learn.back")}
              </Link>
            </Button>
            <h2 className="font-bold line-clamp-2 text-sm">{course?.title}</h2>
            {!enrollmentId && (
              <div className="flex items-center gap-1.5 text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-2 py-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {t("learn.not_enrolled_warning")}
              </div>
            )}
            {totalChapters > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t("learn.progress")}</span>
                  <span>{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-1.5" />
              </div>
            )}
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {allModules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="mx-auto h-8 w-8 opacity-20 mb-2" />
                  <p className="text-sm">{t("learn.no_modules")}</p>
                </div>
              ) : (
                allModules.map((module) => (
                  <div key={module.id} className="space-y-2">
                    <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                      {module.title}
                    </h3>
                    <div className="space-y-1">
                      {(module.chapters ?? []).map((chapter) => {
                        const isDone = completedChapters.has(chapter.id);
                        return (
                          <button
                            key={chapter.id}
                            className={`w-full flex items-center gap-2 p-2 rounded-md text-sm transition-colors text-left ${
                              activeChapter?.id === chapter.id
                                ? "bg-primary/10 text-primary font-medium"
                                : "hover:bg-muted"
                            }`}
                            onClick={() => setActiveChapterId(chapter.id)}
                            data-testid={`chapter-btn-${chapter.id}`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                            ) : chapter.type === "VIDEO" ? (
                              <PlayCircle className="h-4 w-4 shrink-0" />
                            ) : (
                              <FileText className="h-4 w-4 shrink-0" />
                            )}
                            <span className="line-clamp-2 flex-1">{chapter.title}</span>
                            {chapter.type !== "TEXT" && (
                              <Badge variant="outline" className="text-xs px-1 py-0 shrink-0">
                                {chapter.type}
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b p-4 flex items-center justify-between bg-background shrink-0 gap-4">
            <h1 className="text-lg font-bold truncate">
              {activeChapter?.title ?? t("learn.select_chapter")}
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/courses/${courseId}/forum`}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {t("learn.forum")}
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/courses/${courseId}/evaluations`}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  {t("learn.evaluations")}
                </Link>
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 md:p-12 max-w-4xl mx-auto space-y-8">
              {activeChapter ? (
                <>
                  {activeChapter.type === "VIDEO" && activeChapter.content && (
                    <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                      {typeof ReactPlayer.canPlay === "function" && ReactPlayer.canPlay(activeChapter.content) ? (
                        <ReactPlayer
                          src={activeChapter.content}
                          width="100%"
                          height="100%"
                          controls
                          onEnded={() => {
                            if (enrollmentId && !completedChapters.has(activeChapter.id)) {
                              void handleMarkComplete(activeChapter.id);
                            }
                          }}
                        />
                      ) : (
                        <iframe
                          src={activeChapter.content}
                          className="w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          title={activeChapter.title}
                        />
                      )}
                    </div>
                  )}
                  {activeChapter.type === "VIDEO" && !activeChapter.content && (
                    <div className="aspect-video bg-black rounded-xl flex items-center justify-center text-white">
                      <div className="text-center opacity-50">
                        <PlayCircle className="mx-auto h-16 w-16 mb-3" />
                        <p>{t("learn.video_unavailable")}</p>
                      </div>
                    </div>
                  )}
                  {activeChapter.type === "PDF" && (
                    <div className="border rounded-xl p-10 text-center bg-muted/20 space-y-4">
                      <FileText className="h-16 w-16 mx-auto text-primary" />
                      <p className="text-muted-foreground">{t("learn.pdf_available")}</p>
                      {activeChapter.content && (
                        <>
                          <Button asChild variant="outline">
                            <a href={activeChapter.content} target="_blank" rel="noopener noreferrer">
                              {t("learn.open_document")}
                            </a>
                          </Button>
                          <div className="mt-4 border rounded-lg overflow-hidden" style={{ height: 480 }}>
                            <iframe
                              src={`${activeChapter.content}#toolbar=0`}
                              className="w-full h-full"
                              title={activeChapter.title}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {activeChapter.type === "PRESENTATION" && activeChapter.content && (
                    <div className="border rounded-xl overflow-hidden" style={{ height: 480 }}>
                      <iframe
                        src={activeChapter.content}
                        className="w-full h-full"
                        title={activeChapter.title}
                        allowFullScreen
                      />
                    </div>
                  )}
                  {(activeChapter.type === "TEXT" || (activeChapter.type !== "VIDEO" && activeChapter.type !== "PDF" && activeChapter.type !== "PRESENTATION")) && (
                    <div className="prose max-w-none dark:prose-invert">
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {activeChapter.content || t("learn.no_text_content")}
                      </p>
                    </div>
                  )}
                  {activeChapter.type === "VIDEO" && activeChapter.content && (
                    <div className="prose max-w-none dark:prose-invert text-muted-foreground text-sm">
                      <p>{t("learn.multimedia_note")}</p>
                    </div>
                  )}

                  <div className="pt-8 border-t flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {completedChapters.has(activeChapter.id) && (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                          {t("learn.already_done")}
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={() => handleMarkComplete(activeChapter.id)}
                      disabled={markProgress.isPending || completedChapters.has(activeChapter.id)}
                      data-testid="button-mark-complete"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {markProgress.isPending
                        ? t("learn.marking")
                        : completedChapters.has(activeChapter.id)
                        ? t("learn.marked_done")
                        : t("learn.mark_complete")}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  <BookOpen className="mx-auto h-16 w-16 opacity-20 mb-4" />
                  <p>{t("learn.select_chapter_prompt")}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </AppLayout>
  );
}
