import { AppLayout } from "@/components/layout/AppLayout";
import {
  useListPayments,
  useInitiatePayment,
  useGetCurrentUser,
  getListPaymentsQueryKey,
  getGetCurrentUserQueryKey,
} from "@workspace/api-client-react";
import type { Payment, InitiatePaymentBodyType, InitiatePaymentBodyOperator } from "@workspace/api-client-react";
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
import { useQueryClient } from "@tanstack/react-query";

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  INSCRIPTION_FEE: "Frais d'inscription",
  COURSE_FEE: "Minerval",
  EXAM_FEE: "Frais d'examens",
  OTHER: "Autre",
};

const PAYMENT_OPERATOR_LABELS: Record<string, string> = {
  ORANGE_MONEY: "Orange Money",
  AIRTEL_MONEY: "Airtel Money",
  MPESA: "M-Pesa",
};

export default function PaymentsPage() {
  const { data, isLoading } = useListPayments();
  const { data: currentUser } = useGetCurrentUser({
    query: { queryKey: getGetCurrentUserQueryKey() },
  });
  const initiatePayment = useInitiatePayment();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<InitiatePaymentBodyType>("INSCRIPTION_FEE");
  const [operator, setOperator] = useState<InitiatePaymentBodyOperator>("ORANGE_MONEY");
  const [phoneNumber, setPhoneNumber] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED": return "bg-green-500/10 text-green-700 border-green-200";
      case "FAILED": return "bg-red-500/10 text-red-700 border-red-200";
      case "CANCELLED": return "bg-gray-500/10 text-gray-700 border-gray-200";
      default: return "bg-yellow-500/10 text-yellow-700 border-yellow-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "CONFIRMED": return "Confirmé";
      case "FAILED": return "Échoué";
      case "CANCELLED": return "Annulé";
      case "PENDING": return "En attente";
      default: return "Initié";
    }
  };

  const handlePayment = async () => {
    if (!amount || !phoneNumber) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }
    if (!currentUser?.id) {
      toast({ title: "Erreur", description: "Profil utilisateur introuvable", variant: "destructive" });
      return;
    }

    try {
      await initiatePayment.mutateAsync({
        data: {
          studentId: currentUser.id,
          amount,
          type,
          operator,
          phoneNumber,
        },
      });
      toast({ title: "Paiement initié", description: "Veuillez confirmer sur votre téléphone." });
      setIsOpen(false);
      setAmount("");
      setPhoneNumber("");
      queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
    } catch {
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
              <Button data-testid="button-initiate-payment">
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
                  <Select value={type} onValueChange={(v) => setType(v as InitiatePaymentBodyType)}>
                    <SelectTrigger data-testid="select-payment-type">
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSCRIPTION_FEE">Frais d'inscription</SelectItem>
                      <SelectItem value="COURSE_FEE">Minerval</SelectItem>
                      <SelectItem value="EXAM_FEE">Frais d'examens</SelectItem>
                      <SelectItem value="OTHER">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Opérateur</Label>
                  <Select value={operator} onValueChange={(v) => setOperator(v as InitiatePaymentBodyOperator)}>
                    <SelectTrigger data-testid="select-payment-operator">
                      <SelectValue placeholder="Sélectionner l'opérateur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ORANGE_MONEY">Orange Money</SelectItem>
                      <SelectItem value="AIRTEL_MONEY">Airtel Money</SelectItem>
                      <SelectItem value="MPESA">M-Pesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Montant (CDF)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 50000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    data-testid="input-payment-amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Numéro de téléphone</Label>
                  <Input
                    placeholder="Ex: 08..."
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    data-testid="input-payment-phone"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handlePayment}
                  disabled={initiatePayment.isPending}
                  data-testid="button-submit-payment"
                >
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
                  {data.payments.map((payment: Payment) => (
                    <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                      <TableCell className="font-mono text-xs">{payment.reference || "N/A"}</TableCell>
                      <TableCell>{PAYMENT_TYPE_LABELS[payment.type] ?? payment.type}</TableCell>
                      <TableCell>{PAYMENT_OPERATOR_LABELS[payment.operator] ?? payment.operator}</TableCell>
                      <TableCell className="font-medium">
                        {Number(payment.amount).toLocaleString("fr-CD")} {payment.currency}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusColor(payment.status)}
                          variant="outline"
                          data-testid={`status-payment-${payment.id}`}
                        >
                          {getStatusLabel(payment.status)}
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
