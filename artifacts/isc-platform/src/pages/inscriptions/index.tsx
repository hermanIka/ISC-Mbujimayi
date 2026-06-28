import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useListInscriptions,
  useListFilieres,
  useCreateInscription,
  getListInscriptionsQueryKey,
} from "@workspace/api-client-react";
import type { Inscription, Filiere } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileText, Plus, Check, ChevronRight, Upload, Loader2, CheckCircle2, XCircle, Smartphone, GraduationCap, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const STEPS = ["personal", "filiere", "documents", "review", "payment"] as const;
type Step = typeof STEPS[number];

type MobileOperator = "MTN_MONEY" | "AIRTEL_MONEY" | "ORANGE_MONEY";
type PaymentStatus = "idle" | "processing" | "success" | "failed";

interface DocEntry {
  type: "NATIONAL_ID" | "DIPLOMA" | "PHOTO" | "OTHER";
  label: string;
  file: File | null;
  required?: boolean;
}

const OPERATORS: { value: MobileOperator; label: string; color: string; prefix: string }[] = [
  { value: "MTN_MONEY", label: "Vodacom Mobile Money", color: "bg-red-600 text-white border-red-700", prefix: "VOD" },
  { value: "AIRTEL_MONEY", label: "Airtel Money", color: "bg-red-500", prefix: "AIR" },
  { value: "ORANGE_MONEY", label: "Orange Money", color: "bg-orange-500", prefix: "ORA" },
];

const INSCRIPTION_FEE_CDF = 15000;

function simulateMobileMoneyDelay(operator: MobileOperator): number {
  const ranges: Record<MobileOperator, [number, number]> = {
    MTN_MONEY: [2000, 4000],
    AIRTEL_MONEY: [2000, 3500],
    ORANGE_MONEY: [2500, 4000],
  };
  const [min, max] = ranges[operator];
  return min + Math.random() * (max - min);
}

