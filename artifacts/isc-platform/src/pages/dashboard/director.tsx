import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetDirectorAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, GraduationCap, DollarSign, TrendingUp, BookOpen, BarChart2,
  Briefcase, Clock, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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

interface StaffRegistration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  matricule: string;
  emailUniversitaire: string;
  roleStaff: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes: string | null;
  createdAt: string;
}

const PIE_COLORS = [
  "hsl(var(--primary))", "#22c55e", "#f59e0b", "#6366f1", "#ec4899"
];

const STATUS_CONFIG = {
  PENDING: { label: "En attente", color: "bg-amber-100 text-amber-700 border-amber-300", icon: Clock },
  APPROVED: { label: "Approuvée", color: "bg-green-100 text-green-700 border-green-300", icon: CheckCircle2 },
  REJECTED: { label: "Rejetée", color: "bg-red-100 text-red-700 border-red-300", icon: XCircle },
};

export default function DirectorDashboard() {
  const { t } = useTranslation();
  const { data: rawAnalytics, isLoading } = useGetDirectorAnalytics();
  const analytics = rawAnalytics as unknown as DirectorAnalyticsData | undefined;

  const [activeTab, setActiveTab] = useState<"analytics" | "staff_regs">("analytics");
  const [staffRegs, setStaffRegs] = useState<StaffRegistration[]>([]);
  const [staffRegsLoading, setStaffRegsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<StaffRegistration | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  const fetchStaffRegs = useCallback(async () => {
    setStaffRegsLoading(true);
    try {
      const res = await fetch("/api/register/staff");
      if (res.ok) {
        const data = await res.json() as StaffRegistration[];
        setStaffRegs(data);
      }
    } finally {
      setStaffRegsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "staff_regs") fetchStaffRegs();
  }, [activeTab, fetchStaffRegs]);

  const handleStatusChange = async (id: string, status: "APPROVED" | "REJECTED", notes?: string) => {
    setProcessingId(id);
    try {
      await fetch(`/api/register/staff/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      await fetchStaffRegs();
    } finally {
      setProcessingId(null);
    }
  };

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

  const pendingCount = staffRegs.filter(r => r.status === "PENDING").length;

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

        <div className="flex gap-1 border-b">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "analytics"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Tableau de bord analytique
            </div>
          </button>
          <button
            onClick={() => setActiveTab("staff_regs")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "staff_regs"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Inscriptions Personnel
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                  {pendingCount}
                </span>
              )}
            </div>
          </button>
        </div>

        {activeTab === "analytics" && (
          <>
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
          </>
        )}

        {activeTab === "staff_regs" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Demandes d'inscription — Personnel administratif
                </CardTitle>
                <Button variant="outline" size="sm" onClick={fetchStaffRegs} disabled={staffRegsLoading}>
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {staffRegsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : staffRegs.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Briefcase className="mx-auto h-10 w-10 opacity-20 mb-3" />
                  <p>Aucune demande d'inscription personnel pour le moment.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom complet</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Matricule</TableHead>
                      <TableHead>Fonction</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffRegs.map((reg) => {
                      const statusCfg = STATUS_CONFIG[reg.status];
                      const StatusIcon = statusCfg.icon;
                      return (
                        <TableRow key={reg.id}>
                          <TableCell className="font-medium">
                            {reg.firstName} {reg.lastName}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{reg.email}</TableCell>
                          <TableCell className="font-mono text-sm">{reg.matricule}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{reg.roleStaff}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(reg.createdAt).toLocaleDateString("fr-CD")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusCfg.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {reg.status === "PENDING" && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-300 hover:bg-green-50 h-7 text-xs"
                                  disabled={processingId === reg.id}
                                  onClick={() => handleStatusChange(reg.id, "APPROVED")}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                  Approuver
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-300 hover:bg-red-50 h-7 text-xs"
                                  disabled={processingId === reg.id}
                                  onClick={() => { setRejectDialog(reg); setRejectNotes(""); }}
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1" />
                                  Rejeter
                                </Button>
                              </div>
                            )}
                            {reg.status !== "PENDING" && reg.notes && (
                              <span className="text-xs text-muted-foreground italic truncate max-w-[120px] block" title={reg.notes}>
                                {reg.notes}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={!!rejectDialog} onOpenChange={(o) => { if (!o) setRejectDialog(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Rejeter la demande
              </DialogTitle>
            </DialogHeader>
            {rejectDialog && (
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-3 text-sm">
                  <p className="font-medium">{rejectDialog.firstName} {rejectDialog.lastName}</p>
                  <p className="text-muted-foreground">{rejectDialog.email}</p>
                  <p className="text-muted-foreground">{rejectDialog.roleStaff} · {rejectDialog.matricule}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Motif du rejet (optionnel)</label>
                  <textarea
                    className="w-full border rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    placeholder="Ex: Matricule non reconnu, poste non disponible..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={processingId === rejectDialog.id}
                    onClick={async () => {
                      await handleStatusChange(rejectDialog.id, "REJECTED", rejectNotes || undefined);
                      setRejectDialog(null);
                    }}
                  >
                    Confirmer le rejet
                  </Button>
                  <Button variant="outline" onClick={() => setRejectDialog(null)}>
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
