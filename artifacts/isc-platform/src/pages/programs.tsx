import { AppLayout } from "@/components/layout/AppLayout";
import { useListFilieres } from "@workspace/api-client-react";
import type { Filiere } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/router";
import { BookOpen, Users, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";

const FILIERE_DESCRIPTIONS_FR: Record<string, string> = {
  Comptabilité:
    "Formation complète en comptabilité générale, analytique, fiscalité et audit. Prépare aux métiers de comptable, auditeur et contrôleur de gestion.",
  Marketing:
    "Techniques de vente, marketing digital, étude de marché et gestion commerciale. Forme les professionnels du commerce moderne.",
  "Informatique de Gestion":
    "Systèmes d'information, développement logiciel, bases de données et management IT. Pour les professionnels du numérique en entreprise.",
  GRH:
    "Gestion des ressources humaines, droit du travail, recrutement et développement organisationnel. Forme les DRH de demain.",
  Fiscalité:
    "Droit fiscal congolais, procédures fiscales, optimisation fiscale et conseil aux entreprises. Prépare aux métiers du conseil fiscal.",
};

const FILIERE_DESCRIPTIONS_EN: Record<string, string> = {
  Comptabilité:
    "Complete training in general accounting, analytical accounting, taxation and auditing. Prepares for roles as accountant, auditor and management controller.",
  Marketing:
    "Sales techniques, digital marketing, market research and commercial management. Trains professionals in modern commerce.",
  "Informatique de Gestion":
    "Information systems, software development, databases and IT management. For digital professionals in business.",
  GRH:
    "Human resources management, labor law, recruitment and organizational development. Trains the HR directors of tomorrow.",
  Fiscalité:
    "Congolese tax law, tax procedures, tax optimization and business consulting. Prepares for careers in tax advisory.",
};

export default function ProgramsPage() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useListFilieres();
  const filieres: Filiere[] = Array.isArray(data) ? data : [];

  const descriptions = i18n.language === "fr" ? FILIERE_DESCRIPTIONS_FR : FILIERE_DESCRIPTIONS_EN;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <section className="text-center space-y-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mx-auto">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">{t("programs.title")}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("programs.subtitle")}
          </p>
        </section>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/3 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filieres.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="mx-auto h-12 w-12 opacity-30 mb-4" />
            <p>{t("programs.coming_soon")}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filieres.map((filiere: Filiere) => (
              <Card key={filiere.id} className="flex flex-col hover:shadow-md transition-shadow">
                <div className="h-2 bg-primary rounded-t-xl" />
                <CardHeader>
                  <CardTitle className="text-xl">{filiere.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {t("programs.duration")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {descriptions[filiere.name] ??
                      filiere.description ??
                      t("programs.default_desc", { name: filiere.name.toLowerCase() })}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {filiere.studentCount ?? 0} {t("programs.students")}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {t("programs.state_diploma")}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href="/courses">{t("programs.view_courses")}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <section className="bg-primary/5 rounded-xl p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">{t("programs.cta_title")}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t("programs.cta_subtitle")}
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/sign-up">{t("programs.register_now")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">{t("programs.contact_us")}</Link>
            </Button>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
