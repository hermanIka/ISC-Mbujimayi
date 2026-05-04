import { AppLayout } from "@/components/layout/AppLayout";
import { useListCertificates } from "@workspace/api-client-react";
import type { Certificate } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Download, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { Link } from "@/lib/router";

export default function CertificatesPage() {
  const { data, isLoading } = useListCertificates();

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes Certificats</h1>
          <p className="text-muted-foreground">Téléchargez et vérifiez vos attestations de réussite</p>
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
              <h3 className="text-lg font-medium">Aucun certificat</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                Terminez un cours avec succès pour obtenir un certificat reconnu.
              </p>
              <Button asChild variant="outline" className="mt-6">
                <Link href="/courses">Explorer les cours</Link>
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
                      <span className="text-muted-foreground">Date d'obtention:</span>
                      <span className="font-medium">{format(new Date(cert.issuedAt), 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Identifiant:</span>
                      <span className="font-mono text-xs truncate max-w-[120px]">{cert.hash}</span>
                    </div>
                    <div className="pt-4 flex items-center text-green-600 gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Authentifié & Vérifiable</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 gap-2">
                  <Button className="flex-1" variant="default">
                    <Download className="mr-2 h-4 w-4" /> PDF
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/certificates/verify/${cert.hash}`}>Vérifier</Link>
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
