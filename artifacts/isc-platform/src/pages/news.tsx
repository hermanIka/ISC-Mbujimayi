import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";

interface Article {
  id: number;
  titleKey: string;
  summaryKey: string;
  contentKey: string;
  categoryKey: string;
  publishedAt: Date;
}

const ARTICLES: Article[] = [
  {
    id: 1,
    titleKey: "news.article_1_title",
    summaryKey: "news.article_1_summary",
    contentKey: "news.article_1_content",
    categoryKey: "news.cat_registrations",
    publishedAt: new Date("2024-09-01"),
  },
  {
    id: 2,
    titleKey: "news.article_2_title",
    summaryKey: "news.article_2_summary",
    contentKey: "news.article_2_content",
    categoryKey: "news.cat_exams",
    publishedAt: new Date("2024-11-15"),
  },
  {
    id: 3,
    titleKey: "news.article_3_title",
    summaryKey: "news.article_3_summary",
    contentKey: "news.article_3_content",
    categoryKey: "news.cat_events",
    publishedAt: new Date("2024-10-20"),
  },
  {
    id: 4,
    titleKey: "news.article_4_title",
    summaryKey: "news.article_4_summary",
    contentKey: "news.article_4_content",
    categoryKey: "news.cat_digital",
    publishedAt: new Date("2024-09-15"),
  },
  {
    id: 5,
    titleKey: "news.article_5_title",
    summaryKey: "news.article_5_summary",
    contentKey: "news.article_5_content",
    categoryKey: "news.cat_awards",
    publishedAt: new Date("2024-08-30"),
  },
  {
    id: 6,
    titleKey: "news.article_6_title",
    summaryKey: "news.article_6_summary",
    contentKey: "news.article_6_content",
    categoryKey: "news.cat_partnerships",
    publishedAt: new Date("2024-07-10"),
  },
  {
    id: 7,
    titleKey: "news.article_7_title",
    summaryKey: "news.article_7_summary",
    contentKey: "news.article_7_content",
    categoryKey: "news.cat_events",
    publishedAt: new Date("2024-11-01"),
  },
  {
    id: 8,
    titleKey: "news.article_8_title",
    summaryKey: "news.article_8_summary",
    contentKey: "news.article_8_content",
    categoryKey: "news.cat_admin",
    publishedAt: new Date("2024-09-05"),
  },
];

const CATEGORY_CLASS: Record<string, string> = {
  "news.cat_registrations": "bg-blue-100 text-blue-700",
  "news.cat_exams": "bg-red-100 text-red-700",
  "news.cat_events": "bg-purple-100 text-purple-700",
  "news.cat_digital": "bg-cyan-100 text-cyan-700",
  "news.cat_awards": "bg-yellow-100 text-yellow-700",
  "news.cat_partnerships": "bg-green-100 text-green-700",
  "news.cat_admin": "bg-gray-100 text-gray-700",
};

const PAGE_SIZE = 4;

export default function NewsPage() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const locale = i18n.language === "fr" ? fr : enUS;
  const sorted = [...ARTICLES].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        <section className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mx-auto">
            <Newspaper className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">{t("news.title")}</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">{t("news.subtitle")}</p>
        </section>

        <div className="space-y-4">
          {paged.map((article) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge className={`text-xs border-0 ${CATEGORY_CLASS[article.categoryKey] ?? "bg-gray-100 text-gray-700"}`}>
                        {t(article.categoryKey as Parameters<typeof t>[0])}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl leading-tight">{t(article.titleKey as Parameters<typeof t>[0])}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <Calendar className="h-3.5 w-3.5" />
                      {t("news.published_on")} {format(article.publishedAt, "d MMMM yyyy", { locale })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(article.summaryKey as Parameters<typeof t>[0])}
                </p>
                {expandedId === article.id && (
                  <p className="text-sm text-muted-foreground leading-relaxed mt-3 pt-3 border-t">
                    {t(article.contentKey as Parameters<typeof t>[0])}
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}
                  data-testid={`button-read-more-${article.id}`}
                >
                  {expandedId === article.id ? t("news.collapse") : t("news.read_more")}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              data-testid="button-news-prev"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t("news.prev")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t("news.page")} {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              data-testid="button-news-next"
            >
              {t("news.next")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
