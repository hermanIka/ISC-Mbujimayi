import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useListInscriptions,
  useListFilieres,
  useCreateInscription,
  getListInscriptionsQueryKey,
} from "@workspace/api-client-react";
import type { Inscription, Filiere } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Check, ChevronRight, Upload } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const STEPS = ["personal", "filiere", "documents", "review"] as const;
type Step = typeof STEPS[number];

interface DocEntry {
  type: "NATIONAL_ID" | "DIPLOMA" | "PHOTO" | "OTHER";
  label: string;
  file: File | null;
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

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [filiereId, setFiliereId] = useState("");
  const [docs, setDocs] = useState<DocEntry[]>([
    { type: "NATIONAL_ID", label: t("inscriptions.doc_national_id"), file: null },
    { type: "DIPLOMA", label: t("inscriptions.doc_diploma"), file: null },
    { type: "PHOTO", label: t("inscriptions.doc_photo"), file: null },
  ]);

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
    setDocs(docs.map((d) => ({ ...d, file: null })));
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
      default: return false;
    }
  };

  const handleSubmit = async () => {
    try {
      await createInscription.mutateAsync({
        data: {
          filiereId,
          studentId: "auto",
          documents: docs.filter((d) => d.file).map((d) => ({
            type: d.type,
            url: `upload://${d.file?.name ?? "file"}`,
            name: d.file?.name ?? d.label,
            uploadedAt: new Date().toISOString(),
          })),
        },
      });
      toast({ title: t("inscriptions.submitted"), description: t("inscriptions.submitted_desc") });
      setIsOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: getListInscriptionsQueryKey() });
    } catch {
      toast({ title: t("common.error"), description: t("inscriptions.submit_error"), variant: "destructive" });
    }
  };

  const stepLabels = STEPS.map((s) => t(`inscriptions.steps.${s}` as Parameters<typeof t>[0]) as string);

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-8">
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("inscriptions.new_inscription")}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-1 mb-6">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold flex-shrink-0 transition-colors ${i < currentStep ? "bg-green-500 text-white" : i === currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {i < currentStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 ${i < currentStep ? "bg-green-500" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>

          <p className="text-sm font-medium text-muted-foreground mb-4">{stepLabels[currentStep]}</p>

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
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("inscriptions.docs_instruction")}</p>
              {docs.map((doc, index) => (
                <div key={doc.type} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{doc.label}</Label>
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
                      data-testid={`input-doc-${doc.type.toLowerCase()}`}
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
                  <span className="text-muted-foreground">{t("inscriptions.first_name")} :</span><span className="font-medium">{firstName}</span>
                  <span className="text-muted-foreground">{t("inscriptions.last_name")} :</span><span className="font-medium">{lastName}</span>
                  <span className="text-muted-foreground">{t("inscriptions.email")} :</span><span className="font-medium">{email}</span>
                  {phone && <><span className="text-muted-foreground">{t("inscriptions.phone")} :</span><span className="font-medium">{phone}</span></>}
                  <span className="text-muted-foreground">{t("inscriptions.filiere")} :</span>
                  <span className="font-medium">{filieres.find((f) => f.id === filiereId)?.name ?? "—"}</span>
                  <span className="text-muted-foreground">{t("inscriptions.documents")} :</span>
                  <span className="font-medium">{docs.filter((d) => d.file).length}/{docs.length} {t("inscriptions.added_count")}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t("inscriptions.review_disclaimer")}</p>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
            >
              {t("common.previous")}
            </Button>
            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={!canProceed()}
                data-testid="button-inscription-next"
              >
                {t("common.next")} <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={createInscription.isPending}
                data-testid="button-inscription-submit"
              >
                {createInscription.isPending ? t("inscriptions.sending") : t("common.submit")}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
