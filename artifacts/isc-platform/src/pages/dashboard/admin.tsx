import { useState } from "react";
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
  UserCheck, UserX, Shield, Edit3, CheckCircle, XCircle
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
      </div>
    </AppLayout>
  );
}
