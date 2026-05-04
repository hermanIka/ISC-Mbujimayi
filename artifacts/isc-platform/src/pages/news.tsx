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
  title: string;
  summary: string;
  content: string;
  category: string;
  publishedAt: Date;
  image?: string;
}

const ARTICLES: Article[] = [
  {
    id: 1,
    title: "Ouverture des inscriptions académiques 2024-2025",
    summary: "L'ISC Mbujimayi annonce l'ouverture officielle des inscriptions pour l'année académique 2024-2025. Les dossiers peuvent être déposés en ligne ou au secrétariat.",
    content: "",
    category: "Inscriptions",
    publishedAt: new Date("2024-09-01"),
  },
  {
    id: 2,
    title: "Calendrier des examens du premier semestre",
    summary: "Le calendrier des examens de fin du premier semestre est maintenant disponible. Consultez votre tableau de bord pour voir les dates correspondant à votre filière.",
    content: "",
    category: "Examens",
    publishedAt: new Date("2024-11-15"),
  },
  {
    id: 3,
    title: "Conférence sur l'entrepreneuriat — Invitation",
    summary: "L'ISC Mbujimayi organise une conférence internationale sur l'entrepreneuriat et l'innovation économique en RDC. Inscription gratuite pour les étudiants.",
    content: "",
    category: "Événements",
    publishedAt: new Date("2024-10-20"),
  },
  {
    id: 4,
    title: "Lancement de la plateforme e-learning ISC",
    summary: "La plateforme digitale de l'ISC Mbujimayi est officiellement lancée. Accédez à vos cours, évaluations et ressources pédagogiques en ligne, 24h/24.",
    content: "",
    category: "Numérique",
    publishedAt: new Date("2024-09-15"),
  },
  {
    id: 5,
    title: "Résultats du concours d'excellence académique",
    summary: "Les lauréats du concours d'excellence académique 2023-2024 ont été récompensés lors d'une cérémonie officielle. Félicitations aux étudiants distingués!",
    content: "",
    category: "Distinctions",
    publishedAt: new Date("2024-08-30"),
  },
  {
    id: 6,
    title: "Nouveaux partenariats avec des entreprises locales",
    summary: "L'ISC Mbujimayi signe des conventions de partenariat avec plusieurs entreprises de la région pour favoriser l'insertion professionnelle de ses diplômés.",
    content: "",
    category: "Partenariats",
    publishedAt: new Date("2024-07-10"),
  },
  {
    id: 7,
    title: "Semaine culturelle ISC Mbujimayi 2024",
    summary: "La semaine culturelle annuelle se tiendra du 18 au 22 novembre. Au programme: expositions, débats, concours artistiques et soirée de gala.",
    content: "",
    category: "Événements",
    publishedAt: new Date("2024-11-01"),
  },
  {
    id: 8,
    title: "Mise à jour du règlement intérieur 2024",
    summary: "Le règlement intérieur de l'ISC Mbujimayi a été mis à jour pour l'année académique 2024-2025. Tous les étudiants sont invités à en prendre connaissance.",
    content: "",
    category: "Administratif",
    publishedAt: new Date("2024-09-05"),
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Inscriptions: "bg-blue-100 text-blue-700",
  Examens: "bg-red-100 text-red-700",
  Événements: "bg-purple-100 text-purple-700",
  Numérique: "bg-cyan-100 text-cyan-700",
  Distinctions: "bg-yellow-100 text-yellow-700",
  Partenariats: "bg-green-100 text-green-700",
  Administratif: "bg-gray-100 text-gray-700",
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
                      <Badge className={`text-xs border-0 ${CATEGORY_COLORS[article.category] ?? "bg-gray-100 text-gray-700"}`}>
                        {article.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl leading-tight">{article.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <Calendar className="h-3.5 w-3.5" />
                      {t("news.published_on")} {format(article.publishedAt, "d MMMM yyyy", { locale })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {article.summary}
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}
                  data-testid={`button-read-more-${article.id}`}
                >
                  {expandedId === article.id ? "Réduire" : t("news.read_more")}
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
