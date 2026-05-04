import { AppLayout } from "@/components/layout/AppLayout";
import { useListFilieres } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, GraduationCap } from "lucide-react";

export default function AdminFilieresPage() {
  const { data: filieres, isLoading } = useListFilieres();

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Filières</h1>
            <p className="text-muted-foreground">Programmes académiques de l'ISC Mbujimayi</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle Filière
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))
          ) : filieres?.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground border rounded-lg bg-muted/10">
              Aucune filière n'a encore été créée.
            </div>
          ) : (
            filieres?.map(filiere => (
              <Card key={filiere.id} className="hover-elevate transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{filiere.code}</span>
                  </div>
                  <CardTitle>{filiere.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{filiere.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm text-muted-foreground mb-4">
                    <span>{filiere.duration} ans</span>
                    <span>{filiere.studentCount || 0} étudiants</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">Modifier</Button>
                    <Button variant="secondary" className="flex-1">Cours</Button>
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
