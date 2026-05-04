import { AppLayout } from "@/components/layout/AppLayout";
import { useGetDirectorAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, DollarSign, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function DirectorDashboard() {
  const { data: rawAnalytics, isLoading } = useGetDirectorAnalytics();
  const analytics = rawAnalytics as unknown as DirectorAnalyticsData | undefined;

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Vue d'ensemble de l'Institut</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Étudiants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{analytics?.totalStudents ?? 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enseignants</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{analytics?.totalTeachers ?? 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{analytics?.totalRevenue ?? "0"} CDF</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Croissance mensuelle</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {analytics?.monthlyEnrollmentGrowth != null
                    ? `+${analytics.monthlyEnrollmentGrowth}%`
                    : "N/A"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
