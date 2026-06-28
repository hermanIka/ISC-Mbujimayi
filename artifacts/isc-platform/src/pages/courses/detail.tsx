import { useState } from "react";
import { getThumbnailSrc } from "@/components/ThumbnailUpload";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetCourseById, useListModules, useCreateEnrollment, getGetCourseByIdQueryKey, getListModulesQueryKey } from "@workspace/api-client-react";
import type { Module } from "@workspace/api-client-react";
import { useRoute, Link, useLocation } from "@/lib/router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Clock, BookOpen, User, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CourseDetailPage() {
  const [, params] = useRoute("/courses/:id");
  const courseId = params?.id || "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [enrolling, setEnrollmentLoading] = useState(false);

  const { data: course, isLoading: courseLoading } = useGetCourseById(courseId, {
    query: { enabled: !!courseId, queryKey: getGetCourseByIdQueryKey(courseId) }
  });

  const { data: modulesData, isLoading: modulesLoading } = useListModules(courseId, {
    query: { enabled: !!courseId, queryKey: getListModulesQueryKey(courseId) }
  });

  const createEnrollment = useCreateEnrollment();

  const handleEnroll = async () => {
    try {
      setEnrollmentLoading(true);
      await createEnrollment.mutateAsync({ data: { courseId } });
      toast({ title: "Inscription réussie", description: "Vous êtes maintenant inscrit à ce cours." });
      setLocation(`/courses/${courseId}/learn`);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de vous inscrire à ce cours.", variant: "destructive" });
    } finally {
      setEnrollmentLoading(false);
    }
  };

  if (courseLoading) {
    return (
      <AppLayout>
        <div className="p-8 space-y-8 max-w-5xl mx-auto">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!course) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold">Cours introuvable</h2>
          <Button asChild className="mt-4">
            <Link href="/courses">Retour au catalogue</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="bg-muted/30 border-b">
        <div className="p-8 max-w-5xl mx-auto space-y-6">
          <Button variant="ghost" asChild className="mb-2 -ml-4" data-testid="button-back">
            <Link href="/courses"><ArrowLeft className="mr-2 h-4 w-4" /> Retour aux cours</Link>
          </Button>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-2/3 space-y-4">
              <div className="flex gap-2">
                <Badge>{course.level}</Badge>
                <Badge variant="outline">{course.filiere?.name}</Badge>
              </div>
              <h1 className="text-4xl font-bold tracking-tight">{course.title}</h1>
              <p className="text-lg text-muted-foreground">{course.description}</p>
              <div className="flex flex-wrap gap-6 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Prof. {course.teacher?.lastName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration} heures</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.moduleCount} modules</span>
                </div>
              </div>
            </div>
            <Card className="w-full md:w-1/3 sticky top-24">
              <div className="aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
                {course.thumbnail ? (
                  <img src={getThumbnailSrc(course.thumbnail)} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                    <BookOpen className="h-12 w-12 opacity-50" />
                  </div>
                )}
              </div>
              <CardContent className="pt-6">
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleEnroll} 
                  disabled={enrolling}
                  data-testid="button-enroll"
                >
                  {enrolling ? "Inscription en cours..." : "S'inscrire à ce cours"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-5xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold">Programme du cours</h2>
        {modulesLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <Accordion type="multiple" className="w-full" data-testid="modules-accordion">
            {(Array.isArray(modulesData) ? modulesData : [] as Module[]).map((module: Module, index: number) => (
              <AccordionItem key={module.id} value={module.id}>
                <AccordionTrigger className="text-left font-medium">
                  Module {index + 1}: {module.title}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground p-4 bg-muted/20 rounded-md mt-2">
                  <p>Ce module contient {module.chapterCount} chapitres.</p>
                  <p className="mt-2 text-sm italic">Inscrivez-vous pour accéder au contenu.</p>
                </AccordionContent>
              </AccordionItem>
            ))}
            {(!modulesData || (Array.isArray(modulesData) && modulesData.length === 0)) && (
              <p className="text-muted-foreground">Le programme de ce cours n'a pas encore été publié.</p>
            )}
          </Accordion>
        )}
      </div>
    </AppLayout>
  );
}
