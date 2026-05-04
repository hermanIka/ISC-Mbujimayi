import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, BookOpen, Users, Award, MapPin, Phone, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

interface OrgNode {
  labelKey: string;
  children?: OrgNode[];
}

const ORG_CHART: OrgNode = {
  labelKey: "about.org_general_direction",
  children: [
    {
      labelKey: "about.org_academic_direction",
      children: [
        { labelKey: "about.org_dept_compta" },
        { labelKey: "about.org_dept_mktg" },
        { labelKey: "about.org_dept_info" },
        { labelKey: "about.org_dept_grh" },
        { labelKey: "about.org_dept_fisc" },
      ],
    },
    {
      labelKey: "about.org_financial_direction",
      children: [
        { labelKey: "about.org_general_accounting" },
        { labelKey: "about.org_academic_fees" },
      ],
    },
    {
      labelKey: "about.org_administration",
      children: [
        { labelKey: "about.org_secretariat" },
        { labelKey: "about.org_library" },
        { labelKey: "about.org_it" },
      ],
    },
  ],
};

function OrgBox({ node, isRoot = false, t }: { node: OrgNode; isRoot?: boolean; t: (key: string) => string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`px-3 py-2 rounded-lg border text-center text-xs font-medium whitespace-nowrap shadow-sm
          ${isRoot
            ? "bg-primary text-primary-foreground border-primary text-sm px-5 py-3 font-bold"
            : "bg-card text-foreground border-border"
          }`}
      >
        {t(node.labelKey)}
      </div>
      {node.children && node.children.length > 0 && (
        <div className="flex flex-col items-center mt-0">
          <div className="w-px h-4 bg-border" />
          <div className="flex gap-4 items-start relative">
            <div
              className="absolute top-0 left-0 right-0 border-t border-border"
              style={{ top: 0 }}
            />
            {node.children.map((child, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="w-px h-4 bg-border" />
                <OrgBox node={child} t={t} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AboutPage() {
  const { t } = useTranslation();

  const values = [
    {
      icon: GraduationCap,
      title: t("about.value_excellence_title"),
      description: t("about.value_excellence_desc"),
    },
    {
      icon: BookOpen,
      title: t("about.value_innovation_title"),
      description: t("about.value_innovation_desc"),
    },
    {
      icon: Users,
      title: t("about.value_community_title"),
      description: t("about.value_community_desc"),
    },
    {
      icon: Award,
      title: t("about.value_recognition_title"),
      description: t("about.value_recognition_desc"),
    },
  ];

  const stats = [
    { label: t("about.stat_years"), value: "30+" },
    { label: t("about.stat_graduates"), value: "5 000+" },
    { label: t("about.stat_programs"), value: "5" },
    { label: t("about.stat_teachers"), value: "50+" },
  ];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        <section className="text-center space-y-4">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mx-auto mb-4">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            {t("about.title")}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("about.subtitle")}
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
          <h2 className="text-2xl font-bold">{t("about.mission")}</h2>
          <div className="prose prose-lg text-muted-foreground max-w-none space-y-4">
            <p>{t("about.mission_p1")}</p>
            <p>{t("about.mission_p2")}</p>
            <p>{t("about.mission_p3")}</p>
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
          <div className="overflow-x-auto py-4">
            <div className="flex justify-center min-w-max">
              <OrgBox node={ORG_CHART} isRoot t={(key) => t(key as Parameters<typeof t>[0])} />
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
                  <p className="text-sm text-muted-foreground">+243 99 000 0000</p>
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
