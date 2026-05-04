import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineBanner() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showRestored) return null;

  return (
    <div
      data-testid="offline-banner"
      className={`fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
        isOnline
          ? "bg-green-600 text-white"
          : "bg-destructive text-destructive-foreground"
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          {t("offline.restored")}
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          {t("offline.message")}
        </>
      )}
    </div>
  );
}
