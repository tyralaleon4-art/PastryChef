import { useState, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AddRecipeDialog from "@/components/add-recipe-dialog";
import RecipeScaleDialog from "@/components/recipe-scale-dialog";
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
import type { RecipeWithDetails, Category } from "@shared/schema";

const ROW_HEIGHT = 64;
const CARD_HEIGHT = 260;
const OVERSCAN = 5;

function convertToKg(quantity: number, unit: string, ingredient: any): number {
  switch (unit) {
    case 'g': return quantity / 1000;
    case 'kg': return quantity;
    case 'ml': return (quantity * Number(ingredient.densityGPerMl || 1)) / 1000;
    case 'l': return (quantity * 1000 * Number(ingredient.densityGPerMl || 1)) / 1000;
    case 'pcs':
    case 'szt': return (quantity * Number(ingredient.weightPerPieceG || 100)) / 1000;
    default: return quantity;
  }
}

function calcCost(recipe: RecipeWithDetails) {
  const totalCost = recipe.recipeIngredients.reduce((sum, ri) => {
    return sum + Number(ri.ingredient.costPerUnit) * convertToKg(Number(ri.quantity), ri.unit, ri.ingredient);
  }, 0);
  const totalWeightKg = recipe.recipeIngredients.reduce((sum, ri) => {
    return sum + convertToKg(Number(ri.quantity), ri.unit, ri.ingredient);
  }, 0);
  return { totalCost, costPer1Kg: totalWeightKg > 0 ? totalCost / totalWeightKg : 0 };
}

// Virtual scroll hook
function useVirtualScroll(
  totalItems: number,
  itemHeight: number,
  containerHeight: number,
  scrollTop: number
) {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - OVERSCAN);
  const endIndex = Math.min(totalItems - 1, Math.ceil((scrollTop + containerHeight) / itemHeight) + OVERSCAN);
  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push(i);
  }
  return {
    startIndex,
    endIndex,
    visibleItems,
    totalHeight: totalItems * itemHeight,
    offsetY: startIndex * itemHeight,
  };
}

