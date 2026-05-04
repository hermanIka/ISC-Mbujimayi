import { AppLayout } from "@/components/layout/AppLayout";
import { useGetDirectorAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, GraduationCap, DollarSign, TrendingUp, BookOpen, BarChart2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

interface DirectorAnalyticsData {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalRevenue: string;
  monthlyEnrollmentGrowth: number;
  platformEngagementRate: number;
  enrollmentTrend: Array<{ month: string; count: number }>;
  revenueTrend: Array<{ date: string; amount: string; count: number }>;
  enrollmentsByFiliere: Array<{ filiereId: string; filiereName: string; studentCount: number }>;
  totalInscriptions?: number;
  approvedInscriptions?: number;
}

const PIE_COLORS = [
  "hsl(var(--primary))", "#22c55e", "#f59e0b", "#6366f1", "#ec4899"
];

export default function DirectorDashboard() {
  const { t } = useTranslation();
  const { data: rawAnalytics, isLoading } = useGetDirectorAnalytics();
  const analytics = rawAnalytics as unknown as DirectorAnalyticsData | undefined;

  const kpis = [
    { label: t("director.total_students"), value: analytics?.totalStudents ?? 0, icon: Users },
    { label: t("director.total_teachers"), value: analytics?.totalTeachers ?? 0, icon: GraduationCap },
    { label: t("director.total_courses"), value: analytics?.totalCourses ?? 0, icon: BookOpen },
    {
      label: t("director.total_revenue"),
      value: analytics?.totalRevenue ? `${Number(analytics.totalRevenue).toLocaleString("fr-CD")} CDF` : "0 CDF",
      icon: DollarSign,
    },
    {
      label: t("director.monthly_growth"),
      value: analytics?.monthlyEnrollmentGrowth != null ? `+${analytics.monthlyEnrollmentGrowth}%` : "N/A",
      icon: TrendingUp,
    },
    {
      label: t("director.engagement_rate"),
      value: analytics?.platformEngagementRate != null ? `${analytics.platformEngagementRate}%` : "N/A",
      icon: BarChart2,
    },
  ];

  const enrollmentTrend = (analytics?.enrollmentTrend ?? []).map((d) => ({
    mois: d.month,
    inscriptions: d.count,
  }));

  const revenueTrend = (analytics?.revenueTrend ?? []).map((d) => ({
    date: d.date,
    montant: Number(d.amount),
  }));

  const filierePieData = (analytics?.enrollmentsByFiliere ?? []).map((f, i) => ({
    name: f.filiereName,
    value: f.studentCount,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <AppLayout>
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("director.title")}</h1>
          <p className="text-muted-foreground">{t("director.subtitle")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kpis.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">{value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("director.enrollment_trend")}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-56 w-full" />
              ) : enrollmentTrend.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                  {t("director.no_data")}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={enrollmentTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mois" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="inscriptions"
                      name={t("director.inscriptions")}
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("director.revenue_trend")}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-56 w-full" />
              ) : revenueTrend.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                  {t("director.no_data")}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenueTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="dirRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip formatter={(v: number) => [`${v.toLocaleString("fr-CD")} CDF`]} />
                    <Area
                      type="monotone"
                      dataKey="montant"
                      name={t("director.revenue")}
                      stroke="#22c55e"
                      fill="url(#dirRevenue)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("director.enrollments_by_filiere")}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-56 w-full" />
              ) : filierePieData.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                  {t("director.no_data")}
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={filierePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {filierePieData.map((d, i) => (
                          <Cell key={i} fill={d.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {filierePieData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                          <span className="truncate max-w-[150px]">{d.name}</span>
                        </div>
                        <span className="font-semibold">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("director.institute_summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                [
                  { label: t("director.total_inscriptions"), value: analytics?.totalInscriptions ?? "—" },
                  { label: t("director.approved_inscriptions"), value: analytics?.approvedInscriptions ?? "—" },
                  { label: t("director.total_courses"), value: analytics?.totalCourses ?? "—" },
                  { label: t("director.total_students"), value: analytics?.totalStudents ?? "—" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <span className="font-bold text-lg">{row.value}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
