import { AppLayout } from "@/components/layout/AppLayout";
import { useListTeachers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

export default function AdminTeachersPage() {
  const { data, isLoading } = useListTeachers();

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Corps Professoral</h1>
            <p className="text-muted-foreground">Gestion des enseignants et professeurs</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Ajouter un enseignant
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Spécialité</TableHead>
                    <TableHead>Cours affectés</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(data) ? data : []).map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-mono text-xs">{teacher.code}</TableCell>
                      <TableCell className="font-medium">{teacher.firstName} {teacher.lastName}</TableCell>
                      <TableCell>{teacher.grade}</TableCell>
                      <TableCell>{teacher.specialty}</TableCell>
                      <TableCell>{teacher.courseCount || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Gérer</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!data || (Array.isArray(data) && data.length === 0)) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Aucun enseignant enregistré.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
