import { AppLayout } from "@/components/layout/AppLayout";
import { useGetStudentAnalytics, useListEnrollments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CreditCard, GraduationCap, CheckSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

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
  const { data: rawAnalytics, isLoading: analyticsLoading } = useGetStudentAnalytics();
  const { data: enrollments, isLoading: enrollmentsLoading } = useListEnrollments();

  const analytics = rawAnalytics as unknown as StudentAnalyticsData | undefined;
  const enrollmentList = enrollments?.enrollments ?? [];

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Mon espace étudiant</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cours inscrits</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{analytics?.enrolledCourses ?? 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cours terminés</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{analytics?.completedCourses ?? 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certificats obtenus</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{analytics?.certificates ?? 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paiements en attente</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{analytics?.pendingPayments ?? 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Mes cours récents</CardTitle>
            </CardHeader>
            <CardContent>
              {enrollmentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {enrollmentList.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{enrollment.course?.title}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          Progression: {enrollment.progressPercent ?? 0}%
                        </div>
                      </div>
                      <div className="w-1/3">
                        <Progress value={enrollment.progressPercent ?? 0} className="h-2" />
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/courses/${enrollment.courseId}/learn`}>Continuer</Link>
                      </Button>
                    </div>
                  ))}
                  {enrollmentList.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucun cours en cours.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
