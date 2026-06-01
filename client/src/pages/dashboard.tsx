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

      <main className="flex-1 overflow-y-auto pb-16 md:pb-0 bg-background">
        <Header title="Pulpit" subtitle="Witaj! Oto co dzieje się w Twojej kuchni." />

        <div className="p-4 md:p-6 space-y-5">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">

            <Card className="bg-white border-border shadow-sm overflow-hidden" data-testid="stat-total-recipes">
              <div className="h-1 bg-primary" />
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Przepisy</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stats?.totalRecipes ?? "—"}</p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <BookOpen className="text-primary" size={18} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-border shadow-sm overflow-hidden" data-testid="stat-active-ingredients">
              <div className="h-1 bg-secondary" />
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Składniki</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stats?.activeIngredients ?? "—"}</p>
                  </div>
                  <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                    <Sprout className="text-secondary" size={18} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-border shadow-sm overflow-hidden" data-testid="stat-low-stock">
              <div className="h-1 bg-red-400" />
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Niski stan</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stats?.lowStockItems ?? "—"}</p>
                  </div>
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                    <TriangleAlert className="text-red-500" size={18} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-border shadow-sm overflow-hidden" data-testid="stat-categories">
              <div className="h-1 bg-blue-400" />
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Kategorie</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stats?.totalCategories ?? "—"}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Package className="text-blue-500" size={18} />
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Recent + Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            <Card className="bg-white border-border shadow-sm" data-testid="recent-recipes">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Ostatnie przepisy</h3>
                <Link href="/recipes">
                  <Button variant="ghost" size="sm" className="text-secondary hover:text-secondary/80 text-xs gap-1 h-7 px-2">
                    Wszystkie <ChevronRight size={13} />
                  </Button>
                </Link>
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {recentRecipes.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-2">Brak przepisów — dodaj swój pierwszy!</p>
                  ) : (
                    recentRecipes.map((recipe) => (
                      <Link key={recipe.id} href="/recipes">
                        <div className="flex items-center justify-between p-3 bg-muted/60 rounded-lg hover:bg-accent transition-colors cursor-pointer" data-testid={`recent-recipe-${recipe.id}`}>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{recipe.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {recipe.category?.name || "Bez kategorii"}
                              {recipe.servings ? ` · ${recipe.servings} porcji` : ""}
                            </p>
                          </div>
                          <ChevronRight className="text-muted-foreground flex-shrink-0 ml-2" size={15} />
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-border shadow-sm" data-testid="inventory-alerts">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Alerty magazynowe</h3>
                <Link href="/inventory">
                  <Button variant="ghost" size="sm" className="text-secondary hover:text-secondary/80 text-xs gap-1 h-7 px-2">
                    Magazyn <ChevronRight size={13} />
                  </Button>
                </Link>
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {lowStockIngredients.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-2">Wszystkie stany magazynowe są w normie</p>
                  ) : (
                    lowStockIngredients.slice(0, 4).map((ingredient) => {
                      const severity = getAlertSeverity(ingredient);
                      const message = getAlertMessage(ingredient);
                      return (
                        <div
                          key={ingredient.id}
                          className={`flex items-center justify-between p-3 border rounded-lg ${
                            severity === "red" ? "bg-red-50 border-red-200" :
                            severity === "orange" ? "bg-orange-50 border-orange-200" :
                            "bg-yellow-50 border-yellow-200"
                          }`}
                          data-testid={`alert-${ingredient.id}`}
                        >
                          <div className="min-w-0">
                            <p className={`font-medium text-sm truncate ${
                              severity === "red" ? "text-red-900" :
                              severity === "orange" ? "text-orange-900" :
                              "text-yellow-900"
                            }`}>{ingredient.name}</p>
                            <p className={`text-xs mt-0.5 ${
                              severity === "red" ? "text-red-600" :
                              severity === "orange" ? "text-orange-600" :
                              "text-yellow-600"
                            }`}>{message}</p>
                          </div>
                          {ingredient.stockStatus === "expired" ? (
                            <Clock className="flex-shrink-0 ml-2 text-red-500" size={15} />
                          ) : (
                            <TriangleAlert className="flex-shrink-0 ml-2 text-orange-500" size={15} />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Featured Recipes */}
          {featuredRecipes.length > 0 && (
            <Card className="bg-white border-border shadow-sm" data-testid="recipe-library">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Biblioteka przepisów</h3>
                <Link href="/recipes">
                  <Button variant="ghost" size="sm" className="text-secondary hover:text-secondary/80 text-xs gap-1 h-7 px-2">
                    Wszystkie <ChevronRight size={13} />
                  </Button>
                </Link>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {featuredRecipes.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Quick links — only mobile */}
          <div className="md:hidden grid grid-cols-2 gap-3">
            <Link href="/calculator">
              <Card className="bg-white hover:bg-accent border-border shadow-sm transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="text-primary" size={16} />
                  </div>
                  <span className="text-sm font-medium">Kalkulator</span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/production-plan">
              <Card className="bg-white hover:bg-accent border-border shadow-sm transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Factory className="text-secondary" size={16} />
                  </div>
                  <span className="text-sm font-medium">Plan produkcji</span>
                </CardContent>
              </Card>
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
