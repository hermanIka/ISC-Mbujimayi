import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useListUsers,
  useUpdateUser,
  useGetAcademicAnalytics,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, ShieldAlert, GraduationCap, Server, Search,
  UserCheck, UserX, Shield, Edit3, CheckCircle, XCircle,
  BookOpen, Clock, CheckCircle2, AlertCircle,
} from "lucide-react";
import { Link } from "@/lib/router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";

interface AcademicAnalyticsData {
  totalInscriptions: number;
  pendingInscriptions: number;
  approvedInscriptions: number;
  underReviewInscriptions: number;
  rejectedInscriptions: number;
}

interface TeacherRegistration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  matricule: string;
  emailUniversitaire: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes: string | null;
  createdAt: string;
}

const ROLES = ["VISITOR", "STUDENT", "TEACHER", "ACADEMIC_SERVICE", "FINANCIAL_SERVICE", "DIRECTOR", "ADMIN"] as const;
type UserRole = typeof ROLES[number];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700 border-red-300",
  DIRECTOR: "bg-purple-100 text-purple-700 border-purple-300",
  TEACHER: "bg-blue-100 text-blue-700 border-blue-300",
  STUDENT: "bg-green-100 text-green-700 border-green-300",
  ACADEMIC_SERVICE: "bg-cyan-100 text-cyan-700 border-cyan-300",
  FINANCIAL_SERVICE: "bg-amber-100 text-amber-700 border-amber-300",
  STAFF: "bg-gray-100 text-gray-700 border-gray-300",
};

