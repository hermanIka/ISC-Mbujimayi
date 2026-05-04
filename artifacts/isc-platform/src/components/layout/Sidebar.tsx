import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BookOpen, GraduationCap, LayoutDashboard, Settings, Users, CreditCard, FileText, CheckSquare, BarChart } from "lucide-react";
import { useGetCurrentUser } from "@workspace/api-client-react";

export function Sidebar() {
  const [location] = useLocation();
  const { data: user } = useGetCurrentUser();
  const role = user?.role || "VISITOR";

  const getLinks = () => {
    const base = [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    ];

    if (role === "STUDENT") {
      return [
        ...base,
        { href: "/dashboard/student", label: "Mon espace", icon: GraduationCap },
        { href: "/courses", label: "Cours", icon: BookOpen },
        { href: "/inscriptions", label: "Inscriptions", icon: FileText },
        { href: "/payments", label: "Paiements", icon: CreditCard },
        { href: "/certificates", label: "Certificats", icon: CheckSquare },
      ];
    }
    
    if (role === "TEACHER") {
       return [
        ...base,
        { href: "/dashboard/teacher", label: "Espace Enseignant", icon: BookOpen },
      ];
    }
    
    if (role === "ADMIN") {
      return [
        ...base,
        { href: "/admin/users", label: "Utilisateurs", icon: Users },
        { href: "/admin/filieres", label: "Filières", icon: GraduationCap },
        { href: "/admin/teachers", label: "Enseignants", icon: BookOpen },
      ];
    }

    return base;
  };

  const links = getLinks();

  return (
    <aside className="hidden w-64 flex-col border-r bg-sidebar md:flex">
      <div className="flex h-full flex-col gap-2 p-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              location === link.href ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
