import { useState } from "react";
import { useRoute, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useGetCourseById,
  useMarkChapterProgress,
  getGetCourseByIdQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, PlayCircle, FileText, CheckCircle2, MessageSquare, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [, params] = useRoute("/courses/:id/learn");
  const courseId = params?.id || "";
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: course, isLoading: courseLoading } = useGetCourseById(courseId, {
    query: { enabled: !!courseId, queryKey: getGetCourseByIdQueryKey(courseId) },
  });

  const markProgress = useMarkChapterProgress();

  const courseWithModules = course as unknown as CourseWithModules & typeof course;
  const allModules: CourseModule[] = courseWithModules?.modules ?? [];
  const allChapters: CourseChapter[] = allModules.flatMap((m) => m.chapters ?? []);
  const activeChapter: CourseChapter | null = allChapters.find((c) => c.id === activeChapterId) ?? allChapters[0] ?? null;

  const handleMarkComplete = async (chapterId: string) => {
    try {
      await markProgress.mutateAsync({
        chapterId,
        data: { enrollmentId: "placeholder", completed: true },
      });
      toast({ title: "Chapitre terminé" });
    } catch {
      toast({ title: "Erreur", description: "Impossible de marquer ce chapitre", variant: "destructive" });
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
        {/* Sidebar */}
        <div className="w-80 border-r bg-muted/20 flex-col hidden md:flex">
          <div className="p-4 border-b">
            <Button variant="ghost" asChild className="mb-2 -ml-2" data-testid="button-back-course">
              <Link href={`/courses/${courseId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
              </Link>
            </Button>
            <h2 className="font-bold line-clamp-2 text-sm">{course?.title}</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {allModules.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun module disponible.</p>
              ) : (
                allModules.map((module) => (
                  <div key={module.id} className="space-y-2">
                    <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                      {module.title}
                    </h3>
                    <div className="space-y-1">
                      {(module.chapters ?? []).map((chapter) => (
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
                          {chapter.type === "VIDEO" ? (
                            <PlayCircle className="h-4 w-4 shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 shrink-0" />
                          )}
                          <span className="line-clamp-2 flex-1">{chapter.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b p-4 flex items-center justify-between bg-background shrink-0">
            <h1 className="text-lg font-bold truncate">
              {activeChapter?.title ?? "Sélectionnez un chapitre"}
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/courses/${courseId}/forum`}>
                  <MessageSquare className="mr-2 h-4 w-4" /> Forum
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/courses/${courseId}/evaluations`}>
                  <ClipboardList className="mr-2 h-4 w-4" /> Évaluations
                </Link>
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 md:p-12 max-w-4xl mx-auto space-y-8">
              {activeChapter ? (
                <>
                  {activeChapter.type === "VIDEO" && activeChapter.content && (
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <iframe
                        src={activeChapter.content}
                        className="w-full h-full"
                        allowFullScreen
                        title={activeChapter.title}
                      />
                    </div>
                  )}
                  {activeChapter.type === "VIDEO" && !activeChapter.content && (
                    <div className="aspect-video bg-black rounded-lg flex items-center justify-center text-white">
                      <span className="opacity-50">Contenu vidéo non disponible</span>
                    </div>
                  )}
                  {activeChapter.type === "PDF" && (
                    <div className="border rounded-lg p-8 text-center bg-muted/20">
                      <FileText className="h-16 w-16 mx-auto text-primary mb-4" />
                      <p className="text-muted-foreground">Document PDF disponible</p>
                      {activeChapter.content && (
                        <Button asChild className="mt-4" variant="outline">
                          <a href={activeChapter.content} target="_blank" rel="noopener noreferrer">
                            Ouvrir le document
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                  <div className="prose max-w-none dark:prose-invert">
                    <p>{activeChapter.content && activeChapter.type === "TEXT"
                      ? activeChapter.content
                      : "Consultez le contenu multimédia ci-dessus."}
                    </p>
                  </div>
                  <div className="pt-8 border-t flex justify-end">
                    <Button
                      onClick={() => handleMarkComplete(activeChapter.id)}
                      disabled={markProgress.isPending}
                      data-testid="button-mark-complete"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {markProgress.isPending ? "En cours..." : "Marquer comme terminé"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  Veuillez sélectionner un chapitre dans le menu pour commencer.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </AppLayout>
  );
}
