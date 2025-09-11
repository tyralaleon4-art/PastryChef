import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import RecipeCard from "@/components/recipe-card";
import AddRecipeDialog from "@/components/add-recipe-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Plus, Utensils, Calculator, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { RecipeWithDetails } from "@shared/schema";

export default function Recipes() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dietaryFilters, setDietaryFilters] = useState({
    vegan: false,
    glutenFree: false,
    lactoseFree: false,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recipes = [], isLoading } = useQuery<RecipeWithDetails[]>({
    queryKey: ["/api/recipes"],
    enabled: true,
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const deleteRecipe = useMutation({
    mutationFn: async (recipeId: string) => {
      const response = await apiRequest("DELETE", `/api/recipes/${recipeId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Recipe deleted",
        description: "Recipe has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete recipe. Please try again.",
        variant: "destructive",
      });
    },
  });


  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = !search || 
      recipe.name.toLowerCase().includes(search.toLowerCase()) ||
      (recipe.description && recipe.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = !categoryFilter || categoryFilter === "all" || recipe.categoryId === categoryFilter;
    const matchesDietary = 
      (!dietaryFilters.vegan || recipe.isVegan) &&
      (!dietaryFilters.glutenFree || recipe.isGlutenFree) &&
      (!dietaryFilters.lactoseFree || recipe.isLactoseFree);
    return matchesSearch && matchesCategory && matchesDietary;
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <Header 
          title="Recipe Library" 
          subtitle="Manage and organize your complete recipe collection"
          action={
            <AddRecipeDialog 
              trigger={
                <Button data-testid="button-add-recipe">
                  <Plus size={16} className="mr-2" />
                  New Recipe
                </Button>
              }
            />
          }
        />
        
        <div className="p-6">
          {/* Search and Filter */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex items-center space-x-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input 
                  className="pl-10" 
                  placeholder="Search recipes..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-recipes"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter} data-testid="select-category-filter">
                <SelectTrigger className="w-48">
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
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="vegan-filter" 
                    checked={dietaryFilters.vegan}
                    onCheckedChange={(checked) => setDietaryFilters(prev => ({...prev, vegan: checked === true}))}
                    data-testid="checkbox-filter-vegan"
                  />
                  <label htmlFor="vegan-filter" className="text-sm font-medium cursor-pointer">
                    Vegan
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="gluten-free-filter" 
                    checked={dietaryFilters.glutenFree}
                    onCheckedChange={(checked) => setDietaryFilters(prev => ({...prev, glutenFree: checked === true}))}
                    data-testid="checkbox-filter-gluten-free"
                  />
                  <label htmlFor="gluten-free-filter" className="text-sm font-medium cursor-pointer">
                    Gluten Free
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="lactose-free-filter" 
                    checked={dietaryFilters.lactoseFree}
                    onCheckedChange={(checked) => setDietaryFilters(prev => ({...prev, lactoseFree: checked === true}))}
                    data-testid="checkbox-filter-lactose-free"
                  />
                  <label htmlFor="lactose-free-filter" className="text-sm font-medium cursor-pointer">
                    Lactose Free
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Recipe Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-muted rounded"></div>
              ))}
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-12">
              <Utensils className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">No recipes found</p>
              <p className="text-muted-foreground text-sm mt-2">
                {search || categoryFilter ? "Try adjusting your search or filter criteria" : "Start by creating your first recipe"}
              </p>
              <AddRecipeDialog 
                trigger={
                  <Button className="mt-4" data-testid="button-create-first-recipe">
                    <Plus size={16} className="mr-2" />
                    Create Recipe
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipe Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Ingredients</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Dietary</TableHead>
                      <TableHead>Allergens</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecipes.map((recipe) => {
                      const totalCost = recipe.recipeIngredients.reduce((sum, ri) => {
                        return sum + (Number(ri.ingredient.costPerUnit) * Number(ri.quantity));
                      }, 0);

                      return (
                        <TableRow key={recipe.id} data-testid={`recipe-row-${recipe.id}`}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Utensils size={16} className="mr-2 text-primary" />
                              <div>
                                <div className="font-semibold">{recipe.name}</div>
                                {recipe.description && (
                                  <div className="text-xs text-muted-foreground mt-1 max-w-48 truncate">
                                    {recipe.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {recipe.category ? (
                              <Badge variant="secondary" className="text-xs">{recipe.category.name}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="font-medium">{recipe.recipeIngredients.length}</span>
                              <span className="text-muted-foreground"> ingredients</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calculator size={14} className="mr-1 text-primary" />
                              <span className="font-bold text-primary">{totalCost.toFixed(2)} PLN</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {recipe.isVegan && <Badge variant="outline" className="text-xs text-green-600">Vegan</Badge>}
                              {recipe.isGlutenFree && <Badge variant="outline" className="text-xs text-blue-600">GF</Badge>}
                              {recipe.isLactoseFree && <Badge variant="outline" className="text-xs text-purple-600">LF</Badge>}
                              {!recipe.isVegan && !recipe.isGlutenFree && !recipe.isLactoseFree && (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {recipe.allergens && recipe.allergens.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-40">
                                {recipe.allergens.slice(0, 3).map((allergen) => (
                                  <Badge key={allergen} variant="destructive" className="text-xs">
                                    {allergen}
                                  </Badge>
                                ))}
                                {recipe.allergens.length > 3 && (
                                  <Badge variant="destructive" className="text-xs">
                                    +{recipe.allergens.length - 3}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">None</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <AddRecipeDialog
                                recipe={recipe}
                                mode="edit"
                                trigger={
                                  <Button size="sm" variant="outline" data-testid={`button-edit-recipe-${recipe.id}`}>
                                    <Edit size={14} />
                                  </Button>
                                }
                              />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" data-testid={`button-delete-recipe-${recipe.id}`}>
                                    <Trash2 size={14} />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{recipe.name}"? This action cannot be undone and will permanently remove all recipe data including ingredients and instructions.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteRecipe.mutate(recipe.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {deleteRecipe.isPending ? "Deleting..." : "Delete"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>

              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredRecipes.length} of {recipes.length} recipes
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
            </>
          )}
        </div>
      </main>
    </div>
  );
}
