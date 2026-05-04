import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router";
import { useListCourses, useListFilieres } from "@workspace/api-client-react";
import type { Course } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, GraduationCap, Users, Star, Award, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, duration = 1500, triggered = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!triggered) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, triggered]);
  return count;
}

function AnimatedStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const [triggered, setTriggered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = useCountUp(value, 1800, triggered);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setTriggered(true); observer.disconnect(); }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-bold text-primary">{count}{suffix}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

const TESTIMONIALS = [
  {
    name: "Marie Tshala",
    program: "Comptabilité",
    year: "2023",
    text: "La plateforme ISC a complètement transformé ma façon d'apprendre. J'accède à mes cours n'importe où et je suis mes progrès en temps réel.",
    rating: 5,
  },
  {
    name: "Jean-Pierre Mukendi",
    program: "Informatique de Gestion",
    year: "2022",
    text: "Les évaluations en ligne sont très pratiques. J'ai obtenu mon certificat de fin de cours en quelques semaines. Excellente expérience!",
    rating: 5,
  },
  {
    name: "Grace Kabamba",
    program: "Marketing",
    year: "2023",
    text: "L'ISC Mbujimayi m'a préparée pour le monde professionnel. Les enseignants sont compétents et la plateforme digitale est très intuitive.",
    rating: 5,
  },
];

export default function Home() {
  const { t } = useTranslation();
  const { data: coursesData, isLoading: coursesLoading } = useListCourses({ status: "PUBLISHED", pageSize: 3 });
  const { data: filieresData, isLoading: filieresLoading } = useListFilieres();

  const courses = coursesData?.courses || [];
  const filieres = filieresData || [];

  return (
    <AppLayout>
      <div className="relative flex flex-col items-center justify-center min-h-[65vh] px-4 text-center bg-gradient-to-br from-primary/5 via-background to-primary/10 border-b overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/8 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
        <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground max-w-3xl mb-6 leading-tight">
            {t("home.hero_title")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-8">
            {t("home.hero_subtitle")}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="shadow-lg hover:shadow-primary/25 hover:shadow-xl transition-shadow">
              <Link href="/courses">{t("home.explore_programs")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/sign-up">{t("home.register_now")}</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="py-12 border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <AnimatedStat value={30} suffix="+" label={t("about.stat_years")} />
          <AnimatedStat value={5000} suffix="+" label={t("about.stat_graduates")} />
          <AnimatedStat value={5} suffix="" label={t("about.stat_programs")} />
          <AnimatedStat value={50} suffix="+" label={t("about.stat_teachers")} />
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto space-y-16 py-16">
        <section className="space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{t("home.our_filieres")}</h2>
              <p className="text-muted-foreground">{t("home.filieres_subtitle")}</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/sign-up">{t("nav.register")}</Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filieresLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))
            ) : filieres.length === 0 ? (
              [
                { name: "Comptabilité", code: "COMPTA", icon: Award },
                { name: "Marketing", code: "MKTG", icon: Globe },
                { name: "Informatique de Gestion", code: "INFO", icon: BookOpen },
              ].map((f) => (
                <Card key={f.code} className="hover-elevate">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <f.icon className="h-8 w-8 text-primary mb-2" />
                      <Badge variant="secondary">{f.code}</Badge>
                    </div>
                    <CardTitle>{f.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Formation professionnelle de 3 ans reconnue par l'État.</p>
                  </CardContent>
                </Card>
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
                      <span className="flex items-center gap-1"><Users className="h-3 w-3"/> {filiere.studentCount} {t("programs.students")}</span>
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
              <h2 className="text-3xl font-bold tracking-tight">{t("home.featured_courses")}</h2>
              <p className="text-muted-foreground">{t("home.courses_subtitle")}</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/courses">{t("home.view_all_courses")}</Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coursesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="flex flex-col">
                  <Skeleton className="h-48 w-full rounded-t-xl" />
                  <CardHeader><Skeleton className="h-6 w-2/3" /></CardHeader>
                  <CardContent><Skeleton className="h-16 w-full" /></CardContent>
                </Card>
              ))
            ) : courses.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                {t("courses.no_courses")}
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
                    <CardDescription>Par {course.teacher?.firstName} {course.teacher?.lastName}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                  </CardContent>
                  <CardFooter className="mt-auto pt-4">
                    <Button asChild className="w-full">
                      <Link href={`/courses/${course.id}`}>{t("home.view_details")}</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </section>

        <section className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t("home.testimonials_title")}</h2>
            <p className="text-muted-foreground">{t("home.testimonials_subtitle")}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <Card key={testimonial.name} className="relative">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground italic">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.program} · Promotion {testimonial.year}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
