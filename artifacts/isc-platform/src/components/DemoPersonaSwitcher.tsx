import { useState, useEffect } from "react";
import { setDemoUserId } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCog, ChevronDown, GraduationCap, BookOpen, ShieldCheck } from "lucide-react";

const DEMO_STORAGE_KEY = "isc_demo_user_id";

const PERSONAS = [
  {
    group: "Administration",
    icon: ShieldCheck,
    color: "bg-purple-100 text-purple-800 border-purple-300",
    users: [
      { id: "TAJ9Co9G7OJMeqJ__HqTu", name: "Admin ISC", label: "Directeur Académique", role: "ADMIN" },
    ],
  },
  {
    group: "Enseignants",
    icon: BookOpen,
    color: "bg-blue-100 text-blue-800 border-blue-300",
    users: [
      { id: "81wNqA1NPpGlq8mNOF489", name: "Prof. Patrick Mukendi", label: "Enseignant", role: "TEACHER" },
      { id: "QjiSCWuw-B_XskiqbIsrD", name: "Prof. Théodore Kazadi", label: "Enseignant", role: "TEACHER" },
      { id: "2GRNG35y3Kbi1JJa7Vogg", name: "Prof. Sylvain Katanga", label: "Enseignant", role: "TEACHER" },
    ],
  },
  {
    group: "Étudiants",
    icon: GraduationCap,
    color: "bg-green-100 text-green-800 border-green-300",
    users: [
      { id: "XEztQik9XXOUSBg6RDwwE", name: "Emmanuel Kalenga", label: "Étudiant", role: "STUDENT" },
      { id: "PEVgAMlq5_5nlnojY-vEN", name: "Thérèse Mbuyi", label: "Étudiante", role: "STUDENT" },
      { id: "ZvbkCm0cByUA56NFdYeMd", name: "Claudine Kaseba", label: "Étudiante", role: "STUDENT" },
    ],
  },
];

const ALL_PERSONAS = PERSONAS.flatMap((g) => g.users);

function getRoleColor(role: string) {
  if (role === "ADMIN") return "bg-purple-100 text-purple-800 border-purple-300";
  if (role === "TEACHER") return "bg-blue-100 text-blue-800 border-blue-300";
  return "bg-green-100 text-green-800 border-green-300";
}

function getRoleIcon(role: string) {
  if (role === "ADMIN") return ShieldCheck;
  if (role === "TEACHER") return BookOpen;
  return GraduationCap;
}

export function DemoPersonaSwitcher() {
  const queryClient = useQueryClient();
  const [currentId, setCurrentId] = useState<string>(() => {
    return localStorage.getItem(DEMO_STORAGE_KEY) ?? "TAJ9Co9G7OJMeqJ__HqTu";
  });

  useEffect(() => {
    setDemoUserId(currentId);
  }, []);

  const switchTo = (userId: string) => {
    localStorage.setItem(DEMO_STORAGE_KEY, userId);
    setDemoUserId(userId);
    setCurrentId(userId);
    queryClient.clear();
    window.location.reload();
  };

  const current = ALL_PERSONAS.find((p) => p.id === currentId) ?? ALL_PERSONAS[0];
  const Icon = getRoleIcon(current.role);

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
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <UserCog className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Persona démo</span>
              </div>
              <Badge variant="outline" className={`text-xs px-1.5 py-0 ${getRoleColor(current.role)}`}>
                <Icon className="h-3 w-3 mr-1" />
                {current.name}
              </Badge>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 mb-1">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Changer de persona pour la démo
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {PERSONAS.map((group) => {
            const GroupIcon = group.icon;
            return (
              <DropdownMenuGroup key={group.group}>
                <DropdownMenuLabel className="text-xs flex items-center gap-1.5 py-1">
                  <GroupIcon className="h-3.5 w-3.5" />
                  {group.group}
                </DropdownMenuLabel>
                {group.users.map((user) => (
                  <DropdownMenuItem
                    key={user.id}
                    className={`cursor-pointer mx-1 rounded-md mb-0.5 ${currentId === user.id ? "bg-muted font-medium" : ""}`}
                    onClick={() => switchTo(user.id)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <p className="text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.label}</p>
                      </div>
                      {currentId === user.id && (
                        <Badge variant="outline" className={`text-xs px-1 py-0 ${group.color}`}>
                          actif
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </DropdownMenuGroup>
            );
          })}
          <div className="px-2 py-1">
            <p className="text-xs text-muted-foreground text-center">
              🎓 Mode démonstration ISC Mbujimayi
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