function generateOperatorRef(operator: MobileOperator): string {
  const prefix = OPERATORS.find((o) => o.value === operator)?.prefix ?? "PAY";
  return `${prefix}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

export default function InscriptionsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useListInscriptions();
  const { data: filieresRaw } = useListFilieres();
  const filieres: Filiere[] = Array.isArray(filieresRaw) ? filieresRaw : [];
  const createInscription = useCreateInscription();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [filiereId, setFiliereId] = useState("");

  const getInitialDocs = (): DocEntry[] => [
    { type: "NATIONAL_ID", label: "Carte nationale d'identité", file: null, required: true },
    { type: "DIPLOMA", label: "Diplôme d'État (6ème)", file: null, required: true },
    { type: "PHOTO", label: "Photo d'identité (4x4)", file: null, required: true },
    { type: "OTHER", label: "Attestation d'aptitude physique", file: null },
    { type: "OTHER", label: "Attestation de bonne vie et mœurs", file: null },
    { type: "OTHER", label: "Bulletin de la 5ème année", file: null },
    { type: "OTHER", label: "Bulletin de la 6ème année", file: null },
  ];

  const [docs, setDocs] = useState<DocEntry[]>(getInitialDocs());

  const [operator, setOperator] = useState<MobileOperator>("MTN_MONEY");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [operatorRef, setOperatorRef] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-green-500/10 text-green-700 hover:bg-green-500/20";
      case "REJECTED": return "bg-red-500/10 text-red-700 hover:bg-red-500/20";
      case "UNDER_REVIEW": return "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20";
      default: return "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20";
    }
  };

  const getStatusText = (status: string): string => {
    return t(`inscriptions.status.${status}` as Parameters<typeof t>[0]) as string || status;
  };

  const resetForm = () => {
    setCurrentStep(0);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setFiliereId("");
    setDocs(getInitialDocs());
    setOperator("MTN_MONEY");
    setPaymentPhone("");
    setPaymentStatus("idle");
    setOperatorRef(null);
    setSubmittedRef(null);
    setShowConfirmation(false);
  };

  const handleFileChange = (index: number, file: File | null) => {
    setDocs((prev) => prev.map((d, i) => (i === index ? { ...d, file } : d)));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return firstName.trim() && lastName.trim() && email.trim();
      case 1: return !!filiereId;
      case 2: return true;
      case 3: return true;
      case 4: return paymentStatus === "idle" && paymentPhone.trim().length >= 9;
      default: return false;
    }
  };

  const handlePayment = async () => {
    if (!paymentPhone.trim()) return;
    setPaymentStatus("processing");

    const delay = simulateMobileMoneyDelay(operator);
    const willSucceed = Math.random() < 0.9;

    await new Promise((resolve) => setTimeout(resolve, delay));

    if (willSucceed) {
      const ref = generateOperatorRef(operator);
      setOperatorRef(ref);
      setPaymentStatus("success");
      setTimeout(() => handleSubmitInscription(ref), 1500);
    } else {
      setPaymentStatus("failed");
    }
  };

  const handleSubmitInscription = async (ref: string) => {
    try {
      const result = await createInscription.mutateAsync({
        data: {
          filiereId,
          studentId: "auto",
          documents: docs.filter((d) => d.file).map((d) => ({
            type: d.type,
            url: `upload://${d.file?.name ?? "file"}`,
            name: d.file?.name ?? d.label,
            uploadedAt: new Date().toISOString(),
          })),
          // @ts-expect-error — extra fields forwarded to backend for payment creation
          paymentOperator: operator,
          paymentPhone: paymentPhone,
          paymentOperatorRef: ref,
          paymentAmount: INSCRIPTION_FEE_CDF,
        },
      });
      const paymentRef = (result as { paymentReference?: string }).paymentReference ?? null;
      setSubmittedRef(paymentRef);
      setIsOpen(false);
      setShowConfirmation(true);
      queryClient.invalidateQueries({ queryKey: getListInscriptionsQueryKey() });
    } catch {
      toast({
        title: t("common.error"),
        description: t("inscriptions.submit_error"),
        variant: "destructive",
      });
    }
  };

  const STEP_LABELS: Record<Step, string> = {
    personal: "Informations personnelles",
    filiere: "Choix de la filière",
    documents: "Documents requis",
    review: "Récapitulatif",
    payment: "Paiement Mobile Money",
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-8">

        {/* Écran de confirmation après soumission réussie */}
        {showConfirmation && (
          <div className="border rounded-xl bg-green-50 border-green-200 p-8 flex flex-col items-center text-center space-y-5">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-green-800">Dossier soumis avec succès !</h2>
              <p className="text-green-700 text-sm max-w-lg">
                Votre dossier d'inscription et votre paiement des frais d'inscription ont été enregistrés.
                Le service académique va examiner votre candidature et vous contacterez par email.
              </p>
            </div>
            {submittedRef && (
              <div className="bg-white border border-green-200 rounded-lg px-4 py-2 text-sm">
                <span className="text-muted-foreground">Référence paiement : </span>
                <span className="font-mono font-semibold text-green-700">{submittedRef}</span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link to="/dashboard/academic">
                <Button variant="outline" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Voir le tableau de bord académique
                </Button>
              </Link>
              <Link to="/dashboard/financial">
                <Button variant="outline" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Voir le tableau de bord financier
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => setShowConfirmation(false)}>
                Fermer
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("inscriptions.title")}</h1>
            <p className="text-muted-foreground">{t("inscriptions.subtitle")}</p>
          </div>
          <Button onClick={() => { resetForm(); setIsOpen(true); }} data-testid="button-new-inscription">
            <Plus className="mr-2 h-4 w-4" /> {t("inscriptions.new_inscription")}
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
              <h3 className="text-lg font-medium">{t("inscriptions.no_inscriptions")}</h3>
              <p className="text-muted-foreground mt-1">{t("inscriptions.no_inscriptions_desc")}</p>
              <Button variant="outline" className="mt-4" onClick={() => { resetForm(); setIsOpen(true); }}>
                {t("inscriptions.start_inscription")}
              </Button>
            </div>
          ) : (
            (data?.inscriptions ?? [] as Inscription[]).map((inscription: Inscription) => (
              <Card key={inscription.id}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{t("inscriptions.academic_file")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("inscriptions.submitted_on")} {inscription.createdAt ? format(new Date(inscription.createdAt), "dd/MM/yyyy", { locale: fr }) : "N/A"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(inscription.status)} variant="outline">
                      {getStatusText(inscription.status)}
                    </Badge>
                    <Button variant="ghost" size="sm">{t("inscriptions.details")}</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("inscriptions.new_inscription")}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-0.5 mb-4">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold flex-shrink-0 transition-colors ${
                  i < currentStep ? "bg-green-500 text-white" :
                  i === currentStep ? "bg-primary text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {i < currentStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-0.5 ${i < currentStep ? "bg-green-500" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>

          <p className="text-sm font-semibold text-primary mb-4">{STEP_LABELS[STEPS[currentStep]]}</p>

          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("inscriptions.first_name")} *</Label>
                  <Input placeholder={t("inscriptions.first_name")} value={firstName} onChange={(e) => setFirstName(e.target.value)} data-testid="input-inscription-firstname" />
                </div>
                <div className="space-y-2">
                  <Label>{t("inscriptions.last_name")} *</Label>
                  <Input placeholder={t("inscriptions.last_name_placeholder")} value={lastName} onChange={(e) => setLastName(e.target.value)} data-testid="input-inscription-lastname" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("inscriptions.email")} *</Label>
                <Input type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-inscription-email" />
              </div>
              <div className="space-y-2">
                <Label>{t("inscriptions.phone")}</Label>
                <Input placeholder="+243..." value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("inscriptions.desired_filiere")} *</Label>
                <Select value={filiereId} onValueChange={setFiliereId}>
                  <SelectTrigger data-testid="select-inscription-filiere">
                    <SelectValue placeholder={t("inscriptions.choose_filiere")} />
                  </SelectTrigger>
                  <SelectContent>
                    {filieres.map((f: Filiere) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {filiereId && (
                <div className="p-4 bg-primary/5 rounded-lg text-sm space-y-1">
                  <p className="font-semibold">{filieres.find((f) => f.id === filiereId)?.name}</p>
                  <p className="text-muted-foreground">{t("inscriptions.filiere_duration")}</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t("inscriptions.docs_instruction")}</p>
              {docs.map((doc, index) => (
                <div key={`${doc.type}-${index}`} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      {doc.label}
                      {doc.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {doc.file && <Badge className="bg-green-500/10 text-green-700 text-xs">{t("inscriptions.added")}</Badge>}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm hover:bg-muted/50 transition-colors">
                      <Upload className="h-4 w-4" />
                      {doc.file ? doc.file.name : t("inscriptions.choose_file")}
                    </div>
                    <input
                      type="file"
                      className="sr-only"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(index, e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              ))}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">{t("inscriptions.first_name")} :</span>
                  <span className="font-medium">{firstName}</span>
                  <span className="text-muted-foreground">{t("inscriptions.last_name")} :</span>
                  <span className="font-medium">{lastName}</span>
                  <span className="text-muted-foreground">{t("inscriptions.email")} :</span>
                  <span className="font-medium">{email}</span>
                  {phone && (
                    <>
                      <span className="text-muted-foreground">{t("inscriptions.phone")} :</span>
                      <span className="font-medium">{phone}</span>
                    </>
                  )}
                  <span className="text-muted-foreground">{t("inscriptions.filiere")} :</span>
                  <span className="font-medium">{filieres.find((f) => f.id === filiereId)?.name ?? "—"}</span>
                  <span className="text-muted-foreground">{t("inscriptions.documents")} :</span>
                  <span className="font-medium">{docs.filter((d) => d.file).length}/{docs.length} {t("inscriptions.added_count")}</span>
                </div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <p className="font-semibold mb-1">💳 Frais d'inscription</p>
                <p>L'étape suivante vous demandera de payer les frais d'inscription de <strong>{INSCRIPTION_FEE_CDF.toLocaleString("fr-FR")} CDF</strong> via Mobile Money.</p>
              </div>
              <p className="text-xs text-muted-foreground">{t("inscriptions.review_disclaimer")}</p>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-5">
              {paymentStatus === "idle" && (
                <>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Frais d'inscription</p>
                    <p className="text-3xl font-bold text-primary mt-1">
                      {INSCRIPTION_FEE_CDF.toLocaleString("fr-FR")} <span className="text-lg font-semibold">CDF</span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Choisissez votre opérateur</Label>
                    <RadioGroup value={operator} onValueChange={(v) => setOperator(v as MobileOperator)} className="grid grid-cols-3 gap-2">
                      {OPERATORS.map((op) => (
                        <div key={op.value}>
                          <RadioGroupItem value={op.value} id={op.value} className="sr-only" />
                          <label
                            htmlFor={op.value}
                            className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              operator === op.value ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
                            }`}
                          >
                            <div className={`h-8 w-8 rounded-full ${op.color} flex items-center justify-center`}>
                              <Smartphone className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xs font-medium text-center leading-tight">{op.label}</span>
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Numéro de téléphone Mobile Money *</Label>
                    <Input
                      placeholder="+243 8XX XXX XXX"
                      value={paymentPhone}
                      onChange={(e) => setPaymentPhone(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Entrez le numéro associé à votre compte {OPERATORS.find((o) => o.value === operator)?.label}</p>
                  </div>
                </>
              )}

              {paymentStatus === "processing" && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="relative">
                    <div className={`h-16 w-16 rounded-full ${OPERATORS.find((o) => o.value === operator)?.color} flex items-center justify-center`}>
                      <Smartphone className="h-8 w-8 text-white" />
                    </div>
                    <Loader2 className="h-20 w-20 absolute -top-2 -left-2 animate-spin text-primary opacity-60" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">Traitement en cours...</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Veuillez patienter. Une demande de confirmation a été envoyée au numéro <strong>{paymentPhone}</strong>.
                    </p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
                  </div>
                </div>
              )}

              {paymentStatus === "success" && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                  <div className="text-center">
                    <p className="font-bold text-lg text-green-700">Paiement confirmé !</p>
                    <p className="text-sm text-muted-foreground mt-1">Référence : <strong>{operatorRef}</strong></p>
                    <p className="text-sm text-muted-foreground">Montant : <strong>{INSCRIPTION_FEE_CDF.toLocaleString("fr-FR")} CDF</strong></p>
                    <p className="text-xs text-muted-foreground mt-3">Soumission de votre dossier en cours...</p>
                  </div>
                </div>
              )}

              {paymentStatus === "failed" && (
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <XCircle className="h-14 w-14 text-red-500" />
                  <div className="text-center">
                    <p className="font-bold text-lg text-red-700">Paiement échoué</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      La transaction n'a pas pu être complétée. Vérifiez votre solde ou réessayez.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setPaymentStatus("idle")} className="w-full">
                    Réessayer le paiement
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0 || paymentStatus === "processing" || paymentStatus === "success"}
            >
              {t("common.previous")}
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={!canProceed()}
                data-testid="button-inscription-next"
              >
                {currentStep === 3 ? "Procéder au paiement" : t("common.next")} <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : paymentStatus === "idle" ? (
              <Button
                onClick={handlePayment}
                disabled={!paymentPhone.trim() || paymentPhone.trim().length < 9}
                data-testid="button-inscription-pay"
                className="bg-green-600 hover:bg-green-700"
              >
                <Smartphone className="mr-2 h-4 w-4" />
                Payer {INSCRIPTION_FEE_CDF.toLocaleString("fr-FR")} CDF
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
