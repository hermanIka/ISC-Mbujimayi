import { useEffect } from "react";
import { useLocation } from "@/lib/router";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardRouter() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useGetCurrentUser();

  useEffect(() => {
    if (!isLoading && user) {
      switch (user.role) {
        case "STUDENT":
          setLocation("/dashboard/student");
          break;
        case "TEACHER":
          setLocation("/dashboard/teacher");
          break;
        case "ADMIN":
          setLocation("/dashboard/admin");
          break;
        case "ACADEMIC_SERVICE":
          setLocation("/dashboard/academic");
          break;
        case "FINANCIAL_SERVICE":
          setLocation("/dashboard/financial");
          break;
        case "DIRECTOR":
          setLocation("/dashboard/director");
          break;
        default:
          setLocation("/");
      }
    }
  }, [user, isLoading, setLocation]);

  return (
    <AppLayout>
      <div className="p-8">
        <Skeleton className="h-8 w-[200px] mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    </AppLayout>
  );
}
