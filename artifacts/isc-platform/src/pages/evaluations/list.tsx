import { AppLayout } from "@/components/layout/AppLayout";
import { useListEvaluations, getListEvaluationsQueryKey } from "@workspace/api-client-react";
import type { Evaluation } from "@workspace/api-client-react";
import { useRoute, Link } from "@/lib/router";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, FileQuestion, CheckSquare } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function CourseEvaluationsPage() {
  const { t } = useTranslation();
  const [, params] = useRoute("/courses/:id/evaluations");
  const courseId = params?.id || "";

  const { data: evaluationsData, isLoading } = useListEvaluations(courseId, {
    query: { enabled: !!courseId, queryKey: getListEvaluationsQueryKey(courseId) }
  });

  const evaluations = Array.isArray(evaluationsData) ? evaluationsData : [];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-8 space-y-6">
        <Button variant="ghost" asChild className="-ml-4">
          <Link href={`/courses/${courseId}/learn`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("evaluations.back_to_course")}
          </Link>
        </Button>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("evaluations.title")}</h1>
          <p className="text-muted-foreground">{t("evaluations.subtitle")}</p>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6 flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-10 w-24" />
                </CardContent>
              </Card>
            ))
          ) : evaluations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/10">
              <FileQuestion className="mx-auto h-12 w-12 opacity-20 mb-3" />
              <p>{t("evaluations.none_available")}</p>
            </div>
          ) : (
            evaluations.map((evalItem: Evaluation) => (
              <Card key={evalItem.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle>{evalItem.title}</CardTitle>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {evalItem.duration} {t("evaluations.minutes")}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileQuestion className="h-4 w-4" />
                        {evalItem.questionCount || 0} {t("evaluations.questions")}
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckSquare className="h-4 w-4" />
                        {t("evaluations.pass_mark")}: {evalItem.passMark}%
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">{evalItem.type}</Badge>
                </CardHeader>
                <CardFooter>
                  <Button asChild>
                    <Link href={`/evaluations/${evalItem.id}`}>
                      {t("evaluations.start")}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
