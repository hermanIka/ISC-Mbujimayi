import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, BookOpen, Users, Award, MapPin, Phone, Mail } from "lucide-react";

const values = [
  {
    icon: GraduationCap,
    title: "Excellence académique",
    description:
      "Nous formons des professionnels compétents et adaptés aux réalités économiques de la RDC et du monde.",
  },
  {
    icon: BookOpen,
    title: "Innovation pédagogique",
    description:
      "Nos méthodes d'enseignement modernes combinent théorie et pratique pour un apprentissage optimal.",
  },
  {
    icon: Users,
    title: "Communauté engagée",
    description:
      "Une communauté estudiantine dynamique, soutenue par un corps professoral expérimenté et dévoué.",
  },
  {
    icon: Award,
    title: "Reconnaissance officielle",
    description:
      "Institut agréé par le Gouvernement de la République Démocratique du Congo, délivrant des diplômes reconnus.",
  },
];

const stats = [
  { label: "Années d'existence", value: "30+" },
  { label: "Étudiants formés", value: "5 000+" },
  { label: "Filières disponibles", value: "5" },
  { label: "Enseignants qualifiés", value: "50+" },
];

export default function AboutPage() {
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        <section className="text-center space-y-4">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mx-auto mb-4">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Institut Supérieur de Commerce de Mbujimayi
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Depuis plus de 30 ans, l'ISC Mbujimayi forme les cadres et professionnels
            qui façonnent l'économie du Kasaï-Oriental et de la République Démocratique du Congo.
          </p>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.label} className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Notre Mission</h2>
          <div className="prose prose-lg text-muted-foreground max-w-none space-y-4">
            <p>
              L'Institut Supérieur de Commerce de Mbujimayi (ISC Mbujimayi) est un établissement
              d'enseignement supérieur public situé à Mbujimayi, chef-lieu de la province du Kasaï-Oriental,
              en République Démocratique du Congo.
            </p>
            <p>
              Notre mission est de former des professionnels hautement qualifiés dans les domaines du
              commerce, de la gestion, de l'informatique et des finances, capables de contribuer
              activement au développement socio-économique du pays.
            </p>
            <p>
              À travers une pédagogie innovante et des partenariats stratégiques, nous offrons à nos
              étudiants les outils nécessaires pour réussir dans un monde professionnel en constante évolution.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Nos valeurs</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {values.map((value) => (
              <Card key={value.title}>
                <CardContent className="pt-6 flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{value.title}</h3>
                    <p className="text-muted-foreground text-sm">{value.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Nous contacter</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6 flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Adresse</p>
                  <p className="text-sm text-muted-foreground">
                    Avenue Bakwa Dianga, Mbujimayi,<br />
                    Kasaï-Oriental, RDC
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Téléphone</p>
                  <p className="text-sm text-muted-foreground">+243 99 000 0000</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">info@isc-mbujimayi.ac.cd</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
