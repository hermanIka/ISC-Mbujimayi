import { AppLayout } from "@/components/layout/AppLayout";
import { useListInscriptions, getListInscriptionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus } from "lucide-react";
import { format } from "date-fns";

export default function InscriptionsPage() {
  const { data, isLoading } = useListInscriptions();

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
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mes Inscriptions</h1>
            <p className="text-muted-foreground">Suivez l'état de vos dossiers académiques</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle Inscription
          </Button>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))
          ) : !data?.inscriptions || data.inscriptions.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium">Aucune inscription</h3>
              <p className="text-muted-foreground mt-1">Vous n'avez pas encore soumis de dossier d'inscription.</p>
              <Button variant="outline" className="mt-4">Commencer l'inscription</Button>
            </div>
          ) : (
            (data?.inscriptions ?? []).map((inscription: any) => (
              <Card key={inscription.id}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">Dossier d'inscription académique</h3>
                    <p className="text-sm text-muted-foreground">
                      Soumis le {inscription.createdAt ? format(new Date(inscription.createdAt), 'dd/MM/yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(inscription.status)} variant="outline">
                      {getStatusText(inscription.status)}
                    </Badge>
                    <Button variant="ghost" size="sm">Détails</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
