import { Switch, Route } from "wouter";
import { Component, ReactNode } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Dashboard from "@/pages/dashboard";
import Recipes from "@/pages/recipes";
import Ingredients from "@/pages/ingredients";
import Calculator from "@/pages/calculator";
import ProductionPlan from "@/pages/production-plan";
import Inventory from "@/pages/inventory";
import Reports from "@/pages/reports";
import AIChat from "@/pages/ai-chat";
import Login from "@/pages/login";
import Admin from "@/pages/admin";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/layout/bottom-nav";
import { I18nProvider } from "@/i18n";

// ─── Error Boundary ────────────────────────────────────────────────────────────
interface EBState { error: Error | null }
class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      const isEnglish = document.documentElement.lang === "en";
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <AlertTriangle className="mx-auto text-destructive" size={48} />
            <h1 className="text-xl font-bold">{isEnglish ? "Something went wrong" : "Coś poszło nie tak"}</h1>
            <p className="text-muted-foreground text-sm">
              {isEnglish
                ? "If this is the first installation, run the database migration in the application shell:"
                : "Jeśli to pierwsza instalacja, uruchom migrację bazy danych w konsoli aplikacji:"}
            </p>
            <pre className="bg-muted rounded p-3 text-left text-xs overflow-auto">
              npx tsx server/migrate.ts
            </pre>
            <p className="text-xs text-muted-foreground font-mono break-all">
              {this.state.error.message}
            </p>
            <Button onClick={() => window.location.reload()} className="gap-2">
              <RefreshCw size={16} />
              {isEnglish ? "Refresh page" : "Odśwież stronę"}
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Protected Router ──────────────────────────────────────────────────────────
function ProtectedRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/recipes" component={Recipes} />
        <Route path="/ingredients" component={Ingredients} />
        <Route path="/calculator" component={Calculator} />
        <Route path="/production-plan" component={ProductionPlan} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/reports" component={Reports} />
        <Route path="/ai-chat" component={AIChat} />
        <Route path="/admin" component={Admin} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ErrorBoundary>
            <AuthProvider>
              <I18nProvider>
                <Toaster />
                <ProtectedRouter />
              </I18nProvider>
            </AuthProvider>
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
