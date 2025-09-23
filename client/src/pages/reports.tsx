import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Archive, 
  TrendingUp, 
  Users, 
  ChefHat, 
  Package, 
  ChartBar,
  RotateCcw 
} from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import type { ProductionPlanWithDetails } from "@shared/schema";

interface ProductionStats {
  totalPlans: number;
  activePlans: number;
  archivedPlans: number;
  totalRecipes: number;
  totalIngredients: number;
  mostUsedRecipes: Array<{
    recipeName: string;
    count: number;
  }>;
  mostUsedIngredients: Array<{
    ingredientName: string;
    count: number;
  }>;
}

export default function Reports() {
  // Fetch archived production plans
  const { data: archivedPlans = [] } = useQuery<ProductionPlanWithDetails[]>({
    queryKey: ["/api/production-plans-archived"],
  });

  // Fetch all production plans for statistics
  const { data: allPlans = [] } = useQuery<ProductionPlanWithDetails[]>({
    queryKey: ["/api/production-plans"],
    queryFn: () => fetch("/api/production-plans?includeArchived=true").then(res => res.json()),
  });

  // Calculate statistics
  const stats: ProductionStats = {
    totalPlans: allPlans.length,
    activePlans: allPlans.filter(p => !p.archived).length,
    archivedPlans: allPlans.filter(p => p.archived).length,
    totalRecipes: new Set(allPlans.flatMap(p => p.productionPlanRecipes.map(r => r.recipeId))).size,
    totalIngredients: new Set(allPlans.flatMap(p => 
      p.productionPlanRecipes.flatMap(r => 
        r.recipe.recipeIngredients.map(ri => ri.ingredientId)
      )
    )).size,
    mostUsedRecipes: [],
    mostUsedIngredients: []
  };

  // Calculate most used recipes
  const recipeCount = new Map<string, { name: string; count: number }>();
  allPlans.forEach(plan => {
    plan.productionPlanRecipes.forEach(pr => {
      const key = pr.recipeId;
      const existing = recipeCount.get(key);
      if (existing) {
        existing.count++;
      } else {
        recipeCount.set(key, { name: pr.recipe.name, count: 1 });
      }
    });
  });
  stats.mostUsedRecipes = Array.from(recipeCount.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(item => ({ recipeName: item.name, count: item.count }));

  // Calculate most used ingredients
  const ingredientCount = new Map<string, { name: string; count: number }>();
  allPlans.forEach(plan => {
    plan.productionPlanRecipes.forEach(pr => {
      pr.recipe.recipeIngredients.forEach(ri => {
        const key = ri.ingredientId;
        const existing = ingredientCount.get(key);
        if (existing) {
          existing.count++;
        } else {
          ingredientCount.set(key, { name: ri.ingredient.name, count: 1 });
        }
      });
    });
  });
  stats.mostUsedIngredients = Array.from(ingredientCount.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(item => ({ ingredientName: item.name, count: item.count }));

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Reports" />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground" data-testid="reports-title">
                  Raporty i statystyki
                </h1>
                <p className="text-muted-foreground mt-1">
                  Przegląd statystyk produkcji i zarchiwizowanych planów
                </p>
              </div>
            </div>

            <Tabs defaultValue="statistics" className="space-y-6">
              <TabsList>
                <TabsTrigger value="statistics" className="flex items-center space-x-2">
                  <ChartBar className="w-4 h-4" />
                  <span>Statystyki</span>
                </TabsTrigger>
                <TabsTrigger value="archived" className="flex items-center space-x-2">
                  <Archive className="w-4 h-4" />
                  <span>Archiwum planów ({archivedPlans.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="statistics" className="space-y-6">
                {/* Statistics Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Łącznie planów</CardTitle>
                      <BarChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-total-plans">
                        {stats.totalPlans}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Aktywne: {stats.activePlans} | Zarchiwizowane: {stats.archivedPlans}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Unikalne przepisy</CardTitle>
                      <ChefHat className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-total-recipes">
                        {stats.totalRecipes}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Użyte w planach produkcji
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Unikalne składniki</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-total-ingredients">
                        {stats.totalIngredients}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Użyte w przepisach
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Współczynnik aktywności</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-activity-rate">
                        {stats.totalPlans > 0 ? Math.round((stats.activePlans / stats.totalPlans) * 100) : 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Aktywne plany vs wszystkie
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Most Used Items */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <ChefHat className="mr-2" size={20} />
                        Najczęściej używane przepisy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.mostUsedRecipes.length > 0 ? (
                          stats.mostUsedRecipes.map((recipe, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="font-medium">{recipe.recipeName}</span>
                              <Badge variant="secondary">{recipe.count}x</Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Brak danych</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Package className="mr-2" size={20} />
                        Najczęściej używane składniki
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.mostUsedIngredients.length > 0 ? (
                          stats.mostUsedIngredients.map((ingredient, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="font-medium">{ingredient.ingredientName}</span>
                              <Badge variant="secondary">{ingredient.count}x</Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Brak danych</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="archived" className="space-y-6">
                {/* Archived Plans */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Archive className="mr-2" size={20} />
                      Zarchiwizowane plany produkcji
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {archivedPlans.length > 0 ? (
                      <div className="space-y-4">
                        {archivedPlans.map((plan) => (
                          <div key={plan.id} className="border rounded-lg p-4" data-testid={`archived-plan-${plan.id}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-lg">{plan.name}</h4>
                                {plan.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                                )}
                                <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                                  <span>Przepisy: {plan.productionPlanRecipes.length}</span>
                                  <span>
                                    Ukończone: {plan.productionPlanRecipes.filter(r => r.completed).length}
                                  </span>
                                  <Badge variant="outline">
                                    {plan.status}
                                  </Badge>
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                // TODO: Add unarchive functionality
                                data-testid={`button-unarchive-${plan.id}`}
                              >
                                <RotateCcw className="mr-2" size={16} />
                                Przywróć
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Archive className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">Brak zarchiwizowanych planów</h3>
                        <p className="text-sm text-muted-foreground">
                          Zarchiwizowane plany będą tutaj wyświetlane
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}