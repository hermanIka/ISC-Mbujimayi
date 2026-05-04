import { AppLayout } from "@/components/layout/AppLayout";
import { useGetStudentAnalytics, useListEnrollments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CreditCard, GraduationCap, CheckSquare, Award, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface StudentAnalyticsData {
  enrolledCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  certificates: number;
  pendingPayments: number;
  confirmedPayments: number;
  totalAmountPaid: string;
  upcomingEvaluations: number;
  averageScore: number | null;
  courseProgress: Array<{
    courseId: string;
    courseTitle: string;
    progressPercent: number;
    enrolledAt: string;
  }>;
}

export default function StudentDashboard() {
  const { t } = useTranslation();
  const { data: rawAnalytics, isLoading: analyticsLoading } = useGetStudentAnalytics();
  const { data: enrollments, isLoading: enrollmentsLoading } = useListEnrollments();

  const analytics = rawAnalytics as unknown as StudentAnalyticsData | undefined;
  const enrollmentList = enrollments?.enrollments ?? [];

  const kpis = [
    { label: t("student.enrolled_courses"), value: analytics?.enrolledCourses ?? 0, icon: BookOpen },
    { label: t("student.completed_courses"), value: analytics?.completedCourses ?? 0, icon: GraduationCap },
    { label: t("student.certificates"), value: analytics?.certificates ?? 0, icon: CheckSquare },
    { label: t("student.pending_payments"), value: analytics?.pendingPayments ?? 0, icon: CreditCard },
  ];

  return (
    <AppLayout>
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("student.title")}</h1>
          <p className="text-muted-foreground">{t("student.subtitle")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {analytics && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {t("student.avg_score")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.averageScore != null ? `${analytics.averageScore}%` : "N/A"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t("student.total_paid")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Number(analytics.totalAmountPaid || 0).toLocaleString("fr-CD")} CDF
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  {t("student.upcoming_evals")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.upcomingEvaluations}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("student.recent_courses")}</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/courses">{t("student.see_all")}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {enrollmentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : enrollmentList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="mx-auto h-10 w-10 opacity-20 mb-2" />
                  <p className="text-sm">{t("student.no_courses")}</p>
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <Link href="/courses">{t("student.explore_courses")}</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  {enrollmentList.slice(0, 5).map((enrollment) => (
                    <div key={enrollment.id} className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-none truncate">
                            {enrollment.course?.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t("student.progress_label")}: {enrollment.progressPercent ?? 0}%
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild className="shrink-0">
                          <Link href={`/courses/${enrollment.courseId}/learn`}>
                            {t("student.continue")}
                          </Link>
                        </Button>
                      </div>
                      <Progress value={enrollment.progressPercent ?? 0} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("student.quick_actions")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {[
                { label: t("student.action_inscriptions"), href: "/inscriptions", icon: GraduationCap },
                { label: t("student.action_payments"), href: "/payments", icon: CreditCard },
                { label: t("student.action_certificates"), href: "/certificates", icon: Award },
                { label: t("student.action_courses"), href: "/courses", icon: BookOpen },
              ].map(({ label, href, icon: Icon }) => (
                <Button key={href} variant="outline" asChild className="h-auto py-4 flex-col gap-2">
                  <Link href={href}>
                    <Icon className="h-5 w-5" />
                    <span className="text-xs text-center leading-tight">{label}</span>
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
