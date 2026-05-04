import { useTranslation } from "react-i18next";
import { Link } from "@/lib/router";
import { GraduationCap, Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-card text-card-foreground mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img
                src={`${basePath}/images/logo-isc.png`}
                alt="ISC Mbujimayi"
                className="h-10 w-10 object-contain"
              />
              <div>
                <p className="font-bold text-primary leading-tight">{t("nav.brand")}</p>
                <p className="text-xs text-muted-foreground">Mbujimayi, RDC</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("footer.tagline")}
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              {t("footer.nav_title")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.home")}</Link></li>
              <li><Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.about")}</Link></li>
              <li><Link href="/programs" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.programs")}</Link></li>
              <li><Link href="/courses" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.courses")}</Link></li>
              <li><Link href="/news" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.news")}</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.contact")}</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              {t("footer.programs_title")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">{t("footer.program_compta")}</li>
              <li className="text-muted-foreground">{t("footer.program_mktg")}</li>
              <li className="text-muted-foreground">{t("footer.program_info")}</li>
              <li className="text-muted-foreground">{t("footer.program_grh")}</li>
              <li className="text-muted-foreground">{t("footer.program_fisc")}</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              {t("footer.contact_title")}
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                <span>Avenue Bakwa Dianga, Mbujimayi, Kasaï-Oriental, RDC</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
                <span>+243 99 000 0000</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0 text-primary" />
                <span>info@isc-mbujimayi.ac.cd</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-muted-foreground">
          <p>{t("footer.copyright", { year })}</p>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-foreground transition-colors">{t("footer.about_link")}</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">{t("footer.contact_link")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
