import { AppLayout } from "@/components/layout/AppLayout";
import { useListFilieres } from "@workspace/api-client-react";
import type { Filiere } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/router";
import { BookOpen, Users, GraduationCap } from "lucide-react";

const FILIERE_DESCRIPTIONS: Record<string, string> = {
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

const FILIERE_DURATION = "3 ans (Licence)";

export default function ProgramsPage() {
  const { data, isLoading } = useListFilieres();
  const filieres: Filiere[] = Array.isArray(data) ? data : [];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <section className="text-center space-y-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mx-auto">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Nos Filières</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            L'ISC Mbujimayi propose cinq filières professionnalisantes reconnues par l'État,
            conçues pour répondre aux besoins du marché du travail congolais.
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
            <p>Les filières seront disponibles prochainement.</p>
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
                    {FILIERE_DURATION}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {FILIERE_DESCRIPTIONS[filiere.name] ??
                      "Formation professionnelle de haut niveau en " + filiere.name.toLowerCase() + "."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {filiere.studentCount ?? 0} étudiants
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Diplôme d'État
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href="/courses">Voir les cours</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <section className="bg-primary/5 rounded-xl p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">Prêt à commencer votre parcours ?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Inscrivez-vous dès aujourd'hui et rejoignez la communauté ISC Mbujimayi.
            Nos conseillers académiques sont disponibles pour vous accompagner.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/sign-up">S'inscrire maintenant</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">Nous contacter</Link>
            </Button>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
