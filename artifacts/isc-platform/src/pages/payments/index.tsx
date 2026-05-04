import { AppLayout } from "@/components/layout/AppLayout";
import { useListPayments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Plus } from "lucide-react";

export default function PaymentsPage() {
  const { data, isLoading } = useListPayments();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'FAILED': return 'bg-red-500/10 text-red-700 border-red-200';
      case 'CANCELLED': return 'bg-gray-500/10 text-gray-700 border-gray-200';
      default: return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Paiements</h1>
            <p className="text-muted-foreground">Gérez vos frais académiques (Mobile Money)</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Effectuer un paiement
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historique des transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : !data?.payments || data.payments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="mx-auto h-12 w-12 opacity-20 mb-4" />
                <p>Aucune transaction trouvée.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Opérateur</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.payments ?? []).map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">{payment.reference || "N/A"}</TableCell>
                      <TableCell>{payment.type}</TableCell>
                      <TableCell>{payment.operator}</TableCell>
                      <TableCell className="font-medium">{payment.amount} {payment.currency}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.status)} variant="outline">
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
