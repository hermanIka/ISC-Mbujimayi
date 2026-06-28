import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useGetStudentAnalytics,
  useListEnrollments,
  useListPayments,
  useListCourses,
} from "@workspace/api-client-react";
import type { Payment } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  CreditCard,
  GraduationCap,
  CheckSquare,
  Award,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
  Plus,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  INSCRIPTION_FEE: "Frais d'inscription",
  COURSE_FEE: "Frais de cours",
  EXAM_FEE: "Frais d'examen",
  OTHER: "Autre",
};

const OPERATOR_LABELS: Record<string, string> = {
  MTN_MONEY: "MTN",
  AIRTEL_MONEY: "Airtel",
  ORANGE_MONEY: "Orange",
};

function PaymentStatusBadge({ status }: { status: string }) {
  if (status === "CONFIRMED") {
    return (
      <Badge className="bg-green-50 text-green-700 border-green-200 gap-1 font-medium" variant="outline">
        <CheckCircle2 className="h-3 w-3" /> Confirmé
      </Badge>
    );
  }
  if (status === "INITIATED" || status === "PENDING") {
    return (
      <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1 font-medium" variant="outline">
        <Clock className="h-3 w-3" /> En attente
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-50 text-red-700 border-red-200 gap-1 font-medium" variant="outline">
      <XCircle className="h-3 w-3" /> Échoué
    </Badge>
  );
}

export default function StudentDashboard() {
  const { t } = useTranslation();
  const { data: rawAnalytics, isLoading: analyticsLoading } = useGetStudentAnalytics();
  const { data: enrollments, isLoading: enrollmentsLoading } = useListEnrollments();
  const { data: paymentsData, isLoading: paymentsLoading } = useListPayments();
  const { data: publishedCoursesRaw } = useListCourses({ status: "PUBLISHED" as "PUBLISHED" });
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const analytics = rawAnalytics as unknown as StudentAnalyticsData | undefined;
  const enrollmentList = enrollments?.enrollments ?? [];
  const allPayments: Payment[] = (paymentsData as unknown as { payments?: Payment[] })?.payments ?? [];

  const publishedCourses = (publishedCoursesRaw as unknown as { courses?: Array<{ id: string; title: string; description: string; filiere?: { name: string } | null; teacher?: { firstName: string; lastName: string } | null }> })?.courses ?? [];
  const enrolledCourseIds = new Set(enrollmentList.map((e) => (e as unknown as { courseId: string }).courseId));
  const catalogCourses = publishedCourses.filter((c) => !enrolledCourseIds.has(c.id));

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId);
    try {
      await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      window.location.reload();
    } finally {
      setEnrollingId(null);
    }
  };

  const confirmedPayments = allPayments.filter((p) => p.status === "CONFIRMED");
  const pendingPayments = allPayments.filter((p) => p.status === "INITIATED" || p.status === "PENDING");
  const totalPaid = confirmedPayments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  const recentPayments = [...allPayments]
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 5);

  const byType = confirmedPayments.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] ?? 0) + Number(p.amount ?? 0);
    return acc;
  }, {});

  const kpis = [
    {
      label: t("student.enrolled_courses"),
      value: analytics?.enrolledCourses ?? 0,
      icon: BookOpen,
      sub: `${analytics?.completedCourses ?? 0} terminé(s)`,
    },
    {
      label: t("student.certificates"),
      value: analytics?.certificates ?? 0,
      icon: CheckSquare,
      sub: "Certificats obtenus",
    },
    {
      label: "Paiements confirmés",
      value: confirmedPayments.length,
      icon: CheckCircle2,
      sub: `${pendingPayments.length} en attente`,
      color: "text-green-600",
    },
    {
      label: "Total payé",
      value: `${totalPaid.toLocaleString("fr-CD")} CDF`,
      icon: CreditCard,
      sub: `Sur ${allPayments.length} transaction(s)`,
      isAmount: true,
    },
  ];

  return (
    <AppLayout>
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("student.title")}</h1>
          <p className="text-muted-foreground">{t("student.subtitle")}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map(({ label, value, icon: Icon, sub, color, isAmount }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className={`h-4 w-4 ${color ?? "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                {analyticsLoading || paymentsLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className={`font-bold ${isAmount ? "text-xl" : "text-2xl"}`}>{value}</div>
                    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Breakdown: score + paiements par type */}
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
                {analytics?.averageScore != null ? `${analytics.averageScore}%` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Score moyen aux évaluations</p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                Répartition des paiements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : Object.keys(byType).length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun paiement confirmé</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(byType).map(([type, amount]) => (
                    <div key={type} className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">{PAYMENT_TYPE_LABELS[type] ?? type}</p>
                      <p className="font-semibold text-sm">{amount.toLocaleString("fr-CD")} <span className="text-xs font-normal text-muted-foreground">CDF</span></p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Cours en cours */}
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
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
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

          {/* Derniers paiements */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Derniers paiements
              </CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/payments">Voir tout</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : recentPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="mx-auto h-10 w-10 opacity-20 mb-2" />
                  <p className="text-sm">Aucun paiement enregistré</p>
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <Link href="/payments">Faire un paiement</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between py-2 border-b last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-none">
                          {PAYMENT_TYPE_LABELS[payment.type] ?? payment.type}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {OPERATOR_LABELS[payment.operator] ?? payment.operator}
                          {payment.createdAt
                            ? ` · ${format(new Date(payment.createdAt), "dd MMM yyyy", { locale: fr })}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-3 shrink-0">
                        <span className="text-sm font-semibold">
                          {Number(payment.amount ?? 0).toLocaleString("fr-CD")} CDF
                        </span>
                        <PaymentStatusBadge status={payment.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Catalogue des cours disponibles */}
        {catalogCourses.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Catalogue des cours disponibles
              </CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/courses">Voir tout</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {catalogCourses.slice(0, 6).map((course) => (
                  <div key={course.id} className="border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm leading-tight">{course.title}</p>
                      {course.filiere && (
                        <span className="inline-block text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5">
                          {course.filiere.name}
                        </span>
                      )}
                      {course.teacher && (
                        <p className="text-xs text-muted-foreground">
                          Prof. {course.teacher.firstName} {course.teacher.lastName}
                        </p>
                      )}
                      {course.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="w-full h-7 text-xs"
                      disabled={enrollingId === course.id}
                      onClick={() => handleEnroll(course.id)}
                    >
                      {enrollingId === course.id
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Inscription...</>
                        : <><Plus className="h-3.5 w-3.5 mr-1" /> S'inscrire</>}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>{t("student.quick_actions")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
    </AppLayout>
  );
}
