import { lazy, Suspense, useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "@/pages/home";
import DashboardRouter from "@/pages/dashboard/index";
import NotFound from "@/pages/not-found";

const StudentDashboard = lazy(() => import("@/pages/dashboard/student"));
const TeacherDashboard = lazy(() => import("@/pages/dashboard/teacher"));
const AcademicDashboard = lazy(() => import("@/pages/dashboard/academic"));
const FinancialDashboard = lazy(() => import("@/pages/dashboard/financial"));
const AdminDashboard = lazy(() => import("@/pages/dashboard/admin"));
const DirectorDashboard = lazy(() => import("@/pages/dashboard/director"));
const CoursesIndex = lazy(() => import("@/pages/courses/index"));
const CourseDetail = lazy(() => import("@/pages/courses/detail"));
const CourseLearn = lazy(() => import("@/pages/courses/learn"));
const CourseForum = lazy(() => import("@/pages/courses/forum"));
const EvaluationsList = lazy(() => import("@/pages/evaluations/list"));
const EvaluationTake = lazy(() => import("@/pages/evaluations/take"));
const InscriptionsIndex = lazy(() => import("@/pages/inscriptions/index"));
const InscriptionDetail = lazy(() => import("@/pages/inscriptions/detail"));
const PaymentsIndex = lazy(() => import("@/pages/payments/index"));
const CertificatesIndex = lazy(() => import("@/pages/certificates/index"));
const CertificateVerify = lazy(() => import("@/pages/certificates/verify"));
const ProfileIndex = lazy(() => import("@/pages/profile/index"));
const AdminUsers = lazy(() => import("@/pages/admin/users"));
const AdminFilieres = lazy(() => import("@/pages/admin/filieres"));
const AdminTeachers = lazy(() => import("@/pages/admin/teachers"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/images/logo-isc.jpg`,
  },
  variables: {
    colorPrimary: "hsl(215 61% 27%)",
    colorForeground: "hsl(215 55% 13%)",
    colorMutedForeground: "hsl(215 25% 48%)",
    colorDanger: "hsl(0 72% 51%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(214 24% 87%)",
    colorInputForeground: "hsl(215 55% 13%)",
    colorNeutral: "hsl(214 24% 87%)",
    fontFamily: "'Source Sans 3', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#0f2240] font-semibold",
    headerSubtitle: "text-[#516b8c]",
    formButtonPrimary: "bg-[#1a3c6e] hover:bg-[#0f2240]",
    formFieldInput: "bg-[#eef1f6] border-[#c5d0e0]",
    footerActionLink: "text-[#1a3c6e]",
    footerAction: "bg-[#f5f7fa]",
    logoImage: "h-12 object-contain",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        client.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);

  return null;
}

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route path="/dashboard" component={DashboardRouter} />
              <Route path="/dashboard/student" component={StudentDashboard} />
              <Route path="/dashboard/teacher" component={TeacherDashboard} />
              <Route path="/dashboard/academic" component={AcademicDashboard} />
              <Route path="/dashboard/financial" component={FinancialDashboard} />
              <Route path="/dashboard/admin" component={AdminDashboard} />
              <Route path="/dashboard/director" component={DirectorDashboard} />
              <Route path="/courses" component={CoursesIndex} />
              <Route path="/courses/:id/learn" component={CourseLearn} />
              <Route path="/courses/:id/forum" component={CourseForum} />
              <Route path="/courses/:id/evaluations" component={EvaluationsList} />
              <Route path="/courses/:id" component={CourseDetail} />
              <Route path="/evaluations/:id" component={EvaluationTake} />
              <Route path="/inscriptions/:id" component={InscriptionDetail} />
              <Route path="/inscriptions" component={InscriptionsIndex} />
              <Route path="/payments" component={PaymentsIndex} />
              <Route path="/certificates/verify/:hash" component={CertificateVerify} />
              <Route path="/certificates/verify" component={CertificateVerify} />
              <Route path="/certificates" component={CertificatesIndex} />
              <Route path="/profile" component={ProfileIndex} />
              <Route path="/admin/users" component={AdminUsers} />
              <Route path="/admin/filieres" component={AdminFilieres} />
              <Route path="/admin/teachers" component={AdminTeachers} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
