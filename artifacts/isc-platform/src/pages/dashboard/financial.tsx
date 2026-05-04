import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetFinancialAnalytics, useListPayments } from "@workspace/api-client-react";
import type { Payment } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, DollarSign, TrendingUp, AlertCircle, Download, Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

interface FinancialAnalyticsData {
  totalRevenue: string;
  pendingAmount: string;
  confirmedTransactions: number;
  failedTransactions: number;
  revenueByOperator: Array<{ operator: string; amount: string; transactionCount: number }>;
  revenueByType: Array<{ type: string; amount: string; count: number }>;
  revenueTimeline: Array<{ date: string; amount: string; count: number }>;
}

const OPERATOR_COLORS: Record<string, string> = {
  MTN_MONEY: "#FFCC00",
  AIRTEL_MONEY: "#E4012A",
  ORANGE_MONEY: "#FF6600",
};

const PIE_COLORS = ["hsl(var(--primary))", "#22c55e", "#f59e0b", "#6366f1"];

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-green-500/10 text-green-700 border-green-200",
  FAILED: "bg-red-500/10 text-red-700 border-red-200",
  CANCELLED: "bg-gray-500/10 text-gray-700 border-gray-200",
  PENDING: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
};

async function downloadApiPdf(url: string, filename: string): Promise<void> {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export default function FinancialDashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year">("month");
  const { data: rawAnalytics, isLoading } = useGetFinancialAnalytics({ period });
  const analytics = rawAnalytics as unknown as FinancialAnalyticsData | undefined;
  const { data: paymentsRaw, isLoading: paymentsLoading } = useListPayments({ pageSize: 50 } as Parameters<typeof useListPayments>[0]);
  const payments: Payment[] = (paymentsRaw as { payments?: Payment[] })?.payments ?? [];

  const kpis = [
    {
      label: t("financial.total_revenue"),
      value: analytics?.totalRevenue ? `${Number(analytics.totalRevenue).toLocaleString("fr-CD")} CDF` : "0 CDF",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      label: t("financial.pending_amount"),
      value: analytics?.pendingAmount ? `${Number(analytics.pendingAmount).toLocaleString("fr-CD")} CDF` : "0 CDF",
      icon: TrendingUp,
      color: "text-yellow-600",
    },
    {
      label: t("financial.confirmed_tx"),
      value: analytics?.confirmedTransactions ?? 0,
      icon: CreditCard,
      color: "text-primary",
    },
    {
      label: t("financial.failed_tx"),
      value: analytics?.failedTransactions ?? 0,
      icon: AlertCircle,
      color: "text-red-500",
    },
  ];

  const timelineData = (analytics?.revenueTimeline ?? []).map((d) => ({
    date: d.date,
    montant: Number(d.amount),
    transactions: d.count,
  }));

  const operatorData = (analytics?.revenueByOperator ?? []).map((o) => ({
    name: o.operator,
    montant: Number(o.amount),
    transactions: o.transactionCount,
    fill: OPERATOR_COLORS[o.operator] ?? "hsl(var(--primary))",
  }));

  const typeData = (analytics?.revenueByType ?? []).map((r, i) => ({
    name: t(`payments.type_${r.type.toLowerCase().replace(/_fee$/, "")}` as Parameters<typeof t>[0]) as string || r.type,
    value: Number(r.amount),
    count: r.count,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const handleExport = () => {
    if (!analytics) return;
    const rows = [
      ["Opérateur", "Montant (CDF)", "Transactions"],
      ...(analytics.revenueByOperator ?? []).map((r) => [r.operator, r.amount, String(r.transactionCount)]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-financier-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadReceipt = async (payment: Payment) => {
    try {
      await downloadApiPdf(`/api/payments/${payment.id}/receipt`, `recu-${payment.reference || payment.id}.pdf`);
      toast({ title: t("payments.download_receipt"), description: t("payments.confirm_phone") });
    } catch {
      toast({ title: t("common.error"), description: t("payments.initiate_error"), variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("financial.title")}</h1>
            <p className="text-muted-foreground">{t("financial.subtitle")}</p>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">{t("financial.period_day")}</SelectItem>
                <SelectItem value="week">{t("financial.period_week")}</SelectItem>
                <SelectItem value="month">{t("financial.period_month")}</SelectItem>
                <SelectItem value="year">{t("financial.period_year")}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!analytics}>
              <Download className="mr-1.5 h-4 w-4" />
              {t("financial.export")}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t("financial.revenue_timeline")}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : timelineData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  {t("financial.no_data")}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={timelineData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip formatter={(value: number) => [`${value.toLocaleString("fr-CD")} CDF`, t("financial.revenue")]} />
                    <Area
                      type="monotone"
                      dataKey="montant"
                      name={t("financial.revenue")}
                      stroke="hsl(var(--primary))"
                      fill="url(#colorRevenue)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("financial.revenue_by_type")}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : typeData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  {t("financial.no_data")}
                </div>
              ) : (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {typeData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${v.toLocaleString("fr-CD")} CDF`]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5">
                    {typeData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
                          <span className="truncate max-w-[120px]">{d.name}</span>
                        </div>
                        <span className="font-medium">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("financial.revenue_by_operator")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : operatorData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                {t("financial.no_data")}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={operatorData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip formatter={(v: number) => [`${v.toLocaleString("fr-CD")} CDF`]} />
                    <Bar dataKey="montant" name={t("financial.revenue")}>
                      {operatorData.map((o, i) => (
                        <Cell key={i} fill={o.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {operatorData.map((o) => (
                    <div key={o.name} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: o.fill }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{o.name}</p>
                        <p className="text-xs text-muted-foreground">{o.transactions} {t("financial.transactions")}</p>
                      </div>
                      <p className="font-bold text-sm">{Number(o.montant).toLocaleString("fr-CD")} CDF</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              {t("financial.payment_records")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="mx-auto h-10 w-10 opacity-20 mb-3" />
                <p>{t("payments.no_transactions")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("payments.col_reference")}</TableHead>
                    <TableHead>{t("payments.col_type")}</TableHead>
                    <TableHead>{t("payments.col_operator")}</TableHead>
                    <TableHead>{t("payments.col_amount")}</TableHead>
                    <TableHead>{t("payments.col_status")}</TableHead>
                    <TableHead>{t("payments.col_receipt")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment: Payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">{payment.reference || payment.id.slice(0, 8) + "…"}</TableCell>
                      <TableCell className="text-sm">
                        {t(`payments.type_${payment.type.toLowerCase().replace(/_fee$/, "")}` as Parameters<typeof t>[0]) as string || payment.type}
                      </TableCell>
                      <TableCell className="text-sm">{payment.operator}</TableCell>
                      <TableCell className="font-medium text-sm">
                        {Number(payment.amount).toLocaleString("fr-CD")} {payment.currency}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[payment.status] ?? ""}>
                          {t(`payments.status.${payment.status.toLowerCase()}` as Parameters<typeof t>[0]) as string || payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.status === "CONFIRMED" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("payments.download_receipt")}
                            onClick={() => handleDownloadReceipt(payment)}
                          >
                            <Receipt className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
