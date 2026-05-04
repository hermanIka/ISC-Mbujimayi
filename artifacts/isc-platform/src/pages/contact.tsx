import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock, Facebook, Twitter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ContactPage() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const contactInfo = [
    {
      icon: MapPin,
      label: t("contact.address_label"),
      lines: [t("contact.address_line1"), t("contact.address_line2"), t("contact.address_line3")],
    },
    {
      icon: Phone,
      label: t("contact.phone_label"),
      lines: ["+243 99 000 0000", "+243 81 000 0000"],
    },
    {
      icon: Mail,
      label: t("contact.email_label"),
      lines: ["info@isc-mbujimayi.ac.cd", "scolarite@isc-mbujimayi.ac.cd"],
    },
    {
      icon: Clock,
      label: t("contact.hours_label"),
      lines: [t("contact.hours_weekdays"), t("contact.hours_saturday")],
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !messageText) {
      toast({ title: t("common.error"), description: t("contact.fill_required"), variant: "destructive" });
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    toast({ title: t("contact.success"), description: t("contact.success_desc") });
    setName("");
    setEmail("");
    setSubject("");
    setMessageText("");
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <section className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">{t("contact.title")}</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">{t("contact.subtitle")}</p>
        </section>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{t("contact.contact_info_title")}</h2>
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
              <p className="font-medium text-sm">{t("contact.follow_us")}</p>
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
              <CardTitle>{t("contact.send_message")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("contact.name")} *</Label>
                  <Input
                    id="name"
                    placeholder={t("contact.name_placeholder")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-testid="input-contact-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("contact.email")} *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("contact.email_placeholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-contact-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">{t("contact.subject")}</Label>
                  <Input
                    id="subject"
                    placeholder={t("contact.subject_placeholder")}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t("contact.message")} *</Label>
                  <Textarea
                    id="message"
                    placeholder={t("contact.message_placeholder")}
                    className="min-h-[100px]"
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
                  {sending ? t("contact.sending") : t("contact.send")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t("contact.location_title")}</h2>
          <div className="rounded-xl overflow-hidden border shadow-sm">
            <iframe
              title="ISC Mbujimayi — Google Maps"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63047.83!2d23.5900!3d-6.1400!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19d9f1000000001%3A0x1!2sMbujimayi%2C+Democratic+Republic+of+the+Congo!5e0!3m2!1sfr!2scd!4v1"
              width="100%"
              height="320"
              style={{ border: 0, display: "block" }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {t("contact.map_credit")} <a href="https://maps.google.com" className="underline" target="_blank" rel="noopener noreferrer">Google Maps</a>
          </p>
        </section>
      </div>
    </AppLayout>
  );
}
