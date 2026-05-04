import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router";
import { useListCourses, useListFilieres } from "@workspace/api-client-react";
import type { Course } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, GraduationCap, Users } from "lucide-react";

export default function Home() {
  const { data: coursesData, isLoading: coursesLoading } = useListCourses({ status: "PUBLISHED", pageSize: 3 });
  const { data: filieresData, isLoading: filieresLoading } = useListFilieres();

  const courses = coursesData?.courses || [];
  const filieres = filieresData || [];

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center bg-muted/20 border-b">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground max-w-3xl mb-6">
          L'Excellence Académique à l'Ère du Numérique
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-8">
          Bienvenue sur la plateforme digitale de l'Institut Supérieur de Commerce Mbujimayi. 
          Gérez votre parcours, accédez à vos cours et effectuez vos paiements en toute simplicité.
        </p>
        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/courses">Explorer les programmes</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/sign-up">S'inscrire maintenant</Link>
          </Button>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto space-y-16 py-16">
        <section className="space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Nos Filières</h2>
              <p className="text-muted-foreground">Découvrez nos domaines d'expertise</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/sign-up">S'inscrire</Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filieresLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))
            ) : (
              filieres.slice(0, 6).map((filiere) => (
                <Card key={filiere.id} className="hover-elevate">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <GraduationCap className="h-8 w-8 text-primary mb-2" />
                      <Badge variant="secondary">{filiere.code}</Badge>
                    </div>
                    <CardTitle>{filiere.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{filiere.description}</p>
                    <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground font-medium">
                      <span>{filiere.duration} ans</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3"/> {filiere.studentCount} inscrits</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Cours Récents</h2>
              <p className="text-muted-foreground">Commencez à apprendre dès aujourd'hui</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/courses">Voir tout</Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coursesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="flex flex-col">
                  <Skeleton className="h-48 w-full rounded-t-xl" />
                  <CardHeader>
                    <Skeleton className="h-6 w-2/3" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : courses.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                Aucun cours disponible pour le moment.
              </div>
            ) : (
              courses.map((course: Course) => (
                <Card key={course.id} className="flex flex-col hover-elevate transition-all duration-200">
                  <div className="aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                        <BookOpen className="h-12 w-12 opacity-50" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{course.level}</Badge>
                      <Badge variant="outline">{course.filiere?.code}</Badge>
                    </div>
                    <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                    <CardDescription>
                      Par {course.teacher?.firstName} {course.teacher?.lastName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description || "Aucune description."}
                    </p>
                  </CardContent>
                  <CardFooter className="mt-auto pt-4">
                    <Button asChild className="w-full">
                      <Link href={`/courses/${course.id}`}>Voir les détails</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
