import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setDemoUserId } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCog, ChevronDown, GraduationCap, BookOpen, ShieldCheck, Building2, DollarSign } from "lucide-react";

const DEMO_STORAGE_KEY = "isc_demo_user_id";

const PERSONAS = [
  {
    id: "TAJ9Co9G7OJMeqJ__HqTu",
    name: "Admin ISC",
    role: "ADMIN",
    dashboard: "/dashboard/admin",
    icon: ShieldCheck,
    color: "bg-purple-100 text-purple-800 border-purple-300",
  },
  {
    id: "YUhhorT1Me88bSslbb0WN",
    name: "Prosper Ngandu",
    role: "DIRECTEUR",
    dashboard: "/dashboard/director",
    icon: Building2,
    color: "bg-indigo-100 text-indigo-800 border-indigo-300",
  },
  {
    id: "81wNqA1NPpGlq8mNOF489",
    name: "Prof. Patrick Mukendi",
    role: "ENSEIGNANT",
    dashboard: "/dashboard/teacher",
    icon: BookOpen,
    color: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    id: "XEztQik9XXOUSBg6RDwwE",
    name: "Emmanuel Kalenga",
    role: "ÉTUDIANT",
    dashboard: "/dashboard/student",
    icon: GraduationCap,
    color: "bg-green-100 text-green-800 border-green-300",
  },
  {
    id: "Z1CUfQYRm7bsbFMbxWeDW",
    name: "André Mutombo",
    role: "APPARITEUR",
    dashboard: "/dashboard/academic",
    icon: Building2,
    color: "bg-orange-100 text-orange-800 border-orange-300",
  },
  {
    id: "EYcsZ40QWhgK41jdvuPmZ",
    name: "Marie Kabwe",
    role: "FINANCES",
    dashboard: "/dashboard/financial",
    icon: DollarSign,
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
];

export function DemoPersonaSwitcher() {
  const [currentId, setCurrentId] = useState<string>(() => {
    return localStorage.getItem(DEMO_STORAGE_KEY) ?? PERSONAS[0].id;
  });
  const navigate = useNavigate();

  const switchTo = (persona: typeof PERSONAS[0]) => {
    localStorage.setItem(DEMO_STORAGE_KEY, persona.id);
    setDemoUserId(persona.id);
    setCurrentId(persona.id);
    navigate(persona.dashboard);
  };

  const current = PERSONAS.find((p) => p.id === currentId) ?? PERSONAS[0];
  const Icon = current.icon;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-auto py-2 px-3 shadow-lg border-2 bg-white gap-2 hover:bg-gray-50"
            data-testid="demo-persona-switcher"
          >
            <UserCog className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Badge variant="outline" className={`text-xs px-1.5 py-0 ${current.color}`}>
              <Icon className="h-3 w-3 mr-1" />
              {current.name}
            </Badge>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-60 mb-1">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Changer de persona — mode démo
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {PERSONAS.map((p) => {
            const PIcon = p.icon;
            const isActive = p.id === currentId;
            return (
              <DropdownMenuItem
                key={p.id}
                className={`cursor-pointer mx-1 rounded-md mb-0.5 ${isActive ? "bg-muted" : ""}`}
                onClick={() => switchTo(p)}
              >
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs px-1.5 py-0 shrink-0 ${p.color}`}>
                      <PIcon className="h-3 w-3 mr-1" />
                      {p.role}
                    </Badge>
                    <span className="text-sm">{p.name}</span>
                  </div>
                  {isActive && <span className="text-xs text-muted-foreground">✓</span>}
                </div>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <div className="px-2 py-1">
            <p className="text-xs text-muted-foreground text-center">🎓 ISC Mbujimayi — Démo</p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
