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
  CheckCircle, Clock, BarChart2, TrendingUp
} from "lucide-react";
import { Link } from "@/lib/router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

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
  PUBLISHED: "bg-green-100 text-green-700 border-green-300",
  ARCHIVED: "bg-orange-100 text-orange-700 border-orange-300",
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

  const handleStatusChange = async (courseId: string, newStatus: string) => {
    try {
      await updateCourse.mutateAsync({ id: courseId, data: { status: newStatus as "DRAFT" | "PUBLISHED" | "ARCHIVED" } });
      queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
    } catch {}
  };

  const engagementData = (analytics?.courseEngagement ?? []).map((c) => ({
    name: c.courseTitle.length > 15 ? c.courseTitle.slice(0, 15) + "…" : c.courseTitle,
    inscrits: c.enrolledStudents,
    progression: c.averageProgress,
    termines: c.completedStudents,
  }));

  const courseEngagement = analytics?.courseEngagement ?? [];

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
          <TabsList className="grid grid-cols-3 w-full max-w-md">
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
                              {t(`teacher.status_${course.status.toLowerCase()}` as Parameters<typeof t>[0]) as string || course.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {course.filiere?.name ?? (course.filiereId ? course.filiereId.slice(0, 8) + "…" : "—")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              <Button variant="ghost" size="icon" asChild title={t("teacher.view")}>
                                <Link href={`/courses/${course.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" asChild title={t("teacher.edit")}>
                                <Link href={`/courses/${course.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              {course.status === "DRAFT" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title={t("teacher.publish")}
                                  onClick={() => handleStatusChange(course.id, "PUBLISHED")}
                                >
                                  <Send className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                              {course.status === "PUBLISHED" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title={t("teacher.archive")}
                                  onClick={() => handleStatusChange(course.id, "ARCHIVED")}
                                >
                                  <Archive className="h-4 w-4 text-orange-500" />
                                </Button>
                              )}
                              {course.status === "ARCHIVED" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title={t("teacher.restore")}
                                  onClick={() => handleStatusChange(course.id, "DRAFT")}
                                >
                                  <CheckCircle className="h-4 w-4 text-blue-500" />
                                </Button>
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
    </AppLayout>
  );
}
