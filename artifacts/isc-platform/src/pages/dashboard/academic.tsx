import { AppLayout } from "@/components/layout/AppLayout";
import { useGetAcademicAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckCircle, GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface AcademicAnalyticsData {
  totalInscriptions: number;
  pendingInscriptions: number;
  underReviewInscriptions: number;
  approvedInscriptions: number;
  rejectedInscriptions: number;
  enrollmentsByFiliere: Array<{ filiereId: string; filiereName: string; studentCount: number }>;
  weeklyRegistrations: Array<{ week: string; count: number }>;
}

export default function AcademicDashboard() {
  const { data: rawAnalytics, isLoading } = useGetAcademicAnalytics();
  const analytics = rawAnalytics as unknown as AcademicAnalyticsData | undefined;

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Service Académique</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inscriptions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{analytics?.totalInscriptions ?? 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inscriptions en attente</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{analytics?.pendingInscriptions ?? 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inscriptions validées</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{analytics?.approvedInscriptions ?? 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En révision</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{analytics?.underReviewInscriptions ?? 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Button asChild>
            <Link href="/inscriptions">Gérer les inscriptions</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/filieres">Gérer les filières</Link>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
