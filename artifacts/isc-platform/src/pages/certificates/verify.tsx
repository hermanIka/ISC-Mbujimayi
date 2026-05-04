import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useVerifyCertificate, getVerifyCertificateQueryKey } from "@workspace/api-client-react";
import { useRoute, Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, CheckCircle, XCircle, Home, User, Search } from "lucide-react";
import { format } from "date-fns";

export default function CertificateVerificationPage() {
  const [, params] = useRoute("/certificates/verify/:hash");
  const hash = params?.hash || "";
  const [, setLocation] = useLocation();
  const [inputCode, setInputCode] = useState(hash);

  const { data: verificationResult, isLoading, isError } = useVerifyCertificate(hash, {
    query: { enabled: !!hash, queryKey: getVerifyCertificateQueryKey(hash), retry: false }
  });

  const handleVerify = () => {
    const trimmed = inputCode.trim();
    if (trimmed) {
      setLocation(`/certificates/verify/${trimmed}`);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12">
        <div className="w-full max-w-xl space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Vérification de Certificat</h1>
            <p className="text-muted-foreground mt-2">Institut Supérieur de Commerce Mbujimayi</p>
          </div>

          {/* Always show the search form */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cert-code">Code du certificat</Label>
                <div className="flex gap-2">
                  <Input
                    id="cert-code"
                    placeholder="Entrez le code du certificat..."
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                    data-testid="certificate-code-input"
                  />
                  <Button onClick={handleVerify} data-testid="button-verify">
                    <Search className="mr-2 h-4 w-4" /> Vérifier
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Show result only when hash is in URL */}
          {hash && (
            isLoading ? (
              <Card>
                <CardHeader className="text-center">
                  <Skeleton className="h-8 w-1/2 mx-auto" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ) : isError || !verificationResult?.valid ? (
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="pt-10 pb-8 flex flex-col items-center text-center">
                  <XCircle className="h-16 w-16 text-red-500 mb-4" />
                  <h2 className="text-2xl font-bold text-red-700 mb-2">Certificat Invalide</h2>
                  <p className="text-muted-foreground">
                    Ce numéro de certificat ne correspond à aucun document valide dans notre base de données.
                  </p>
                </CardContent>
                <CardFooter className="justify-center pb-6">
                  <Button asChild variant="outline">
                    <Link href="/"><Home className="mr-2 h-4 w-4" /> Retour à l'accueil</Link>
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card className="border-green-200 relative overflow-hidden">
                <div className="absolute top-0 w-full h-2 bg-green-500" />
                <CardContent className="pt-10 pb-8 text-center space-y-6">
                  <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-green-700 mb-1">Certificat Valide</h2>
                    <p className="text-sm font-mono text-muted-foreground">ID: {hash}</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-6 text-left space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm text-muted-foreground">Décerné à</div>
                        <div className="font-semibold text-lg">
                          {verificationResult.certificate?.studentId}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm text-muted-foreground">Pour la réussite du cours</div>
                        <div className="font-semibold">{verificationResult.certificate?.course?.title}</div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border/50 flex justify-between text-sm">
                      <div>
                        <span className="text-muted-foreground">Date d'émission: </span>
                        <span className="font-medium">
                          {verificationResult.certificate?.issuedAt
                            ? format(new Date(verificationResult.certificate.issuedAt), 'dd/MM/yyyy')
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="font-semibold text-primary">ISC Mbujimayi</div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/10 justify-center py-4 border-t">
                  <Button asChild variant="ghost">
                    <Link href="/"><Home className="mr-2 h-4 w-4" /> Retour à l'accueil</Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          )}
        </div>
      </div>
    </AppLayout>
  );
}
