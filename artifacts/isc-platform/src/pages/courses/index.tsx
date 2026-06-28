import { useState } from "react";
import { getThumbnailSrc } from "@/components/ThumbnailUpload";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListCourses } from "@workspace/api-client-react";
import type { Course } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/lib/router";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListCourses({ status: "PUBLISHED" });

  const courses = data?.courses || [];
  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Catalogue de cours</h1>
            <p className="text-muted-foreground">Découvrez nos formations disponibles</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un cours..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-course-search"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="flex flex-col">
                <Skeleton className="h-48 w-full rounded-t-xl" />
                <CardHeader>
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
                <CardFooter className="mt-auto">
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))
          ) : filteredCourses.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              Aucun cours trouvé.
            </div>
          ) : (
            filteredCourses.map((course: Course) => (
              <Card key={course.id} className="flex flex-col hover-elevate transition-all duration-200">
                <div className="aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
                  <img
                    src={getThumbnailSrc(course.thumbnail)}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="secondary">{course.level}</Badge>
                    <span className="text-xs text-muted-foreground">{course.duration} heures</span>
                  </div>
                  <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                  <CardDescription>
                    Par {course.teacher?.firstName} {course.teacher?.lastName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description || "Aucune description disponible."}
                  </p>
                </CardContent>
                <CardFooter className="mt-auto pt-4">
                  <Button asChild className="w-full" data-testid={`button-view-course-${course.id}`}>
                    <Link href={`/courses/${course.id}`}>Voir les détails</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
