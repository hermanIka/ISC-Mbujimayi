import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, BookOpen, Users, Award, MapPin, Phone, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

interface OrgNode {
  label: string;
  sub?: string;
  variant?: "root" | "branch" | "section" | "bureau" | "leaf";
  children?: OrgNode[];
}

const ISC_ORG: OrgNode = {
  label: "Directeur Général",
  variant: "root",
  children: [
    { label: "Cabinet du DG", variant: "bureau" },
    {
      label: "Secrétaire Général",
      sub: "Académique",
      variant: "branch",
      children: [
        { label: "Bureau du", sub: "Sec. Gén. Academ.", variant: "bureau" },
        { label: "Direction de Coordination", sub: "des Services Académiques", variant: "leaf" },
        { label: "Direction", sub: "des Services Académiques", variant: "leaf" },
        { label: "Division des Services", sub: "Para Académiques", variant: "leaf" },
      ],
    },
    {
      label: "Secrétaire Général",
      sub: "Administratif",
      variant: "branch",
      children: [
        { label: "Bureau du SGAD", variant: "bureau" },
        {
          label: "Gestion Administrative",
          variant: "section",
          children: [
            { label: "Direction de Coordination", sub: "des Services Administratifs", variant: "leaf" },
            { label: "Direction", sub: "du Personnel", variant: "leaf" },
            { label: "Direction des Œuvres", sub: "Estudiantines", variant: "leaf" },
          ],
        },
        {
          label: "Gestion Financière",
          variant: "section",
          children: [
            { label: "Direction", sub: "des Finances", variant: "leaf" },
            { label: "Direction", sub: "du Budget", variant: "leaf" },
            { label: "Direction Patrimoine", sub: "et Intendance", variant: "leaf" },
          ],
        },
      ],
    },
  ],
};

const variantStyles: Record<string, string> = {
  root: "bg-[#1e3a5f] text-white border-[#1e3a5f] font-bold shadow-md",
  branch: "bg-[#1e3a5f]/10 text-[#1e3a5f] border-[#1e3a5f]/40 font-semibold",
  section: "bg-[#d97706]/10 text-[#92400e] border-[#d97706]/50 font-semibold",
  bureau: "bg-slate-100 text-slate-600 border-slate-300 italic",
  leaf: "bg-white text-gray-700 border-gray-300",
};

