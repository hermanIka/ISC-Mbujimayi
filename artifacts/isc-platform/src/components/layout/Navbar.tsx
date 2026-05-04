import { Link } from "@/lib/router";
import { Show, useClerk, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";

export function Navbar() {
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { data: dbUser } = useGetCurrentUser({ query: { enabled: !!clerkUser, queryKey: getGetCurrentUserQueryKey() } });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/logo-isc.jpg" alt="ISC Mbujimayi" className="h-8 w-auto rounded" />
          <span className="hidden font-bold sm:inline-block">ISC Mbujimayi</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/courses" className="text-sm font-medium transition-colors hover:text-primary">
            Catalogue
          </Link>
          <Link href="/programs" className="hidden md:inline text-sm font-medium transition-colors hover:text-primary">
            Filières
          </Link>
          <Link href="/about" className="hidden md:inline text-sm font-medium transition-colors hover:text-primary">
            À propos
          </Link>
          <Link href="/contact" className="hidden md:inline text-sm font-medium transition-colors hover:text-primary">
            Contact
          </Link>
          <Show when="signed-out">
            <Link href="/sign-in" className="text-sm font-medium transition-colors hover:text-primary">
              Connexion
            </Link>
            <Button asChild>
              <Link href="/sign-up">S'inscrire</Link>
            </Button>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
              Tableau de bord
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
