import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import RecipeCard from "@/components/recipe-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Sprout, TriangleAlert, ChevronRight, Clock, Package, Factory } from "lucide-react";
import type { RecipeWithDetails, IngredientWithStock } from "@shared/schema";

export default function Dashboard() {
  const { data: stats } = useQuery<{
    totalRecipes: number;
    activeIngredients: number;
    lowStockItems: number;
    totalCategories: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const { data: recipes = [] } = useQuery<RecipeWithDetails[]>({
    queryKey: ["/api/recipes"],
  });

  const { data: lowStockIngredients = [] } = useQuery<IngredientWithStock[]>({
    queryKey: ["/api/inventory/low-stock"],
  });

  const recentRecipes = recipes.slice(0, 3);
  const featuredRecipes = recipes.slice(0, 4);

  const getAlertSeverity = (ingredient: IngredientWithStock) => {
    if (ingredient.stockStatus === "expired") return "red";
    if (ingredient.stockStatus === "low") return "orange";
    return "yellow";
  };

  const getAlertMessage = (ingredient: IngredientWithStock) => {
    if (ingredient.stockStatus === "expired") return "Termin ważności minął";
    if (ingredient.stockStatus === "low") return "Poniżej minimum";
    return "Niski stan";
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <Header title="Dashboard" subtitle="Witaj! Oto co dzieje się w Twojej kuchni." />

        <div className="p-4 md:p-6 space-y-5">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            <Card data-testid="stat-total-recipes">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Przepisy</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.totalRecipes || 0}</p>
                  </div>
                  <div className="w-9 h-9 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="text-primary" size={18} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="stat-active-ingredients">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Składniki</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.activeIngredients || 0}</p>
                  </div>
                  <div className="w-9 h-9 md:w-12 md:h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Sprout className="text-secondary" size={18} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="stat-low-stock">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Niski stan</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.lowStockItems || 0}</p>
                  </div>
                  <div className="w-9 h-9 md:w-12 md:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <TriangleAlert className="text-red-600" size={18} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="stat-categories">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Kategorie</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.totalCategories || 0}</p>
                  </div>
                  <div className="w-9 h-9 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="text-blue-600" size={18} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent + Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Recent Recipes */}
            <Card data-testid="recent-recipes">
              <CardContent className="p-4 md:p-6">
                <h3 className="text-base font-semibold text-foreground mb-3">Ostatnie przepisy</h3>
                <div className="space-y-2">
                  {recentRecipes.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Brak przepisów — dodaj swój pierwszy!</p>
                  ) : (
                    recentRecipes.map((recipe) => (
                      <Link key={recipe.id} href="/recipes">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-md hover:bg-accent transition-colors cursor-pointer" data-testid={`recent-recipe-${recipe.id}`}>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{recipe.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {recipe.category?.name || "Bez kategorii"}
                              {recipe.servings ? ` · ${recipe.servings} porcji` : ""}
                            </p>
                          </div>
                          <ChevronRight className="text-muted-foreground flex-shrink-0 ml-2" size={16} />
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                <Link href="/recipes">
                  <Button variant="ghost" className="w-full mt-3 text-primary font-medium text-sm">
                    Zobacz wszystkie przepisy
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Inventory Alerts */}
            <Card data-testid="inventory-alerts">
              <CardContent className="p-4 md:p-6">
                <h3 className="text-base font-semibold text-foreground mb-3">Alerty magazynowe</h3>
                <div className="space-y-2">
                  {lowStockIngredients.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Wszystkie stany magazynowe są w normie</p>
                  ) : (
                    lowStockIngredients.slice(0, 4).map((ingredient) => {
                      const severity = getAlertSeverity(ingredient);
                      const message = getAlertMessage(ingredient);
                      return (
                        <div
                          key={ingredient.id}
                          className={`flex items-center justify-between p-3 border rounded-md ${
                            severity === "red" ? "bg-red-50 border-red-200" :
                            severity === "orange" ? "bg-orange-50 border-orange-200" :
                            "bg-yellow-50 border-yellow-200"
                          }`}
                          data-testid={`alert-${ingredient.id}`}
                        >
                          <div className="min-w-0">
                            <p className={`font-medium truncate ${
                              severity === "red" ? "text-red-900" :
                              severity === "orange" ? "text-orange-900" :
                              "text-yellow-900"
                            }`}>{ingredient.name}</p>
                            <p className={`text-sm ${
                              severity === "red" ? "text-red-600" :
                              severity === "orange" ? "text-orange-600" :
                              "text-yellow-600"
                            }`}>{message}</p>
                          </div>
                          {ingredient.stockStatus === "expired" ? (
                            <Clock className={`flex-shrink-0 ml-2 ${
                              severity === "red" ? "text-red-600" : "text-orange-600"
                            }`} size={16} />
                          ) : (
                            <TriangleAlert className={`flex-shrink-0 ml-2 ${
                              severity === "orange" ? "text-orange-600" : "text-yellow-600"
                            }`} size={16} />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <Link href="/inventory">
                  <Button variant="ghost" className="w-full mt-3 text-primary font-medium text-sm">
                    Zarządzaj magazynem
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Featured Recipes */}
          {featuredRecipes.length > 0 && (
            <Card data-testid="recipe-library">
              <div className="p-4 md:p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">Biblioteka przepisów</h3>
                  <Link href="/recipes">
                    <Button variant="ghost" size="sm" className="text-primary text-sm">
                      Zobacz wszystkie
                      <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {featuredRecipes.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Quick links for mobile */}
          <div className="md:hidden grid grid-cols-2 gap-3">
            <Link href="/calculator">
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="text-primary" size={16} />
                  </div>
                  <span className="text-sm font-medium">Kalkulator</span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/production">
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Factory className="text-secondary" size={16} />
                  </div>
                  <span className="text-sm font-medium">Produkcja</span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
