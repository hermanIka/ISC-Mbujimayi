import { AppLayout } from "@/components/layout/AppLayout";
import { useListCertificates } from "@workspace/api-client-react";
import type { Certificate } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Download, CheckCircle, Share2, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { Link } from "@/lib/router";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@clerk/react";

async function downloadApiPdf(url: string, filename: string, getToken: () => Promise<string | null>): Promise<void> {
  const token = await getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(url, { credentials: "include", headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export default function CertificatesPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { getToken } = useAuth();
  const { data, isLoading } = useListCertificates();
  const dateLocale = i18n.language === "fr" ? fr : enUS;
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const handleDownload = async (cert: Certificate) => {
    if (downloadingIds.has(cert.id)) return;
    setDownloadingIds((prev) => new Set(prev).add(cert.id));
    try {
      await downloadApiPdf(
        `/api/certificates/${cert.id}/download`,
        `certificat-ISC-${cert.hash?.slice(0, 8) ?? cert.id}.pdf`,
        getToken,
      );
      toast({ title: t("certificates.download_started"), description: t("certificates.download_desc") });
    } catch {
      toast({ title: t("common.error"), description: t("certificates.download_error"), variant: "destructive" });
    } finally {
      setDownloadingIds((prev) => { const next = new Set(prev); next.delete(cert.id); return next; });
    }
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
                  <Button
                    className="flex-1"
                    variant="default"
                    onClick={() => handleDownload(cert)}
                    disabled={downloadingIds.has(cert.id)}
                    data-testid={`btn-download-certificate-${cert.id}`}
                  >
                    {downloadingIds.has(cert.id) ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {downloadingIds.has(cert.id) ? t("certificates.downloading") : t("certificates.download")}
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
