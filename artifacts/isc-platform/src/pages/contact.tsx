import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock, Facebook, Twitter } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const contactInfo = [
  {
    icon: MapPin,
    label: "Adresse",
    lines: ["Avenue Bakwa Dianga", "Mbujimayi, Kasaï-Oriental", "République Démocratique du Congo"],
  },
  {
    icon: Phone,
    label: "Téléphone",
    lines: ["+243 99 000 0000", "+243 81 000 0000"],
  },
  {
    icon: Mail,
    label: "Email",
    lines: ["info@isc-mbujimayi.ac.cd", "scolarite@isc-mbujimayi.ac.cd"],
  },
  {
    icon: Clock,
    label: "Horaires",
    lines: ["Lundi – Vendredi : 7h30 – 17h00", "Samedi : 8h00 – 12h00"],
  },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !messageText) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs obligatoires.", variant: "destructive" });
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    toast({ title: "Message envoyé", description: "Nous vous répondrons dans les 48 heures." });
    setName("");
    setEmail("");
    setSubject("");
    setMessageText("");
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <section className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Contactez-nous</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Notre équipe est disponible pour répondre à toutes vos questions sur les admissions,
            les programmes et la vie estudiantine.
          </p>
        </section>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Informations de contact</h2>
            <div className="space-y-4">
              {contactInfo.map((info) => (
                <Card key={info.label}>
                  <CardContent className="pt-6 flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <info.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{info.label}</p>
                      {info.lines.map((line) => (
                        <p key={line} className="text-sm text-muted-foreground">{line}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="pt-2 space-y-2">
              <p className="font-medium text-sm">Suivez-nous</p>
              <div className="flex gap-3">
                <Button variant="outline" size="icon" asChild>
                  <a href="#" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                    <Facebook className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <a href="#" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Envoyer un message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input
                    id="name"
                    placeholder="Votre nom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-testid="input-contact-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-contact-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Sujet</Label>
                  <Input
                    id="subject"
                    placeholder="Objet de votre message"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Décrivez votre demande..."
                    className="min-h-[120px]"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    data-testid="input-contact-message"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={sending}
                  data-testid="button-contact-submit"
                >
                  {sending ? "Envoi en cours..." : "Envoyer le message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <section className="rounded-xl overflow-hidden border h-64 bg-muted flex items-center justify-center">
          <div className="text-center text-muted-foreground space-y-2">
            <MapPin className="h-10 w-10 mx-auto opacity-30" />
            <p className="text-sm">Carte interactive — Mbujimayi, Kasaï-Oriental</p>
            <p className="text-xs opacity-60">Avenue Bakwa Dianga, Mbujimayi</p>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
