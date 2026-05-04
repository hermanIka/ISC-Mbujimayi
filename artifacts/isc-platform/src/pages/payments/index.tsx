import { AppLayout } from "@/components/layout/AppLayout";
import { useListPayments, useInitiatePayment, getListPaymentsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";

export default function PaymentsPage() {
  const { data, isLoading } = useListPayments();
  const initiatePayment = useInitiatePayment();
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<any>("MINERVAL");
  const [operator, setOperator] = useState<any>("ORANGE");
  const [phoneNumber, setPhoneNumber] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'FAILED': return 'bg-red-500/10 text-red-700 border-red-200';
      case 'CANCELLED': return 'bg-gray-500/10 text-gray-700 border-gray-200';
      default: return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    }
  };

  const handlePayment = async () => {
    if (!amount || !phoneNumber) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }

    try {
      await initiatePayment.mutateAsync({
        data: {
          studentId: "me", // Backend logic determines current user
          amount,
          type,
          operator,
          phoneNumber,
        }
      });
      toast({ title: "Paiement initié", description: "Veuillez confirmer sur votre téléphone." });
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible d'initier le paiement", variant: "destructive" });
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
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Effectuer un paiement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau Paiement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Type de frais</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSCRIPTION">Frais d'inscription</SelectItem>
                      <SelectItem value="MINERVAL">Minerval</SelectItem>
                      <SelectItem value="EXAM_FEES">Frais d'examens</SelectItem>
                      <SelectItem value="OTHER">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Opérateur</Label>
                  <Select value={operator} onValueChange={setOperator}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner l'opérateur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ORANGE">Orange Money</SelectItem>
                      <SelectItem value="AIRTEL">Airtel Money</SelectItem>
                      <SelectItem value="MTN">M-Pesa / MTN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Montant (CDF)</Label>
                  <Input type="number" placeholder="Ex: 50000" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Numéro de téléphone</Label>
                  <Input placeholder="Ex: 08..." value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handlePayment} disabled={initiatePayment.isPending}>
                  {initiatePayment.isPending ? "En cours..." : "Payer"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
