import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useGetTeacherAnalytics,
  useListCourses,
  useListEvaluations,
  useUpdateCourse,
  getListCoursesQueryKey,
} from "@workspace/api-client-react";
import type { Course, Evaluation } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, BookOpen, Star, FileText, Plus, Eye, Edit, Send, Archive,
  CheckCircle, Clock, BarChart2, TrendingUp, AlertTriangle, Upload, Loader2, X, Paperclip
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Link } from "@/lib/router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

interface StudentProgress {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string | null;
  enrolledAt: string;
  completedAt: string | null;
  completedChapters: number;
  totalChapters: number;
  progressPercent: number;
  evaluationResults: Array<{
    evaluationId: string;
    score: number;
    maxScore: number;
    percent: number;
    passed: boolean;
  }>;
}

interface TeacherAnalyticsData {
  totalCourses: number;
  publishedCourses: number;
  totalStudents: number;
  totalEvaluations: number;
  averageScore: number | null;
  courseEngagement: Array<{
    courseId: string;
    courseTitle: string;
    enrolledStudents: number;
    averageProgress: number;
    completedStudents: number;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 border-gray-300",
  PENDING_REVIEW: "bg-blue-100 text-blue-700 border-blue-300",
  PUBLISHED: "bg-green-100 text-green-700 border-green-300",
  REJECTED: "bg-red-100 text-red-700 border-red-300",
  ARCHIVED: "bg-orange-100 text-orange-700 border-orange-300",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PENDING_REVIEW: "En validation",
  PUBLISHED: "Publié",
  REJECTED: "Rejeté",
  ARCHIVED: "Archivé",
};

function CourseEvaluationsSection({
  courseId,
  courseTitle,
  onLoaded,
}: {
  courseId: string;
  courseTitle: string;
  onLoaded?: (count: number) => void;
}) {
  const { data, isLoading } = useListEvaluations(courseId);
  const evaluations: Evaluation[] = Array.isArray(data) ? data : [];

  useEffect(() => {
    if (!isLoading) {
      onLoaded?.(evaluations.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={6}>
          <Skeleton className="h-6 w-full" />
        </TableCell>
      </TableRow>
    );
  }

  if (evaluations.length === 0) return null;

  return (
    <>
      {evaluations.map((ev) => (
        <TableRow key={ev.id}>
          <TableCell className="font-medium">{ev.title}</TableCell>
          <TableCell>
            <Badge variant="outline" className="text-xs">{ev.type}</Badge>
          </TableCell>
          <TableCell>{ev.passMark}%</TableCell>
          <TableCell className="text-sm text-muted-foreground">
            {ev.questionCount ?? 0}
          </TableCell>
          <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]" title={courseTitle}>
            {courseTitle}
          </TableCell>
          <TableCell>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/evaluations/${ev.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: rawAnalytics, isLoading } = useGetTeacherAnalytics();
  const analytics = rawAnalytics as unknown as TeacherAnalyticsData | undefined;
  const { data: coursesRaw, isLoading: coursesLoading } = useListCourses();
  const courses: Course[] = Array.isArray(coursesRaw) ? coursesRaw : (coursesRaw as { courses?: Course[] })?.courses ?? [];
  const updateCourse = useUpdateCourse();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [evSectionsReported, setEvSectionsReported] = useState(0);
  const [evTotalFound, setEvTotalFound] = useState(0);

  const courseEngagement = analytics?.courseEngagement ?? [];

  const evaluationCoursesKey = courseEngagement.length > 0 ? courseEngagement.length : courses.length;
  useEffect(() => {
    setEvSectionsReported(0);
    setEvTotalFound(0);
  }, [evaluationCoursesKey]);

  const handleSectionLoaded = useCallback((count: number) => {
    setEvSectionsReported((prev) => prev + 1);
    setEvTotalFound((prev) => prev + count);
  }, []);

  const kpis = [
    { label: t("teacher.my_courses"), value: analytics?.totalCourses ?? 0, icon: BookOpen },
    { label: t("teacher.enrolled_students"), value: analytics?.totalStudents ?? 0, icon: Users },
    { label: t("teacher.evaluations"), value: analytics?.totalEvaluations ?? 0, icon: FileText },
    {
      label: t("teacher.avg_score"),
      value: analytics?.averageScore != null ? `${analytics.averageScore}%` : "N/A",
      icon: Star,
    },
  ];

  const [progressCourseId, setProgressCourseId] = useState<string | null>(null);
  const [studentsProgress, setStudentsProgress] = useState<StudentProgress[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [supportsDialogCourseId, setSupportsDialogCourseId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const handleStatusChange = async (courseId: string, newStatus: string) => {
    try {
      await updateCourse.mutateAsync({ id: courseId, data: { status: newStatus as "DRAFT" | "PUBLISHED" | "ARCHIVED" } });
      queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
    } catch {}
  };

  const handleSubmitForReview = async (courseId: string) => {
    setSubmittingId(courseId);
    try {
      await fetch(`/api/courses/${courseId}/submit`, { method: "PUT" });
      queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
    } finally {
      setSubmittingId(null);
    }
  };

  const openStudentsProgress = async (courseId: string) => {
    setProgressCourseId(courseId);
    setProgressLoading(true);
    setStudentsProgress([]);
    try {
      const res = await fetch(`/api/courses/${courseId}/students-progress`);
      if (res.ok) {
        const data = await res.json() as StudentProgress[];
        setStudentsProgress(data);
      }
    } finally {
      setProgressLoading(false);
    }
  };

  const engagementData = courseEngagement.map((c) => ({
    name: c.courseTitle.length > 15 ? c.courseTitle.slice(0, 15) + "…" : c.courseTitle,
    inscrits: c.enrolledStudents,
    progression: c.averageProgress,
    termines: c.completedStudents,
  }));

  const evaluationCourses = courseEngagement.length > 0
    ? courseEngagement
    : courses.map((c) => ({ courseId: c.id, courseTitle: c.title }));

  return (
    <AppLayout>
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("teacher.title")}</h1>
            <p className="text-muted-foreground">{t("teacher.subtitle")}</p>
          </div>
          <Button asChild>
            <Link href="/courses/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("teacher.create_course")}
            </Link>
          </Button>
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

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="overview">
              <BarChart2 className="h-4 w-4 mr-1" />
              {t("teacher.tab_overview")}
            </TabsTrigger>
            <TabsTrigger value="courses">
              <BookOpen className="h-4 w-4 mr-1" />
              {t("teacher.tab_courses")}
            </TabsTrigger>
            <TabsTrigger value="evaluations">
              <FileText className="h-4 w-4 mr-1" />
              {t("teacher.tab_evaluations")}
            </TabsTrigger>
            <TabsTrigger value="students">
              <Users className="h-4 w-4 mr-1" />
              Étudiants
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {engagementData.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {t("teacher.engagement_chart")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={engagementData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="inscrits" name={t("teacher.col_enrolled")} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="termines" name={t("teacher.col_completed")} fill="hsl(var(--primary) / 0.4)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <BookOpen className="mx-auto h-10 w-10 opacity-20 mb-3" />
                  <p>{t("teacher.no_engagement_data")}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>{t("teacher.course_engagement_table")}</CardTitle>
              </CardHeader>
              <CardContent>
                {courseEngagement.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">{t("teacher.no_courses_yet")}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("teacher.col_course")}</TableHead>
                        <TableHead className="text-right">{t("teacher.col_enrolled")}</TableHead>
                        <TableHead className="text-right">{t("teacher.col_progress")}</TableHead>
                        <TableHead className="text-right">{t("teacher.col_completed")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courseEngagement.map((c) => (
                        <TableRow key={c.courseId}>
                          <TableCell className="font-medium">{c.courseTitle}</TableCell>
                          <TableCell className="text-right">{c.enrolledStudents}</TableCell>
                          <TableCell className="text-right">{c.averageProgress}%</TableCell>
                          <TableCell className="text-right">{c.completedStudents}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t("teacher.my_courses_list")}</CardTitle>
                <Button asChild size="sm">
                  <Link href="/courses/new">
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    {t("teacher.new_course")}
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {coursesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : courses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{t("teacher.no_courses_yet")}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("teacher.col_title")}</TableHead>
                        <TableHead>{t("teacher.col_status")}</TableHead>
                        <TableHead>{t("teacher.col_filiere")}</TableHead>
                        <TableHead>{t("teacher.col_actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.title}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={STATUS_COLORS[course.status] ?? ""}
                            >
                              {STATUS_LABELS[course.status] ?? course.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {course.filiere?.name ?? (course.filiereId ? course.filiereId.slice(0, 8) + "…" : "—")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              <Button variant="ghost" size="icon" asChild title="Voir">
                                <Link href={`/courses/${course.id}`}><Eye className="h-4 w-4" /></Link>
                              </Button>
                              <Button variant="ghost" size="icon" asChild title="Modifier">
                                <Link href={`/courses/${course.id}/edit`}><Edit className="h-4 w-4" /></Link>
                              </Button>
                              <Button variant="ghost" size="icon" title="Gérer les supports" onClick={() => setSupportsDialogCourseId(course.id)}>
                                <Paperclip className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              {(course.status === "DRAFT" || course.status === "REJECTED") && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Soumettre pour validation"
                                  disabled={submittingId === course.id}
                                  onClick={() => handleSubmitForReview(course.id)}
                                >
                                  {submittingId === course.id
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <Send className="h-4 w-4 text-blue-600" />}
                                </Button>
                              )}
                              {course.status === "PENDING_REVIEW" && (
                                <span className="flex items-center gap-1 text-blue-500 text-xs px-2">
                                  <Clock className="h-3.5 w-3.5" /> En attente
                                </span>
                              )}
                              {course.status === "PUBLISHED" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Archiver"
                                  onClick={() => handleStatusChange(course.id, "ARCHIVED")}
                                >
                                  <Archive className="h-4 w-4 text-orange-500" />
                                </Button>
                              )}
                              {course.status === "ARCHIVED" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Restaurer en brouillon"
                                  onClick={() => handleStatusChange(course.id, "DRAFT")}
                                >
                                  <CheckCircle className="h-4 w-4 text-blue-500" />
                                </Button>
                              )}
                              {course.status === "REJECTED" && (course as { rejectionNotes?: string }).rejectionNotes && (
                                <span className="text-xs text-red-500 max-w-[120px] truncate" title={(course as { rejectionNotes?: string }).rejectionNotes}>
                                  <AlertTriangle className="h-3 w-3 inline mr-0.5" />
                                  {(course as { rejectionNotes?: string }).rejectionNotes}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Progression des étudiants par cours
                </CardTitle>
              </CardHeader>
              <CardContent>
                {courses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucun cours créé pour le moment.</p>
                ) : (
                  <div className="space-y-6">
                    {courses.map((course) => (
                      <div key={course.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{course.title}</p>
                            <Badge variant="outline" className={`text-xs ${STATUS_COLORS[course.status]}`}>
                              {STATUS_LABELS[course.status] ?? course.status}
                            </Badge>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => openStudentsProgress(course.id)}>
                            <Users className="h-3.5 w-3.5 mr-1" />
                            Voir progression
                          </Button>
                        </div>
                        {progressCourseId === course.id && (
                          <div>
                            {progressLoading ? (
                              <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                                <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
                              </div>
                            ) : studentsProgress.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-2">Aucun étudiant inscrit à ce cours.</p>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Étudiant</TableHead>
                                    <TableHead>Progression</TableHead>
                                    <TableHead className="text-right">Chapitres</TableHead>
                                    <TableHead className="text-right">Évals réussies</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {studentsProgress.map((sp) => (
                                    <TableRow key={sp.enrollmentId}>
                                      <TableCell>
                                        <p className="font-medium text-sm">{sp.studentName}</p>
                                        {sp.studentEmail && <p className="text-xs text-muted-foreground">{sp.studentEmail}</p>}
                                      </TableCell>
                                      <TableCell>
                                        <div className="space-y-1 min-w-[120px]">
                                          <Progress value={sp.progressPercent} className="h-2" />
                                          <p className="text-xs text-muted-foreground">{sp.progressPercent}%</p>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right text-sm">
                                        {sp.completedChapters}/{sp.totalChapters}
                                      </TableCell>
                                      <TableCell className="text-right text-sm">
                                        {sp.evaluationResults.filter(e => e.passed).length}/{sp.evaluationResults.length}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evaluations" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t("teacher.evaluations_list")}</CardTitle>
                <Button asChild size="sm">
                  <Link href="/evaluations/new">
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    {t("teacher.new_evaluation")}
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {coursesLoading || isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : evaluationCourses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="mx-auto h-10 w-10 opacity-20 mb-3" />
                    <p>{t("teacher.no_evaluations_yet")}</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("teacher.col_title")}</TableHead>
                          <TableHead>{t("teacher.col_type")}</TableHead>
                          <TableHead>{t("teacher.col_pass_mark")}</TableHead>
                          <TableHead>{t("teacher.col_questions")}</TableHead>
                          <TableHead>{t("teacher.col_course")}</TableHead>
                          <TableHead>{t("teacher.col_actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {evaluationCourses.map((c) => (
                          <CourseEvaluationsSection
                            key={c.courseId}
                            courseId={c.courseId}
                            courseTitle={c.courseTitle}
                            onLoaded={handleSectionLoaded}
                          />
                        ))}
                      </TableBody>
                    </Table>
                    {evSectionsReported === evaluationCourses.length && evTotalFound === 0 && (
                      <div className="text-center py-8 text-muted-foreground border-t">
                        <p>{t("teacher.no_evaluations_yet")}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <CourseSupportsDialog
        courseId={supportsDialogCourseId}
        onClose={() => setSupportsDialogCourseId(null)}
      />
    </AppLayout>
  );
}

interface ChapterMaterial {
  id: string;
  chapterId: string;
  type: "VIDEO" | "PDF" | "DOC";
  url: string;
  fileName: string;
  fileSize: number;
}

interface ModuleWithChapters {
  id: string;
  title: string;
  chapters: Array<{ id: string; title: string }>;
}

function CourseSupportsDialog({ courseId, onClose }: { courseId: string | null; onClose: () => void }) {
  const [modules, setModules] = useState<ModuleWithChapters[]>([]);
  const [materials, setMaterials] = useState<Record<string, ChapterMaterial[]>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    fetch(`/api/courses/${courseId}`)
      .then(r => r.json())
      .then((data: { modules?: ModuleWithChapters[] }) => {
        const mods = data.modules ?? [];
        setModules(mods);
        const chapterIds = mods.flatMap(m => m.chapters.map(c => c.id));
        return Promise.all(chapterIds.map(cid =>
          fetch(`/api/chapters/${cid}/materials`)
            .then(r => r.json())
            .then((mats: ChapterMaterial[]) => ({ cid, mats }))
        ));
      })
      .then(results => {
        const map: Record<string, ChapterMaterial[]> = {};
        results.forEach(({ cid, mats }) => { map[cid] = mats; });
        setMaterials(map);
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleUpload = async (chapterId: string, file: File) => {
    setUploading(chapterId);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`/api/chapters/${chapterId}/materials`, { method: "POST", body: formData });
      if (res.ok) {
        const mat = await res.json() as ChapterMaterial;
        setMaterials(prev => ({ ...prev, [chapterId]: [...(prev[chapterId] ?? []), mat] }));
      }
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (materialId: string, chapterId: string) => {
    await fetch(`/api/materials/${materialId}`, { method: "DELETE" });
    setMaterials(prev => ({ ...prev, [chapterId]: (prev[chapterId] ?? []).filter(m => m.id !== materialId) }));
  };

  const formatSize = (bytes: number) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} Ko`
    : `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;

  return (
    <Dialog open={!!courseId} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-primary" />
            Supports pédagogiques
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Chargement...
          </div>
        ) : modules.length === 0 ? (
          <p className="text-muted-foreground text-sm py-6 text-center">Aucun module trouvé. Créez d'abord des modules et chapitres.</p>
        ) : (
          <div className="space-y-5">
            {modules.map(mod => (
              <div key={mod.id} className="space-y-3">
                <p className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{mod.title}</p>
                {mod.chapters.map(chapter => (
                  <div key={chapter.id} className="border rounded-lg p-3 space-y-2">
                    <p className="font-medium text-sm">{chapter.title}</p>
                    {(materials[chapter.id] ?? []).length > 0 && (
                      <ul className="space-y-1">
                        {(materials[chapter.id] ?? []).map(m => (
                          <li key={m.id} className="flex items-center justify-between text-xs bg-muted/40 rounded px-2 py-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <Badge variant="outline" className="text-[10px] shrink-0">{m.type}</Badge>
                              <a href={m.url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate max-w-[200px]">{m.fileName}</a>
                              <span className="text-muted-foreground shrink-0">{formatSize(m.fileSize)}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => handleDelete(m.id, chapter.id)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs text-primary hover:underline">
                        {uploading === chapter.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        Ajouter un fichier
                        <input
                          type="file"
                          className="hidden"
                          accept="video/*,.pdf,.doc,.docx"
                          disabled={uploading === chapter.id}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(chapter.id, file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <span className="text-xs text-muted-foreground">Vidéo max 50 MB · PDF/DOC max 20 MB</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
