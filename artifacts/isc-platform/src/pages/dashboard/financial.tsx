import { AppLayout } from "@/components/layout/AppLayout";
import { useGetFinancialAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface FinancialAnalyticsData {
  totalRevenue: string;
  pendingAmount: string;
  confirmedTransactions: number;
  failedTransactions: number;
  revenueByOperator: Array<{ operator: string; amount: string; transactionCount: number }>;
  revenueByType: Array<{ type: string; amount: string; count: number }>;
  revenueTimeline: Array<{ date: string; amount: string; count: number }>;
}

export default function FinancialDashboard() {
  const { data: rawAnalytics, isLoading } = useGetFinancialAnalytics();
  const analytics = rawAnalytics as unknown as FinancialAnalyticsData | undefined;

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Service Financier</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <CardTitle className="text-sm font-medium">Montant en attente</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{analytics?.pendingAmount ?? "0"} CDF</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paiements confirmés</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{analytics?.confirmedTransactions ?? 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paiements échoués</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{analytics?.failedTransactions ?? 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Button asChild>
            <Link href="/payments">Gérer les paiements</Link>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