function OrgBox({ node }: { node: OrgNode }) {
  const cls = variantStyles[node.variant ?? "leaf"];
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      <div className={`px-3 py-2 rounded border-2 text-center text-[11px] leading-tight min-w-[100px] max-w-[140px] ${cls}`}>
        <span className="block">{node.label}</span>
        {node.sub && <span className="block">{node.sub}</span>}
      </div>

      {hasChildren && (
        <>
          <div className="w-px h-5 bg-gray-400" />
          <div className="relative flex items-start">
            <div className="absolute top-0 left-0 right-0 border-t-2 border-gray-400" />
            {node.children!.map((child, i) => (
              <div key={i} className="flex flex-col items-center px-2">
                <div className="w-px h-5 bg-gray-400" />
                <OrgBox node={child} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AboutPage() {
  const { t } = useTranslation();

  const values = [
    { icon: GraduationCap, title: t("about.value_excellence_title"), description: t("about.value_excellence_desc") },
    { icon: BookOpen, title: t("about.value_innovation_title"), description: t("about.value_innovation_desc") },
    { icon: Users, title: t("about.value_community_title"), description: t("about.value_community_desc") },
    { icon: Award, title: t("about.value_recognition_title"), description: t("about.value_recognition_desc") },
  ];

  const stats = [
    { label: t("about.stat_years"), value: "9+" },
    { label: t("about.stat_graduates"), value: "1 500+" },
    { label: t("about.stat_programs"), value: "5" },
    { label: t("about.stat_teachers"), value: "50+" },
  ];

  return (
    <AppLayout>
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img src="/images/about-campus.png" alt="Campus ISC Mbujimayi" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70 flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-3">{t("about.title")}</h1>
          <p className="text-lg text-white/85 max-w-2xl drop-shadow">{t("about.subtitle")}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">

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
          <h2 className="text-2xl font-bold">{t("about.mission")}</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="prose prose-lg text-muted-foreground max-w-none space-y-4">
              <p>{t("about.mission_p1")}</p>
              <p>{t("about.mission_p2")}</p>
              <p>{t("about.mission_p3")}</p>
            </div>
            <div className="rounded-xl overflow-hidden shadow-md">
              <img src="/images/students-campus.png" alt="Étudiants ISC Mbujimayi" className="w-full h-64 object-cover" />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold">{t("about.values")}</h2>
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
          <h2 className="text-2xl font-bold">{t("about.org_chart")}</h2>
          <p className="text-muted-foreground text-sm">{t("about.org_chart_subtitle")}</p>

          <div className="overflow-x-auto rounded-xl border bg-gray-50 p-8">
            <div className="inline-flex flex-col items-center min-w-max mx-auto">

              {/* ── Row 0 : DG + Cabinet (horizontal) ── */}
              <div className="flex items-center gap-0">
                <div className="px-5 py-3 rounded border-2 text-center text-sm font-bold leading-tight bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-md">
                  Directeur Général
                </div>
                <div className="w-10 h-0.5 bg-gray-400" />
                <div className="px-3 py-2 rounded border-2 text-center text-[11px] leading-tight bg-slate-100 text-slate-600 border-slate-300 italic">
                  Cabinet du DG
                </div>
              </div>

              {/* ── VBar from DG ── */}
              <div className="w-px h-6 bg-gray-400" />

              {/* ── Horizontal bridge SGA ↔ SGAD ── */}
              <div className="flex items-start">

                {/* ════ Branche SGA ════ */}
                <div className="flex flex-col items-center px-6">
                  <div className="w-px h-6 bg-gray-400" />
                  <div className="px-3 py-2 rounded border-2 text-center text-[11px] leading-tight min-w-[120px] bg-[#1e3a5f]/10 text-[#1e3a5f] border-[#1e3a5f]/40 font-semibold">
                    Secrétaire Général<br />Académique
                  </div>

                  {/* VBar + Bureau SGA (côté) */}
                  <div className="flex items-center gap-0 mt-0">
                    <div className="flex flex-col items-center">
                      <div className="w-px h-5 bg-gray-400" />
                    </div>
                  </div>

                  {/* Sous-branches SGA */}
                  <div className="relative flex items-start">
                    <div className="absolute top-0 left-0 right-0 border-t-2 border-gray-400" />

                    {/* Bureau côté */}
                    <div className="flex flex-col items-center px-2">
                      <div className="w-px h-5 bg-gray-400" />
                      <div className="px-3 py-2 rounded border-2 text-center text-[11px] leading-tight min-w-[100px] bg-slate-100 text-slate-600 border-slate-300 italic">
                        Bureau du<br />Sec. Gén. Academ.
                      </div>
                    </div>

                    {/* Dir. Coord. Services Acad. */}
                    <div className="flex flex-col items-center px-2">
                      <div className="w-px h-5 bg-gray-400" />
                      <div className="px-3 py-2 rounded border-2 text-center text-[11px] leading-tight max-w-[120px] bg-white text-gray-700 border-gray-300">
                        Direction de Coordination<br />des Services Académiques
                      </div>
                    </div>

                    {/* Dir. Services Acad. */}
                    <div className="flex flex-col items-center px-2">
                      <div className="w-px h-5 bg-gray-400" />
                      <div className="px-3 py-2 rounded border-2 text-center text-[11px] leading-tight max-w-[110px] bg-white text-gray-700 border-gray-300">
                        Direction<br />des Services<br />Académiques
                      </div>
                    </div>

                    {/* Div. Para Acad. */}
                    <div className="flex flex-col items-center px-2">
                      <div className="w-px h-5 bg-gray-400" />
                      <div className="px-3 py-2 rounded border-2 text-center text-[11px] leading-tight max-w-[110px] bg-white text-gray-700 border-gray-300">
                        Division des Services<br />Para Académiques
                      </div>
                    </div>
                  </div>
                </div>

                {/* ════ Branche SGAD ════ */}
                <div className="flex flex-col items-center px-6">
                  <div className="w-px h-6 bg-gray-400" />
                  <div className="px-3 py-2 rounded border-2 text-center text-[11px] leading-tight min-w-[120px] bg-[#1e3a5f]/10 text-[#1e3a5f] border-[#1e3a5f]/40 font-semibold">
                    Secrétaire Général<br />Administratif
                  </div>

                  <div className="w-px h-5 bg-gray-400" />

                  {/* Sous-branches SGAD */}
                  <div className="relative flex items-start">
                    <div className="absolute top-0 left-0 right-0 border-t-2 border-gray-400" />

                    {/* Bureau SGAD */}
                    <div className="flex flex-col items-center px-2">
                      <div className="w-px h-5 bg-gray-400" />
                      <div className="px-3 py-2 rounded border-2 text-center text-[11px] leading-tight min-w-[90px] bg-slate-100 text-slate-600 border-slate-300 italic">
                        Bureau du SGAD
                      </div>
                    </div>

                    {/* Gestion Administrative */}
                    <div className="flex flex-col items-center px-2">
                      <div className="w-px h-5 bg-gray-400" />
                      <div className="px-3 py-2 rounded border-2 text-center text-[11px] leading-tight min-w-[110px] bg-[#d97706]/10 text-[#92400e] border-[#d97706]/50 font-semibold">
                        Gestion<br />Administrative
                      </div>

                      <div className="w-px h-4 bg-gray-400" />
                      <div className="relative flex items-start">
                        <div className="absolute top-0 left-0 right-0 border-t-2 border-gray-400" />

                        <div className="flex flex-col items-center px-1">
                          <div className="w-px h-4 bg-gray-400" />
                          <div className="px-2 py-1.5 rounded border-2 text-center text-[10px] leading-tight max-w-[100px] bg-white text-gray-700 border-gray-300">
                            Direction de Coordination<br />des Services Administratifs
                          </div>
                        </div>
                        <div className="flex flex-col items-center px-1">
                          <div className="w-px h-4 bg-gray-400" />
                          <div className="px-2 py-1.5 rounded border-2 text-center text-[10px] leading-tight max-w-[80px] bg-white text-gray-700 border-gray-300">
                            Direction<br />du Personnel
                          </div>
                        </div>
                        <div className="flex flex-col items-center px-1">
                          <div className="w-px h-4 bg-gray-400" />
                          <div className="px-2 py-1.5 rounded border-2 text-center text-[10px] leading-tight max-w-[90px] bg-white text-gray-700 border-gray-300">
                            Direction des Œuvres<br />Estudiantines
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gestion Financière */}
                    <div className="flex flex-col items-center px-2">
                      <div className="w-px h-5 bg-gray-400" />
                      <div className="px-3 py-2 rounded border-2 text-center text-[11px] leading-tight min-w-[110px] bg-[#d97706]/10 text-[#92400e] border-[#d97706]/50 font-semibold">
                        Gestion<br />Financière
                      </div>

                      <div className="w-px h-4 bg-gray-400" />
                      <div className="relative flex items-start">
                        <div className="absolute top-0 left-0 right-0 border-t-2 border-gray-400" />

                        <div className="flex flex-col items-center px-1">
                          <div className="w-px h-4 bg-gray-400" />
                          <div className="px-2 py-1.5 rounded border-2 text-center text-[10px] leading-tight max-w-[80px] bg-white text-gray-700 border-gray-300">
                            Direction<br />des Finances
                          </div>
                        </div>
                        <div className="flex flex-col items-center px-1">
                          <div className="w-px h-4 bg-gray-400" />
                          <div className="px-2 py-1.5 rounded border-2 text-center text-[10px] leading-tight max-w-[80px] bg-white text-gray-700 border-gray-300">
                            Direction<br />du Budget
                          </div>
                        </div>
                        <div className="flex flex-col items-center px-1">
                          <div className="w-px h-4 bg-gray-400" />
                          <div className="px-2 py-1.5 rounded border-2 text-center text-[10px] leading-tight max-w-[90px] bg-white text-gray-700 border-gray-300">
                            Direction Patrimoine<br />et Intendance
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
              {/* ── end main branches ── */}

            </div>

            {/* Légende */}
            <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t justify-center text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 bg-[#1e3a5f] border-[#1e3a5f]" />
                Direction générale
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 bg-[#1e3a5f]/10 border-[#1e3a5f]/40" />
                Secrétariat général
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 bg-[#d97706]/10 border-[#d97706]/50" />
                Gestion
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 bg-white border-gray-300" />
                Directions / Divisions
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 bg-slate-100 border-slate-300" />
                Bureaux
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold">{t("about.contact_us")}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6 flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">{t("about.address_label")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("contact.address_line1")}, {t("contact.address_line2")},<br />
                    {t("contact.address_line3")}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">{t("about.phone_label")}</p>
                  <p className="text-sm text-muted-foreground">+243 99 4676705</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">{t("about.email_label")}</p>
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
