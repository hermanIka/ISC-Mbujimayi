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
import { CreditCard, Plus, Receipt } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

async function downloadApiPdf(url: string, filename: string): Promise<void> {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export default function PaymentsPage() {
  const { t } = useTranslation();
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
  const [operator, setOperator] = useState<InitiatePaymentBodyOperator>("MTN_MONEY");
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
    return t(`payments.status.${status.toLowerCase()}` as Parameters<typeof t>[0]) as string || status;
  };

  const handlePayment = async () => {
    if (!amount || !phoneNumber) {
      toast({ title: t("common.error"), description: t("payments.fill_fields"), variant: "destructive" });
      return;
    }
    if (!currentUser?.id) {
      toast({ title: t("common.error"), description: t("payments.user_not_found"), variant: "destructive" });
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
      toast({ title: t("payments.initiated"), description: t("payments.confirm_phone") });
      setIsOpen(false);
      setAmount("");
      setPhoneNumber("");
      queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
    } catch {
      toast({ title: t("common.error"), description: t("payments.initiate_error"), variant: "destructive" });
    }
  };

  const handleDownloadReceipt = async (payment: Payment) => {
    try {
      await downloadApiPdf(
        `/api/payments/${payment.id}/receipt`,
        `recu-${payment.reference || payment.id}.pdf`
      );
      toast({ title: t("payments.download_receipt") });
    } catch {
      toast({ title: t("common.error"), description: t("payments.initiate_error"), variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("payments.title")}</h1>
            <p className="text-muted-foreground">{t("payments.subtitle")}</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-initiate-payment">
                <Plus className="mr-2 h-4 w-4" /> {t("payments.make_payment")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("payments.new_payment")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{t("payments.fee_type")}</Label>
                  <Select value={type} onValueChange={(v) => setType(v as InitiatePaymentBodyType)}>
                    <SelectTrigger data-testid="select-payment-type">
                      <SelectValue placeholder={t("payments.select_type")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSCRIPTION_FEE">{t("payments.type_inscription")}</SelectItem>
                      <SelectItem value="COURSE_FEE">{t("payments.type_course")}</SelectItem>
                      <SelectItem value="EXAM_FEE">{t("payments.type_exam")}</SelectItem>
                      <SelectItem value="OTHER">{t("payments.type_other")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("payments.operator")}</Label>
                  <Select value={operator} onValueChange={(v) => setOperator(v as InitiatePaymentBodyOperator)}>
                    <SelectTrigger data-testid="select-payment-operator">
                      <SelectValue placeholder={t("payments.select_operator")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MTN_MONEY">MTN Mobile Money</SelectItem>
                      <SelectItem value="AIRTEL_MONEY">Airtel Money</SelectItem>
                      <SelectItem value="ORANGE_MONEY">Orange Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("payments.amount_cdf")}</Label>
                  <Input
                    type="number"
                    placeholder={t("payments.amount_placeholder")}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    data-testid="input-payment-amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("payments.phone_number")}</Label>
                  <Input
                    placeholder={t("payments.phone_placeholder")}
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
                  {initiatePayment.isPending ? t("payments.processing") : t("payments.pay")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("payments.history")}</CardTitle>
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
                <p>{t("payments.no_transactions")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("payments.col_reference")}</TableHead>
                    <TableHead>{t("payments.col_type")}</TableHead>
                    <TableHead>{t("payments.col_operator")}</TableHead>
                    <TableHead>{t("payments.col_amount")}</TableHead>
                    <TableHead>{t("payments.col_status")}</TableHead>
                    <TableHead>{t("payments.col_receipt")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.payments.map((payment: Payment) => (
                    <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                      <TableCell className="font-mono text-xs">{payment.reference || "N/A"}</TableCell>
                      <TableCell>{t(`payments.type_${payment.type.toLowerCase().replace(/_fee$/, "")}` as Parameters<typeof t>[0]) as string || payment.type}</TableCell>
                      <TableCell>{payment.operator}</TableCell>
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
                      <TableCell>
                        {payment.status === "CONFIRMED" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("payments.download_receipt")}
                            onClick={() => handleDownloadReceipt(payment)}
                          >
                            <Receipt className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
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
