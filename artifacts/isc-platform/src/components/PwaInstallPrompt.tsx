import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

declare global {
  interface Window {
    __pwaInstallEvent: Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
    } | null;
  }
}

const VISIT_COUNT_KEY = "isc_pwa_visit_count";
const DISMISSED_KEY = "isc_pwa_prompt_dismissed";
const VISITS_REQUIRED = 3;

export function PwaInstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<Window["__pwaInstallEvent"]>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const count = Number(localStorage.getItem(VISIT_COUNT_KEY) ?? 0) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(count));

    if (count < VISITS_REQUIRED) {
      return;
    }

    if (window.__pwaInstallEvent) {
      setDeferredPrompt(window.__pwaInstallEvent);
      setShowPrompt(true);
      return;
    }

    const handleInstallReady = (e: Event) => {
      e.preventDefault();
      window.__pwaInstallEvent = e as Window["__pwaInstallEvent"];
      setDeferredPrompt(e as Window["__pwaInstallEvent"]);
      setShowPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handleInstallReady);
    return () => window.removeEventListener("beforeinstallprompt", handleInstallReady);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(DISMISSED_KEY, "1");
      setShowPrompt(false);
    }
    window.__pwaInstallEvent = null;
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <Card className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-80 shadow-xl z-50 border-primary/20">
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Download className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm">{t("pwa.install_title")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("pwa.install_desc")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={handleInstall}>
            {t("pwa.install")}
          </Button>
          <Button size="sm" variant="outline" onClick={handleDismiss}>
            {t("pwa.dismiss")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
