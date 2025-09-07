import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import RecipeCard from "@/components/recipe-card";
import PortionCalculator from "@/components/portion-calculator";
import CostCalculator from "@/components/cost-calculator";
import UnitConverter from "@/components/unit-converter";
import YieldCalculator from "@/components/yield-calculator";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChartLine, BookOpen, Sprout, DollarSign, TriangleAlert, Search, Filter, ChevronRight, Clock } from "lucide-react";
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

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const recentRecipes = recipes.slice(0, 3);
  const featuredRecipes = recipes.slice(0, 4);

  const formatCostPerServing = (recipe: RecipeWithDetails) => {
    const totalCost = recipe.recipeIngredients.reduce((sum, ri) => {
      return sum + (Number(ri.ingredient.costPerUnit) * Number(ri.quantity));
    }, 0);
    return `$${(totalCost / recipe.servings).toFixed(2)}/serving`;
  };

  const getAlertSeverity = (ingredient: IngredientWithStock) => {
    if (ingredient.stockStatus === "expired") return "red";
    if (ingredient.stockStatus === "low") return "orange";
    return "yellow";
  };

  const getAlertMessage = (ingredient: IngredientWithStock) => {
    if (ingredient.stockStatus === "expired") return "Expired";
    if (ingredient.stockStatus === "low") return "Below minimum threshold";
    return "Low stock";
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <Header title="Dashboard" subtitle="Welcome back! Here's what's happening in your kitchen." />
        
        <div className="p-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card data-testid="stat-total-recipes">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Recipes</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.totalRecipes || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="text-primary text-xl" />
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  <span className="mr-1">↗</span>
                  12% from last month
                </p>
              </CardContent>
            </Card>

            <Card data-testid="stat-active-ingredients">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Ingredients</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.activeIngredients || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Sprout className="text-secondary text-xl" />
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  <span className="mr-1">↗</span>
                  8% from last month
                </p>
              </CardContent>
            </Card>

            <Card data-testid="stat-cost-savings">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Monthly Cost Savings</p>
                    <p className="text-2xl font-bold text-foreground">$2,340</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="text-green-600 text-xl" />
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  <span className="mr-1">↗</span>
                  15% improvement
                </p>
              </CardContent>
            </Card>

            <Card data-testid="stat-low-stock">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.lowStockItems || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <TriangleAlert className="text-red-600 text-xl" />
                  </div>
                </div>
                <p className="text-xs text-red-600 mt-2">
                  <span className="mr-1">↓</span>
                  Requires attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Calculator */}
            <Card data-testid="quick-calculator">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Portion Calculator</h3>
                <PortionCalculator />
              </CardContent>
            </Card>

            {/* Recent Recipes */}
            <Card data-testid="recent-recipes">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Recent Recipes</h3>
                <div className="space-y-3">
                  {recentRecipes.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No recipes found</p>
                  ) : (
                    recentRecipes.map((recipe) => (
                      <div key={recipe.id} className="flex items-center justify-between p-3 bg-muted rounded-md hover:bg-accent transition-colors cursor-pointer" data-testid={`recent-recipe-${recipe.id}`}>
                        <div>
                          <p className="font-medium text-foreground">{recipe.name}</p>
                          <p className="text-sm text-muted-foreground">Updated recently</p>
                        </div>
                        <ChevronRight className="text-muted-foreground" size={16} />
                      </div>
                    ))
                  )}
                </div>
                <Button variant="ghost" className="w-full mt-4 text-primary font-medium">
                  View All Recipes
                </Button>
              </CardContent>
            </Card>

            {/* Inventory Alerts */}
            <Card data-testid="inventory-alerts">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Inventory Alerts</h3>
                <div className="space-y-3">
                  {lowStockIngredients.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No inventory alerts</p>
                  ) : (
                    lowStockIngredients.slice(0, 3).map((ingredient) => {
                      const severity = getAlertSeverity(ingredient);
                      const message = getAlertMessage(ingredient);
                      
                      return (
                        <div key={ingredient.id} className={`flex items-center justify-between p-3 border rounded-md ${
                          severity === "red" ? "bg-red-50 border-red-200" :
                          severity === "orange" ? "bg-orange-50 border-orange-200" :
                          "bg-yellow-50 border-yellow-200"
                        }`} data-testid={`alert-${ingredient.id}`}>
                          <div>
                            <p className={`font-medium ${
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
                            <Clock className={`${
                              severity === "red" ? "text-red-600" :
                              severity === "orange" ? "text-orange-600" :
                              "text-yellow-600"
                            }`} size={16} />
                          ) : (
                            <TriangleAlert className={`${
                              severity === "red" ? "text-red-600" :
                              severity === "orange" ? "text-orange-600" :
                              "text-yellow-600"
                            }`} size={16} />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <Button variant="ghost" className="w-full mt-4 text-primary font-medium">
                  Manage Inventory
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recipe Management Interface */}
          <Card data-testid="recipe-library">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Recipe Library</h3>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input 
                      className="pl-10 pr-4 py-2" 
                      placeholder="Search recipes..." 
                      data-testid="input-search-recipes"
                    />
                  </div>
                  <Select data-testid="select-category-filter">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button data-testid="button-filter-recipes">
                    <Filter size={16} className="mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </div>

            {/* Recipe Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {featuredRecipes.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">No recipes found</p>
                  </div>
                ) : (
                  featuredRecipes.map((recipe) => (
                    <RecipeCard 
                      key={recipe.id} 
                      recipe={recipe}
                      costPerServing={formatCostPerServing(recipe)}
                    />
                  ))
                )}
              </div>

              {featuredRecipes.length > 0 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {featuredRecipes.length} of {recipes.length} recipes
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" data-testid="button-previous-page">
                      Previous
                    </Button>
                    <Button variant="default" size="sm" data-testid="button-page-1">
                      1
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-page-2">
                      2
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-page-3">
                      3
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-next-page">
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Advanced Calculator Section */}
          <Card data-testid="advanced-calculators">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Advanced Calculation Tools</h3>
              <p className="text-sm text-muted-foreground mt-1">Professional tools for recipe scaling, costing, and nutrition analysis</p>
            </div>
            
            <div className="p-6">
              <div className="calculator-grid">
                <PortionCalculator />
                <CostCalculator />
                <UnitConverter />
                <YieldCalculator />
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
