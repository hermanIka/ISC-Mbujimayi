import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Home() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground max-w-3xl mb-6">
          L'Excellence Académique à l'Ère du Numérique
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-8">
          Bienvenue sur la plateforme digitale de l'Institut Supérieur de Commerce Mbujimayi. 
          Gérez votre parcours, accédez à vos cours et effectuez vos paiements en toute simplicité.
        </p>
        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/courses">Explorer les programmes</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/sign-up">S'inscrire maintenant</Link>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
