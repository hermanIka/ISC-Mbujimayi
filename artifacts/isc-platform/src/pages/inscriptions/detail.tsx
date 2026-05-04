import { AppLayout } from "@/components/layout/AppLayout";
import { useGetInscriptionById, getGetInscriptionByIdQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";

export default function InscriptionDetailPage() {
  const [, params] = useRoute("/inscriptions/:id");
  const inscriptionId = params?.id || "";

  const { data: inscription, isLoading } = useGetInscriptionById(inscriptionId, {
    query: { enabled: !!inscriptionId, queryKey: getGetInscriptionByIdQueryKey(inscriptionId) }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-500/10 text-green-700 hover:bg-green-500/20';
      case 'REJECTED': return 'bg-red-500/10 text-red-700 hover:bg-red-500/20';
      case 'UNDER_REVIEW': return 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20';
      default: return 'bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'Approuvé';
      case 'REJECTED': return 'Rejeté';
      case 'UNDER_REVIEW': return 'En révision';
      default: return 'En attente';
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" asChild className="-ml-4">
          <Link href="/inscriptions"><ArrowLeft className="mr-2 h-4 w-4" /> Retour aux inscriptions</Link>
        </Button>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !inscription ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold">Inscription introuvable</h2>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Détails de l'inscription</h1>
                <p className="text-muted-foreground mt-1">Identifiant: {inscription.id}</p>
              </div>
              <Badge className={getStatusColor(inscription.status)} variant="outline">
                {getStatusText(inscription.status)}
              </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" /> Informations du candidat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Nom complet</div>
                    <div className="font-medium">{inscription.student?.firstName} {inscription.student?.lastName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Téléphone</div>
                    <div className="font-medium">{inscription.student?.phone || "Non renseigné"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Filière demandée</div>
                    <div className="font-medium">{inscription.student?.filiere?.name || "Non assignée"}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Suivi du dossier
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Date de soumission
                    </div>
                    <div className="font-medium">
                      {inscription.createdAt ? format(new Date(inscription.createdAt), 'dd/MM/yyyy à HH:mm') : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Dernière mise à jour
                    </div>
                    <div className="font-medium">
                      {inscription.updatedAt ? format(new Date(inscription.updatedAt), 'dd/MM/yyyy à HH:mm') : 'N/A'}
                    </div>
                  </div>
                  {inscription.notes && (
                    <div>
                      <div className="text-sm text-muted-foreground">Notes de l'administration</div>
                      <div className="p-3 bg-muted/30 rounded-md text-sm mt-1">{inscription.notes}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
