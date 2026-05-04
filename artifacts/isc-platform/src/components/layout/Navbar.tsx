import { Link } from "@/lib/router";
import { Show, useClerk, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export function Navbar() {
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { data: dbUser } = useGetCurrentUser({ query: { enabled: !!clerkUser, queryKey: getGetCurrentUserQueryKey() } });
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "fr" ? "en" : "fr");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/logo-isc.jpg" alt="ISC Mbujimayi" className="h-8 w-auto rounded" />
          <span className="hidden font-bold sm:inline-block">ISC Mbujimayi</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/courses" className="hidden sm:inline text-sm font-medium transition-colors hover:text-primary">
            {t("nav.catalogue")}
          </Link>
          <Link href="/programs" className="hidden md:inline text-sm font-medium transition-colors hover:text-primary">
            {t("nav.filieres")}
          </Link>
          <Link href="/news" className="hidden md:inline text-sm font-medium transition-colors hover:text-primary">
            Actualités
          </Link>
          <Link href="/about" className="hidden lg:inline text-sm font-medium transition-colors hover:text-primary">
            {t("nav.about")}
          </Link>
          <Link href="/contact" className="hidden lg:inline text-sm font-medium transition-colors hover:text-primary">
            {t("nav.contact")}
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-1 text-xs font-semibold"
            title={i18n.language === "fr" ? "Switch to English" : "Passer en Français"}
            data-testid="button-language-toggle"
          >
            <Globe className="h-3.5 w-3.5" />
            {i18n.language === "fr" ? "EN" : "FR"}
          </Button>

          <Show when="signed-out">
            <Link href="/sign-in" className="text-sm font-medium transition-colors hover:text-primary">
              {t("nav.login")}
            </Link>
            <Button asChild>
              <Link href="/sign-up">{t("nav.register")}</Link>
            </Button>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard" className="hidden sm:inline text-sm font-medium transition-colors hover:text-primary">
              {t("nav.dashboard")}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={clerkUser?.imageUrl} alt={clerkUser?.fullName || ""} />
                    <AvatarFallback>{clerkUser?.firstName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-2">
                  <p className="text-sm font-medium leading-none">{dbUser?.firstName} {dbUser?.lastName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{dbUser?.email}</p>
                  <p className="text-xs font-semibold text-primary mt-1">{dbUser?.role}</p>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Show>
        </nav>
      </div>
    </header>
  );
}