const STATUS_CONFIG = {
  PENDING: { label: "En attente", color: "bg-amber-100 text-amber-700 border-amber-300", icon: Clock },
  APPROVED: { label: "Approuvée", color: "bg-green-100 text-green-700 border-green-300", icon: CheckCircle2 },
  REJECTED: { label: "Rejetée", color: "bg-red-100 text-red-700 border-red-300", icon: XCircle },
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: usersRaw, isLoading: usersLoading } = useListUsers();
  const { data: rawAnalytics, isLoading: analyticsLoading } = useGetAcademicAnalytics();
  const analytics = rawAnalytics as unknown as AcademicAnalyticsData | undefined;
  const updateUser = useUpdateUser();

  const users: User[] = (usersRaw as { users?: User[] })?.users ?? [];
  const totalUsers = (usersRaw as { total?: number })?.total ?? users.length;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("STUDENT");
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "teacher_regs">("users");

  const [teacherRegs, setTeacherRegs] = useState<TeacherRegistration[]>([]);
  const [teacherRegsLoading, setTeacherRegsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<TeacherRegistration | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  const fetchTeacherRegs = useCallback(async () => {
    setTeacherRegsLoading(true);
    try {
      const res = await fetch("/api/register/teachers");
      if (res.ok) {
        const data = await res.json() as TeacherRegistration[];
        setTeacherRegs(data);
      }
    } finally {
      setTeacherRegsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "teacher_regs") fetchTeacherRegs();
  }, [activeTab, fetchTeacherRegs]);

  const handleStatusChange = async (id: string, status: "APPROVED" | "REJECTED", notes?: string) => {
    setProcessingId(id);
    try {
      await fetch(`/api/register/teacher/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      await fetchTeacherRegs();
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditRole((user.role as UserRole) ?? "STUDENT");
    setEditActive(user.isActive ?? true);
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await updateUser.mutateAsync({ id: editUser.id, data: { role: editRole, isActive: editActive } });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      setEditUser(null);
    } finally {
      setSaving(false);
    }
  };

  const pendingCount = teacherRegs.filter(r => r.status === "PENDING").length;

  const kpis = [
    { label: t("admin.total_users"), value: totalUsers, icon: Users, loading: usersLoading },
    { label: t("admin.active_roles"), value: ROLES.length, icon: ShieldAlert, loading: false },
    { label: t("admin.approved_inscriptions"), value: analytics?.approvedInscriptions ?? 0, icon: GraduationCap, loading: analyticsLoading },
    { label: t("admin.system_status"), value: t("admin.status_normal"), icon: Server, loading: false, green: true },
  ];

  return (
    <AppLayout>
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.title")}</h1>
          <p className="text-muted-foreground">{t("admin.subtitle")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map(({ label, value, icon: Icon, loading, green }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className={`text-2xl font-bold ${green ? "text-green-500" : ""}`}>{value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-1 border-b">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "users"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Gestion des utilisateurs
            </div>
          </button>
          <button
            onClick={() => setActiveTab("teacher_regs")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "teacher_regs"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Inscriptions Enseignants
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                  {pendingCount}
                </span>
              )}
            </div>
          </button>
        </div>

        {activeTab === "users" && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {t("admin.user_management")}
                </CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("admin.search_users")}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 w-48"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder={t("admin.all_roles")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">{t("admin.all_roles")}</SelectItem>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Users className="mx-auto h-10 w-10 opacity-20 mb-3" />
                  <p>{t("admin.no_users_found")}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.col_name")}</TableHead>
                      <TableHead>{t("admin.col_email")}</TableHead>
                      <TableHead>{t("admin.col_role")}</TableHead>
                      <TableHead>{t("admin.col_status")}</TableHead>
                      <TableHead>{t("admin.col_actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={ROLE_COLORS[user.role] ?? ""}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.isActive !== false ? (
                            <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                              <CheckCircle className="h-3.5 w-3.5" />
                              {t("admin.active")}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-500 text-sm font-medium">
                              <XCircle className="h-3.5 w-3.5" />
                              {t("admin.inactive")}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("admin.edit_user")}
                            onClick={() => openEdit(user)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "teacher_regs" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Demandes d'inscription — Enseignants
                </CardTitle>
                <Button variant="outline" size="sm" onClick={fetchTeacherRegs} disabled={teacherRegsLoading}>
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {teacherRegsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : teacherRegs.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <BookOpen className="mx-auto h-10 w-10 opacity-20 mb-3" />
                  <p>Aucune demande d'inscription enseignant pour le moment.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom complet</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Matricule</TableHead>
                      <TableHead>Email universitaire</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherRegs.map((reg) => {
                      const statusCfg = STATUS_CONFIG[reg.status];
                      const StatusIcon = statusCfg.icon;
                      return (
                        <TableRow key={reg.id}>
                          <TableCell className="font-medium">
                            {reg.firstName} {reg.lastName}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{reg.email}</TableCell>
                          <TableCell className="font-mono text-sm">{reg.matricule}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{reg.emailUniversitaire}</TableCell>
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

        <div className="flex gap-3 flex-wrap">
          <Button asChild variant="outline">
            <Link href="/admin/filieres">{t("admin.manage_filieres")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/teachers">{t("admin.manage_teachers")}</Link>
          </Button>
        </div>

        <Dialog open={!!editUser} onOpenChange={(o) => { if (!o) setEditUser(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("admin.edit_user_title")}</DialogTitle>
            </DialogHeader>
            {editUser && (
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-3 text-sm">
                  <p className="font-medium">{editUser.firstName} {editUser.lastName}</p>
                  <p className="text-muted-foreground">{editUser.email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("admin.role")}</label>
                  <Select value={editRole} onValueChange={(v) => setEditRole(v as UserRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium flex-1">{t("admin.account_active")}</label>
                  <Button
                    variant={editActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditActive((a) => !a)}
                  >
                    {editActive ? (
                      <><UserCheck className="mr-1.5 h-4 w-4" />{t("admin.active")}</>
                    ) : (
                      <><UserX className="mr-1.5 h-4 w-4" />{t("admin.inactive")}</>
                    )}
                  </Button>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={saving} className="flex-1">
                    {saving ? t("common.loading") : t("common.save")}
                  </Button>
                  <Button variant="outline" onClick={() => setEditUser(null)}>
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

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
                  <p className="text-muted-foreground">{rejectDialog.email} · {rejectDialog.matricule}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Motif du rejet (optionnel)</label>
                  <textarea
                    className="w-full border rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    placeholder="Ex: Matricule non reconnu, documents manquants..."
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
