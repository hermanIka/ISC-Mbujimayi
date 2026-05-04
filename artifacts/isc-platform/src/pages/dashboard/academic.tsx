import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useGetAcademicAnalytics,
  useListInscriptions,
  useUpdateInscriptionStatus,
  getListInscriptionsQueryKey,
} from "@workspace/api-client-react";
import type { Inscription } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Users, FileText, CheckCircle, GraduationCap, Clock, XCircle,
  Eye, ThumbsUp, ThumbsDown, BarChart2
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";

interface AcademicAnalyticsData {
  totalInscriptions: number;
  pendingInscriptions: number;
  underReviewInscriptions: number;
  approvedInscriptions: number;
  rejectedInscriptions: number;
  enrollmentsByFiliere: Array<{ filiereId: string; filiereName: string; studentCount: number }>;
  weeklyRegistrations: Array<{ week: string; count: number }>;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  PENDING: { color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  UNDER_REVIEW: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  APPROVED: { color: "text-green-700", bg: "bg-green-50 border-green-200" },
  REJECTED: { color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

const KANBAN_COLS = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"] as const;

function getStudentName(ins: Inscription): string {
  if (ins.student?.firstName || ins.student?.lastName) {
    return [ins.student.firstName, ins.student.lastName].filter(Boolean).join(" ");
  }
  return ins.studentId.slice(0, 8) + "…";
}

export default function AcademicDashboard() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const dateLocale = i18n.language === "fr" ? fr : enUS;
  const { data: rawAnalytics, isLoading } = useGetAcademicAnalytics();
  const analytics = rawAnalytics as unknown as AcademicAnalyticsData | undefined;
  const { data: inscriptionsRaw } = useListInscriptions();
  const allInscriptions: Inscription[] = Array.isArray(inscriptionsRaw)
    ? inscriptionsRaw
    : (inscriptionsRaw as { inscriptions?: Inscription[] })?.inscriptions ?? [];
  const updateStatus = useUpdateInscriptionStatus();
  const [selected, setSelected] = useState<Inscription | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const kpis = [
    { label: t("academic.total_inscriptions"), value: analytics?.totalInscriptions ?? 0, icon: Users },
    { label: t("academic.pending"), value: analytics?.pendingInscriptions ?? 0, icon: Clock },
    { label: t("academic.approved"), value: analytics?.approvedInscriptions ?? 0, icon: CheckCircle },
    { label: t("academic.under_review"), value: analytics?.underReviewInscriptions ?? 0, icon: GraduationCap },
  ];

  type MovableStatus = "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  const handleMove = async (inscription: Inscription, newStatus: string) => {
    if (newStatus === "PENDING") return;
    setUpdating(true);
    try {
      await updateStatus.mutateAsync({ id: inscription.id, data: { status: newStatus as MovableStatus, notes: reviewNote } });
      queryClient.invalidateQueries({ queryKey: getListInscriptionsQueryKey() });
      setSelected(null);
      setReviewNote("");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-8 space-y-8 max-w-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("academic.title")}</h1>
          <p className="text-muted-foreground">{t("academic.subtitle")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {(analytics?.enrollmentsByFiliere ?? []).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                {t("academic.enrollments_by_filiere")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics!.enrollmentsByFiliere.map((row) => {
                  const max = Math.max(...analytics!.enrollmentsByFiliere.map((r) => r.studentCount), 1);
                  const pct = Math.round((row.studentCount / max) * 100);
                  return (
                    <div key={row.filiereId} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{row.filiereName}</span>
                        <span className="text-muted-foreground">{row.studentCount}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-2 bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-4">{t("academic.kanban_title")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {KANBAN_COLS.map((col) => {
              const colItems = allInscriptions.filter((i) => i.status === col);
              const cfg = STATUS_CONFIG[col];
              return (
                <div key={col} className="space-y-2">
                  <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${cfg.bg}`}>
                    <span className={`text-sm font-semibold ${cfg.color}`}>
                      {t(`academic.status_${col.toLowerCase()}` as Parameters<typeof t>[0]) as string}
                    </span>
                    <Badge variant="outline" className="text-xs">{colItems.length}</Badge>
                  </div>
                  <div className="space-y-2 min-h-[120px]">
                    {colItems.length === 0 ? (
                      <div className="border-2 border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground">
                        {t("academic.empty_column")}
                      </div>
                    ) : (
                      colItems.map((ins) => (
                        <Card
                          key={ins.id}
                          className="cursor-pointer hover:shadow-md transition-shadow border"
                          onClick={() => { setSelected(ins); setReviewNote(""); }}
                        >
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-start justify-between gap-1">
                              <p className="text-sm font-medium leading-tight">{getStudentName(ins)}</p>
                              <Eye className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                            </div>
                            {ins.student?.filiere?.name && (
                              <p className="text-xs text-primary font-medium">{ins.student.filiere.name}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {ins.createdAt ? format(new Date(ins.createdAt), "dd MMM yyyy", { locale: dateLocale }) : "—"}
                            </p>
                            {(ins.documents ?? []).length > 0 && (
                              <p className="text-xs text-primary">{(ins.documents ?? []).length} {t("academic.documents")}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("academic.dossier_review")}</DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("academic.student_id")}</span>
                    <span className="font-medium">{getStudentName(selected)}</span>
                  </div>
                  {selected.student?.filiere?.name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("academic.filiere")}</span>
                      <span className="font-medium">{selected.student.filiere.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("academic.current_status")}</span>
                    <Badge variant="outline" className={STATUS_CONFIG[selected.status]?.bg ?? ""}>
                      {t(`academic.status_${selected.status.toLowerCase()}` as Parameters<typeof t>[0]) as string}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("academic.documents")}</span>
                    <span>{(selected.documents ?? []).length} {t("academic.files")}</span>
                  </div>
                  {selected.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-muted-foreground mb-1">{t("academic.previous_notes")}</p>
                      <p className="italic">{selected.notes}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("academic.review_note")}</Label>
                  <Textarea
                    placeholder={t("academic.review_note_placeholder")}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.status !== "UNDER_REVIEW" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMove(selected, "UNDER_REVIEW")}
                      disabled={updating}
                    >
                      <Clock className="mr-1 h-3.5 w-3.5" />
                      {t("academic.move_to_review")}
                    </Button>
                  )}
                  {selected.status !== "APPROVED" && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleMove(selected, "APPROVED")}
                      disabled={updating}
                    >
                      <ThumbsUp className="mr-1 h-3.5 w-3.5" />
                      {t("academic.approve")}
                    </Button>
                  )}
                  {selected.status !== "REJECTED" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleMove(selected, "REJECTED")}
                      disabled={updating}
                    >
                      <ThumbsDown className="mr-1 h-3.5 w-3.5" />
                      {t("academic.reject")}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
