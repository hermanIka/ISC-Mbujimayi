import { AppLayout } from "@/components/layout/AppLayout";
import { useListCertificates } from "@workspace/api-client-react";
import type { Certificate } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Download, CheckCircle, Share2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { Link } from "@/lib/router";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

export default function CertificatesPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { data, isLoading } = useListCertificates();
  const dateLocale = i18n.language === "fr" ? fr : enUS;

  const handleDownload = (cert: Certificate) => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    doc.setFillColor(15, 34, 64);
    doc.rect(0, 0, W, 18, "F");
    doc.setFillColor(15, 34, 64);
    doc.rect(0, H - 12, W, 12, "F");

    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(1.2);
    doc.rect(10, 22, W - 20, H - 36, "S");
    doc.setLineWidth(0.4);
    doc.rect(12, 24, W - 24, H - 40, "S");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("INSTITUT SUPERIEUR DE COMMERCE — MBUJIMAYI", W / 2, 12, { align: "center" });

    doc.setTextColor(15, 34, 64);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text(t("certificates.certificate_of_completion").toUpperCase(), W / 2, 50, { align: "center" });

    doc.setFontSize(13);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(t("certificates.cert_presented_to"), W / 2, 68, { align: "center" });

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 34, 64);
    doc.text(cert.course?.title ?? "—", W / 2, 90, { align: "center", maxWidth: W - 60 });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);

    const issuedStr = format(new Date(cert.issuedAt), "dd MMMM yyyy", { locale: dateLocale });
    doc.text(`${t("certificates.issued_on")}: ${issuedStr}`, W / 2, 115, { align: "center" });
    doc.text(`${t("certificates.identifier")}: ${cert.hash}`, W / 2, 122, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    doc.text(t("certificates.verified_text"), W / 2, 140, { align: "center" });

    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.6);
    doc.line(W / 2 - 40, 148, W / 2 + 40, 148);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`ISC Mbujimayi — ${new Date().getFullYear()}`, W / 2, H - 5, { align: "center" });

    doc.save(`certificat-ISC-${cert.hash?.slice(0, 8) ?? cert.id}.pdf`);
    toast({ title: t("certificates.download_started"), description: t("certificates.download_desc") });
  };

  const handleShare = async (cert: Certificate) => {
    const verifyUrl = `${window.location.origin}/certificates/verify/${cert.hash}`;
    if (navigator.share) {
      await navigator.share({
        title: t("certificates.share_title"),
        text: cert.course?.title ?? "",
        url: verifyUrl,
      });
    } else {
      await navigator.clipboard.writeText(verifyUrl);
      toast({ title: t("certificates.link_copied"), description: verifyUrl });
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("certificates.title")}</h1>
          <p className="text-muted-foreground">{t("certificates.subtitle")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))
          ) : !data || (Array.isArray(data) && data.length === 0) ? (
            <div className="col-span-full py-16 text-center border rounded-xl bg-muted/10">
              <Award className="mx-auto h-16 w-16 text-muted-foreground opacity-30 mb-4" />
              <h3 className="text-lg font-medium">{t("certificates.none_title")}</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                {t("certificates.none_desc")}
              </p>
              <Button asChild variant="outline" className="mt-6">
                <Link href="/courses">{t("certificates.explore_courses")}</Link>
              </Button>
            </div>
          ) : (
            (Array.isArray(data) ? data : [] as Certificate[]).map((cert: Certificate) => (
              <Card key={cert.id} className="overflow-hidden border-2 flex flex-col">
                <div className="bg-primary/5 p-6 flex justify-center border-b border-primary/10">
                  <Award className="h-20 w-20 text-primary" />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl line-clamp-2">{cert.course?.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("certificates.issued_on")}:</span>
                      <span className="font-medium">
                        {format(new Date(cert.issuedAt), "dd/MM/yyyy", { locale: dateLocale })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("certificates.identifier")}:</span>
                      <span className="font-mono text-xs truncate max-w-[120px]">{cert.hash}</span>
                    </div>
                    <div className="pt-4 flex items-center text-green-600 gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>{t("certificates.verified_label")}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 gap-2 flex flex-wrap">
                  <Button className="flex-1" variant="default" onClick={() => handleDownload(cert)}>
                    <Download className="mr-2 h-4 w-4" />
                    {t("certificates.download")}
                  </Button>
                  <Button variant="outline" size="icon" title={t("certificates.share")} onClick={() => handleShare(cert)}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" asChild title={t("certificates.verify")}>
                    <Link href={`/certificates/verify/${cert.hash}`}>
                      <ExternalLink className="h-4 w-4" />
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
