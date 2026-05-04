import { useState, useRef } from "react";
import { SignUp } from "@clerk/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, BookOpen, Users, Award,
  ChevronRight, ChevronLeft, Check,
  Upload, FileText, Trash2, Eye
} from "lucide-react";
import { Link } from "@/lib/router";
import { useListFilieres } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const ROLES = [
  { id: "STUDENT", icon: GraduationCap, labelKey: "register.role_student", descKey: "register.role_student_desc" },
  { id: "TEACHER", icon: BookOpen, labelKey: "register.role_teacher", descKey: "register.role_teacher_desc" },
  { id: "STAFF", icon: Users, labelKey: "register.role_staff", descKey: "register.role_staff_desc" },
  { id: "VISITOR", icon: Award, labelKey: "register.role_visitor", descKey: "register.role_visitor_desc" },
];

interface UploadedFile { name: string; size: number; type: string; dataUrl: string }

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RegisterPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedFiliere, setSelectedFiliere] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Record<string, UploadedFile | null>>({
    diplome: null,
    cni: null,
    photo: null,
  });
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [readyForClerk, setReadyForClerk] = useState(false);

  const { data: filieres = [] } = useListFilieres();

  const isStudentRole = selectedRole === "STUDENT";

  const STEPS = isStudentRole
    ? [t("register.step_role"), t("register.step_info"), t("register.step_program"), t("register.step_documents"), t("register.step_review")]
    : [t("register.step_role"), t("register.step_info"), t("register.step_review")];

  const totalSteps = STEPS.length;
  const clerkStep = totalSteps;

  const canAdvanceStep = () => {
    if (step === 0) return !!selectedRole;
    if (step === 1) return firstName.trim().length > 1 && lastName.trim().length > 1;
    if (step === 2 && isStudentRole) return !!selectedFiliere;
    return true;
  };

  const handleFileUpload = async (docKey: string, file: File) => {
    const dataUrl = await readFileAsDataUrl(file);
    setDocuments(prev => ({
      ...prev,
      [docKey]: { name: file.name, size: file.size, type: file.type, dataUrl },
    }));
  };

  const handleProceedToClerk = () => {
    const info = { role: selectedRole, firstName, lastName, phone, filiere: selectedFiliere };
    localStorage.setItem("isc_registration_info", JSON.stringify(info));
    setReadyForClerk(true);
  };

  const progressPct = totalSteps > 1 ? (step / (totalSteps - 1)) * 100 : 0;

  const DOC_FIELDS = [
    { key: "diplome", label: t("register.doc_diplome"), required: true },
    { key: "cni", label: t("register.doc_cni"), required: true },
    { key: "photo", label: t("register.doc_photo"), required: true },
  ];

  if (readyForClerk) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={`${basePath}/images/logo-isc.png`} alt="ISC" className="h-8 w-8 object-contain" />
            <span className="font-bold text-primary">{t("nav.brand")}</span>
          </Link>
          <Badge variant="outline">{t("register.step_account")}</Badge>
        </div>
        <div className="w-full bg-primary h-1.5" />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 space-y-6">
          <div className="text-center space-y-2 max-w-md">
            <h1 className="text-2xl font-bold">{t("register.create_account_title")}</h1>
            <p className="text-muted-foreground text-sm">
              {t("register.create_account_subtitle", { name: firstName })}
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {selectedRole && <Badge>{t(`register.role_${selectedRole.toLowerCase()}`)}</Badge>}
              {selectedFiliere && <Badge variant="outline">{selectedFiliere}</Badge>}
            </div>
          </div>
          <SignUp
            routing="path"
            path={`${basePath}/sign-up`}
            signInUrl={`${basePath}/sign-in`}
            unsafeMetadata={{ role: selectedRole, filiere: selectedFiliere, phone }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src={`${basePath}/images/logo-isc.png`} alt="ISC" className="h-8 w-8 object-contain" />
          <span className="font-bold text-primary">{t("nav.brand")}</span>
        </Link>
        <span className="text-sm text-muted-foreground">
          {t("register.have_account")}{" "}
          <Link href="/sign-in" className="text-primary font-medium hover:underline">
            {t("nav.sign_in")}
          </Link>
        </span>
      </div>

      <div className="w-full bg-muted h-1.5">
        <div className="bg-primary h-1.5 transition-all duration-500" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-8">
          <div className="flex items-center justify-center gap-1 flex-wrap">
            {STEPS.map((stepLabel, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                  idx < step ? "bg-primary border-primary text-primary-foreground"
                    : idx === step ? "border-primary text-primary"
                    : "border-muted-foreground/30 text-muted-foreground/50"
                )}>
                  {idx < step ? <Check className="h-4 w-4" /> : idx + 1}
                </div>
                <span className={cn(
                  "text-xs hidden sm:block mr-1",
                  idx === step ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {stepLabel}
                </span>
                {idx < STEPS.length - 1 && (
                  <div className={cn("w-4 h-px mr-1", idx < step ? "bg-primary" : "bg-muted-foreground/30")} />
                )}
              </div>
            ))}
          </div>

          {step === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("register.choose_role")}</CardTitle>
                <CardDescription>{t("register.choose_role_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {ROLES.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={cn(
                      "text-left p-4 rounded-xl border-2 transition-all hover:border-primary/50",
                      selectedRole === role.id ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center mb-3",
                      selectedRole === role.id ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <role.icon className="h-5 w-5" />
                    </div>
                    <p className="font-semibold">{t(role.labelKey)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t(role.descKey)}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("register.personal_info")}</CardTitle>
                <CardDescription>{t("register.personal_info_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t("register.first_name")}</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t("register.first_name_placeholder")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t("register.last_name")}</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t("register.last_name_placeholder")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("register.phone")}</Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+243 99 000 0000" />
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && isStudentRole && (
            <Card>
              <CardHeader>
                <CardTitle>{t("register.choose_program")}</CardTitle>
                <CardDescription>{t("register.choose_program_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {(filieres.length > 0 ? filieres : [
                  { id: "COMPTA", code: "COMPTA", name: "Comptabilité", duration: 3 },
                  { id: "MKTG", code: "MKTG", name: "Marketing", duration: 3 },
                  { id: "INFO", code: "INFO", name: "Informatique de Gestion", duration: 3 },
                  { id: "GRH", code: "GRH", name: "Gestion des Ressources Humaines", duration: 3 },
                  { id: "FISC", code: "FISC", name: "Fiscalité", duration: 3 },
                ]).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFiliere(f.code)}
                    className={cn(
                      "text-left p-4 rounded-xl border-2 transition-all hover:border-primary/50",
                      selectedFiliere === f.code ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <Badge variant="outline" className="mb-2">{f.code}</Badge>
                    <p className="font-semibold text-sm">{f.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{f.duration} {t("register.years")}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {step === 3 && isStudentRole && (
            <Card>
              <CardHeader>
                <CardTitle>{t("register.upload_docs")}</CardTitle>
                <CardDescription>{t("register.upload_docs_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {DOC_FIELDS.map((doc) => (
                  <div key={doc.key} className="space-y-2">
                    <Label>
                      {doc.label}
                      {doc.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {documents[doc.key] ? (
                      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                        <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{documents[doc.key]!.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(documents[doc.key]!.size)}</p>
                        </div>
                        <div className="flex gap-1">
                          {documents[doc.key]!.type.startsWith("image/") && (
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8"
                              onClick={() => window.open(documents[doc.key]!.dataUrl, "_blank")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDocuments(prev => ({ ...prev, [doc.key]: null }))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                        onClick={() => fileInputRefs.current[doc.key]?.click()}
                      >
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">{t("register.drop_file")}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t("register.file_formats")}</p>
                      </div>
                    )}
                    <input
                      ref={(el) => { fileInputRefs.current[doc.key] = el; }}
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(doc.key, file);
                      }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {((step === 4 && isStudentRole) || (step === 2 && !isStudentRole)) && (
            <Card>
              <CardHeader>
                <CardTitle>{t("register.review_title")}</CardTitle>
                <CardDescription>{t("register.review_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">{t("register.step_role")}</span>
                    <Badge>{selectedRole ? t(`register.role_${selectedRole.toLowerCase()}`) : "-"}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">{t("register.first_name")}</span>
                    <span className="font-medium">{firstName}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">{t("register.last_name")}</span>
                    <span className="font-medium">{lastName}</span>
                  </div>
                  {phone && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">{t("register.phone")}</span>
                      <span className="font-medium">{phone}</span>
                    </div>
                  )}
                  {selectedFiliere && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">{t("register.step_program")}</span>
                      <Badge variant="outline">{selectedFiliere}</Badge>
                    </div>
                  )}
                  {isStudentRole && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">{t("register.step_documents")}</span>
                      <span className="font-medium text-green-600">
                        {Object.values(documents).filter(Boolean).length} / {DOC_FIELDS.length} {t("register.docs_uploaded")}
                      </span>
                    </div>
                  )}
                </div>
                <Button className="w-full" onClick={handleProceedToClerk}>
                  {t("register.create_account")}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          )}

          {((step === 4 && isStudentRole) || (step === 2 && !isStudentRole)) ? null : (
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t("register.back")}
              </Button>
              <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvanceStep()}>
                {t("register.next")}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {((step === 4 && isStudentRole) || (step === 2 && !isStudentRole)) && (
            <div className="flex justify-start">
              <Button variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t("register.back")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
