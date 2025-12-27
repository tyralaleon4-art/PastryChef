import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Recipes from "@/pages/recipes";
import Ingredients from "@/pages/ingredients";
import Calculator from "@/pages/calculator";
import Production from "@/pages/production";
import ProductionPlan from "@/pages/production-plan";
import Inventory from "@/pages/inventory";
import Reports from "@/pages/reports";
import AIChat from "@/pages/ai-chat";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/recipes" component={Recipes} />
      <Route path="/ingredients" component={Ingredients} />
      <Route path="/calculator" component={Calculator} />
      <Route path="/production" component={Production} />
      <Route path="/production-plan" component={ProductionPlan} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/reports" component={Reports} />
      <Route path="/ai-chat" component={AIChat} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