export default function Recipes() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dietaryFilters, setDietaryFilters] = useState({ vegan: false, glutenFree: false, lactoseFree: false });
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recipes = [], isLoading } = useQuery<RecipeWithDetails[]>({ queryKey: ["/api/recipes"] });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const deleteRecipe = useMutation({
    mutationFn: async (recipeId: string) => {
      await apiRequest("DELETE", `/api/recipes/${recipeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Przepis usunięty", description: "Przepis został usunięty." });
    },
    onError: () => {
      toast({ title: "Błąd", description: "Nie udało się usunąć przepisu.", variant: "destructive" });
    },
  });

  const filteredRecipes = useMemo(() => recipes.filter(recipe => {
    const matchesSearch = !search ||
      recipe.name.toLowerCase().includes(search.toLowerCase()) ||
      (recipe.description && recipe.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = !categoryFilter || categoryFilter === "all" || recipe.categoryId === categoryFilter;
    const matchesDietary =
      (!dietaryFilters.vegan || recipe.isVegan) &&
      (!dietaryFilters.glutenFree || recipe.isGlutenFree) &&
      (!dietaryFilters.lactoseFree || recipe.isLactoseFree);
    return matchesSearch && matchesCategory && matchesDietary;
  }), [recipes, search, categoryFilter, dietaryFilters]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const containerCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setContainerHeight(node.clientHeight || 600);
      const ro = new ResizeObserver(entries => {
        setContainerHeight(entries[0]?.contentRect.height || 600);
      });
      ro.observe(node);
    }
  }, []);

  // Mobile virtual scroll
  const mobileVirtual = useVirtualScroll(filteredRecipes.length, CARD_HEIGHT, containerHeight, scrollTop);
  // Desktop virtual scroll
  const desktopVirtual = useVirtualScroll(filteredRecipes.length, ROW_HEIGHT, containerHeight, scrollTop);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <Header
          title="Przepisy"
          subtitle={`Zarządzaj i organizuj przepisy${filteredRecipes.length !== recipes.length ? ` (${filteredRecipes.length} z ${recipes.length})` : ` (${recipes.length})`}`}
          action={
            <AddRecipeDialog
              trigger={
                <Button data-testid="button-add-recipe">
                  <Plus size={16} className="mr-2" />Nowy przepis
                </Button>
              }
            />
          }
        />

        <div className="px-4 md:px-6 py-4 border-b bg-background">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                className="pl-10"
                placeholder="Szukaj przepisów..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                data-testid="input-search-recipes"
                style={{ fontSize: '16px' }}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48" data-testid="select-category-filter">
                <SelectValue placeholder="Wszystkie kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie kategorie</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap items-center gap-4">
              {[
                { id: "vegan", label: "Wegański", key: "vegan" },
                { id: "gluten-free", label: "Bez glutenu", key: "glutenFree" },
                { id: "lactose-free", label: "Bez laktozy", key: "lactoseFree" },
              ].map(({ id, label, key }) => (
                <div key={id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`filter-${id}`}
                    checked={dietaryFilters[key as keyof typeof dietaryFilters]}
                    onCheckedChange={checked => setDietaryFilters(prev => ({ ...prev, [key]: checked === true }))}
                    data-testid={`checkbox-filter-${id}`}
                  />
                  <label htmlFor={`filter-${id}`} className="text-sm font-medium cursor-pointer">{label}</label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable content area */}
        {isLoading ? (
          <div className="flex-1 p-4 md:p-6 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse h-16 bg-muted rounded" />
            ))}
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Utensils className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">Brak przepisów</p>
            <p className="text-muted-foreground text-sm mt-2">
              {search || categoryFilter ? "Spróbuj zmienić wyszukiwanie lub filtr" : "Zacznij od dodania pierwszego przepisu"}
            </p>
            <AddRecipeDialog
              trigger={
                <Button className="mt-4" data-testid="button-create-first-recipe">
                  <Plus size={16} className="mr-2" />Dodaj przepis
                </Button>
              }
            />
          </div>
        ) : (
          <>
            {/* Mobile: Virtual scroll cards */}
            <div
              className="block md:hidden flex-1 overflow-y-auto px-4 py-4"
              onScroll={handleScroll}
              ref={containerCallbackRef}
            >
              <div style={{ height: mobileVirtual.totalHeight, position: "relative" }}>
                <div style={{ transform: `translateY(${mobileVirtual.offsetY}px)` }}>
                  {mobileVirtual.visibleItems.map(index => {
                    const recipe = filteredRecipes[index];
                    const { costPer1Kg } = calcCost(recipe);
                    return (
                      <div key={recipe.id} style={{ height: CARD_HEIGHT, marginBottom: 16 }}>
                        <Card className="p-4 h-full" data-testid={`recipe-card-${recipe.id}`}>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <Utensils size={20} className="text-primary mt-1 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base leading-tight truncate">{recipe.name}</h3>
                                {recipe.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{recipe.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <div className="text-muted-foreground">Kategoria</div>
                                <div className="mt-1">
                                  {recipe.category ? <Badge variant="secondary" className="text-xs">{recipe.category.name}</Badge> : <span className="text-muted-foreground">-</span>}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Koszt/kg</div>
                                <div className="mt-1 font-bold text-primary">{costPer1Kg.toFixed(2)} PLN/kg</div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {recipe.isVegan && <Badge variant="outline" className="text-xs text-green-600">Wegański</Badge>}
                              {recipe.isGlutenFree && <Badge variant="outline" className="text-xs text-blue-600">Bez gl.</Badge>}
                              {recipe.isLactoseFree && <Badge variant="outline" className="text-xs text-purple-600">Bez lak.</Badge>}
                              {recipe.allergens?.slice(0, 2).map(a => <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>)}
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t">
                              <RecipeScaleDialog recipe={recipe} trigger={
                                <Button size="sm" variant="outline" className="flex-1" data-testid={`button-scale-recipe-mobile-${recipe.id}`}>
                                  <Calculator size={14} className="mr-1" />Skaluj
                                </Button>
                              } />
                              <AddRecipeDialog recipe={recipe} mode="edit" trigger={
                                <Button size="sm" variant="outline" className="flex-1" data-testid={`button-edit-recipe-mobile-${recipe.id}`}>
                                  <Edit size={14} className="mr-1" />Edytuj
                                </Button>
                              } />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="px-3" data-testid={`button-delete-recipe-mobile-${recipe.id}`}>
                                    <Trash2 size={14} />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Usuń przepis</AlertDialogTitle>
                                    <AlertDialogDescription>Usunąć „{recipe.name}"? Tej operacji nie można cofnąć.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteRecipe.mutate(recipe.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Usuń
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Desktop: Virtual scroll table */}
            <div
              className="hidden md:block flex-1 overflow-y-auto"
              onScroll={handleScroll}
              ref={containerCallbackRef}
            >
              <div className="mx-4 md:mx-6 mb-6">
                <Card className="overflow-hidden">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background">
                      <TableRow>
                        <TableHead>Przepis</TableHead>
                        <TableHead>Kategoria</TableHead>
                        <TableHead>Składniki</TableHead>
                        <TableHead>Koszt / 1 kg</TableHead>
                        <TableHead>Dieta</TableHead>
                        <TableHead>Alergeny</TableHead>
                        <TableHead>Akcje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Spacer top */}
                      {desktopVirtual.startIndex > 0 && (
                        <TableRow style={{ height: desktopVirtual.startIndex * ROW_HEIGHT }}>
                          <TableCell colSpan={7} className="p-0 border-0" />
                        </TableRow>
                      )}
                      {desktopVirtual.visibleItems.map(index => {
                        const recipe = filteredRecipes[index];
                        const { costPer1Kg } = calcCost(recipe);
                        return (
                          <TableRow key={recipe.id} style={{ height: ROW_HEIGHT }} data-testid={`recipe-row-${recipe.id}`}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Utensils size={16} className="text-primary flex-shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-semibold truncate max-w-48">{recipe.name}</div>
                                  {recipe.description && (
                                    <div className="text-xs text-muted-foreground truncate max-w-48">{recipe.description}</div>
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
                              <span className="font-medium">{recipe.recipeIngredients.length}</span>
                              <span className="text-muted-foreground text-sm"> skł.</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calculator size={14} className="text-primary" />
                                <span className="font-bold text-primary">{costPer1Kg.toFixed(2)} PLN/kg</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {recipe.isVegan && <Badge variant="outline" className="text-xs text-green-600">V</Badge>}
                                {recipe.isGlutenFree && <Badge variant="outline" className="text-xs text-blue-600">GF</Badge>}
                                {recipe.isLactoseFree && <Badge variant="outline" className="text-xs text-purple-600">BL</Badge>}
                                {!recipe.isVegan && !recipe.isGlutenFree && !recipe.isLactoseFree && <span className="text-muted-foreground text-sm">-</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              {recipe.allergens && recipe.allergens.length > 0 ? (
                                <div className="flex flex-wrap gap-1 max-w-32">
                                  {recipe.allergens.slice(0, 2).map(a => <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>)}
                                  {recipe.allergens.length > 2 && <Badge variant="destructive" className="text-xs">+{recipe.allergens.length - 2}</Badge>}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <RecipeScaleDialog recipe={recipe} trigger={
                                  <Button size="sm" variant="ghost" data-testid={`button-scale-recipe-${recipe.id}`}>
                                    <Calculator size={14} />
                                  </Button>
                                } />
                                <AddRecipeDialog recipe={recipe} mode="edit" trigger={
                                  <Button size="sm" variant="ghost" data-testid={`button-edit-recipe-${recipe.id}`}>
                                    <Edit size={14} />
                                  </Button>
                                } />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" data-testid={`button-delete-recipe-${recipe.id}`}>
                                      <Trash2 size={14} />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Usuń przepis</AlertDialogTitle>
                                      <AlertDialogDescription>Usunąć „{recipe.name}"? Tej operacji nie można cofnąć.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteRecipe.mutate(recipe.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Usuń
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {/* Spacer bottom */}
                      {desktopVirtual.endIndex < filteredRecipes.length - 1 && (
                        <TableRow style={{ height: (filteredRecipes.length - 1 - desktopVirtual.endIndex) * ROW_HEIGHT }}>
                          <TableCell colSpan={7} className="p-0 border-0" />
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
