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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Plus, Utensils, Calculator, Edit, Trash2, Eye, X, ChefHat, Leaf, Wheat, Milk, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n";
import type { RecipeWithDetails, Category } from "@shared/schema";

const ROW_HEIGHT = 64;
const CARD_HEIGHT = 270;
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
  return { totalCost, costPer1Kg: totalWeightKg > 0 ? totalCost / totalWeightKg : 0, totalWeightKg };
}

function formatQty(qty: number, unit: string): string {
  const val = Number(qty);
  return `${val % 1 === 0 ? val : val.toFixed(2)} ${unit}`;
}

// ─── Recipe Preview Sheet ──────────────────────────────────────────────────────
function RecipePreviewSheet({ recipe, open, onClose }: { recipe: RecipeWithDetails | null; open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  if (!recipe) return null;
  const { totalCost, costPer1Kg, totalWeightKg } = calcCost(recipe);
  const instructions: string[] = Array.isArray(recipe.instructions) ? recipe.instructions : [];

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        <SheetHeader className="p-6 pb-4 border-b bg-primary text-primary-foreground">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl font-bold text-primary-foreground leading-tight">{recipe.name}</SheetTitle>
              {recipe.description && (
                <p className="text-primary-foreground/75 text-sm mt-1 leading-relaxed">{recipe.description}</p>
              )}
            </div>
            <SheetClose asChild>
              <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20 flex-shrink-0 -mr-2">
                <X size={18} />
              </Button>
            </SheetClose>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {recipe.category && (
              <Badge className="bg-secondary text-secondary-foreground border-0 text-xs">
                {recipe.category.name}
              </Badge>
            )}
            {recipe.isVegan && (
              <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground/80 text-xs">
                <Leaf size={10} className="mr-1" />{t("recipe.vegan")}
              </Badge>
            )}
            {recipe.isGlutenFree && (
              <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground/80 text-xs">
                <Wheat size={10} className="mr-1" />{t("recipe.glutenFree")}
              </Badge>
            )}
            {recipe.isLactoseFree && (
              <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground/80 text-xs">
                <Milk size={10} className="mr-1" />{t("recipe.lactoseFree")}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Cost Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-accent rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">{t("recipes.totalCost")}</p>
              <p className="font-bold text-lg text-foreground">{totalCost.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">PLN</p>
            </div>
            <div className="bg-accent rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">{t("recipes.costPerKg")}</p>
              <p className="font-bold text-lg text-secondary">{costPer1Kg.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">PLN/kg</p>
            </div>
            <div className="bg-accent rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">{t("recipes.totalWeight")}</p>
              <p className="font-bold text-lg text-foreground">{(totalWeightKg * 1000).toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">g</p>
            </div>
          </div>

          {/* Ingredients */}
          {recipe.recipeIngredients.length > 0 && (
            <div>
              <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                <ChefHat size={16} className="text-secondary" />
                {t("recipes.ingredients")} ({recipe.recipeIngredients.length})
              </h3>
              <div className="space-y-2">
                {recipe.recipeIngredients.map((ri, i) => {
                  const ingCost = Number(ri.ingredient.costPerUnit) * convertToKg(Number(ri.quantity), ri.unit, ri.ingredient);
                  return (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{ri.ingredient.name}</p>
                        {ri.ingredient.supplier && (
                          <p className="text-xs text-muted-foreground">{ri.ingredient.supplier}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="font-semibold text-sm">{formatQty(Number(ri.quantity), ri.unit)}</p>
                        <p className="text-xs text-muted-foreground">{ingCost.toFixed(2)} PLN</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Instructions */}
          {instructions.length > 0 && (
            <div>
              <Separator className="mb-4" />
              <h3 className="font-semibold text-base mb-3">{t("recipes.instructions")}</h3>
              <ol className="space-y-3">
                {instructions.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-foreground">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Allergens */}
          {recipe.allergens && recipe.allergens.length > 0 && (
            <div>
              <Separator className="mb-4" />
              <h3 className="font-semibold text-base mb-3 flex items-center gap-2 text-destructive">
                <AlertTriangle size={16} />
                {t("recipe.allergens")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {recipe.allergens.map(a => (
                  <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Nutrition */}
          {(recipe.calories || recipe.protein || recipe.fat || recipe.carbs) && (
            <div>
              <Separator className="mb-4" />
              <h3 className="font-semibold text-base mb-3">{t("recipes.nutritionPer100g")}</h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: t("recipes.calories"), val: recipe.calories },
                  { label: t("recipes.protein"), val: recipe.protein ? `${recipe.protein}g` : null },
                  { label: t("recipes.fat"), val: recipe.fat ? `${recipe.fat}g` : null },
                  { label: t("recipes.carbs"), val: recipe.carbs ? `${recipe.carbs}g` : null },
                ].map(({ label, val }) => val ? (
                  <div key={label} className="bg-accent rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-bold text-sm">{val}</p>
                  </div>
                ) : null)}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Virtual scroll hook ───────────────────────────────────────────────────────
function useVirtualScroll(totalItems: number, itemHeight: number, containerHeight: number, scrollTop: number) {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - OVERSCAN);
  const endIndex = Math.min(totalItems - 1, Math.ceil((scrollTop + containerHeight) / itemHeight) + OVERSCAN);
  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) visibleItems.push(i);
  return { startIndex, endIndex, visibleItems, totalHeight: totalItems * itemHeight, offsetY: startIndex * itemHeight };
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Recipes() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dietaryFilters, setDietaryFilters] = useState({ vegan: false, glutenFree: false, lactoseFree: false });
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const [previewRecipe, setPreviewRecipe] = useState<RecipeWithDetails | null>(null);
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
      toast({ title: t("recipes.deleted") });
    },
    onError: () => {
      toast({ title: t("common.error"), description: t("recipes.deleteFailed"), variant: "destructive" });
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

  const mobileVirtual = useVirtualScroll(filteredRecipes.length, CARD_HEIGHT, containerHeight, scrollTop);
  const desktopVirtual = useVirtualScroll(filteredRecipes.length, ROW_HEIGHT, containerHeight, scrollTop);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <Header
          title={t("recipes.title")}
          subtitle={`${t("recipes.subtitle")}${filteredRecipes.length !== recipes.length ? ` (${t("recipes.filteredCount", { filtered: filteredRecipes.length, total: recipes.length })})` : ` (${recipes.length})`}`}
          action={
            <AddRecipeDialog
              trigger={
                <Button data-testid="button-add-recipe">
                  <Plus size={16} className="mr-2" />{t("recipes.new")}
                </Button>
              }
            />
          }
        />

        <div className="px-4 md:px-6 py-4 border-b bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                className="pl-10"
                placeholder={t("recipes.search")}
                value={search}
                onChange={e => setSearch(e.target.value)}
                data-testid="input-search-recipes"
                style={{ fontSize: '16px' }}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48" data-testid="select-category-filter">
                <SelectValue placeholder={t("recipes.allCategories")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("recipes.allCategories")}</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap items-center gap-4">
              {[
                { id: "vegan", label: t("recipe.vegan"), key: "vegan" },
                { id: "gluten-free", label: t("recipe.glutenFree"), key: "glutenFree" },
                { id: "lactose-free", label: t("recipe.lactoseFree"), key: "lactoseFree" },
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

        {isLoading ? (
          <div className="flex-1 p-4 md:p-6 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse h-16 bg-muted rounded" />
            ))}
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Utensils className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">{t("recipes.none")}</p>
            <p className="text-muted-foreground text-sm mt-2">
              {search || categoryFilter ? t("recipes.adjustFilters") : t("recipes.addFirst")}
            </p>
            <AddRecipeDialog
              trigger={
                <Button className="mt-4" data-testid="button-create-first-recipe">
                  <Plus size={16} className="mr-2" />{t("recipes.add")}
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
                        <Card className="p-4 h-full shadow-sm" data-testid={`recipe-card-${recipe.id}`}>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <Utensils size={20} className="text-secondary mt-1 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base leading-tight truncate">{recipe.name}</h3>
                                {recipe.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{recipe.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <div className="text-muted-foreground text-xs">{t("recipes.category")}</div>
                                <div className="mt-1">
                                  {recipe.category ? <Badge variant="secondary" className="text-xs">{recipe.category.name}</Badge> : <span className="text-muted-foreground">-</span>}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground text-xs">{t("recipes.costPerKg")}</div>
                                <div className="mt-1 font-bold text-secondary">{costPer1Kg.toFixed(2)} PLN/kg</div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {recipe.isVegan && <Badge variant="outline" className="text-xs text-green-700">{t("recipe.vegan")}</Badge>}
                              {recipe.isGlutenFree && <Badge variant="outline" className="text-xs text-blue-700">{t("recipes.glutenFreeShort")}</Badge>}
                              {recipe.isLactoseFree && <Badge variant="outline" className="text-xs text-purple-700">{t("recipes.lactoseFreeShort")}</Badge>}
                              {recipe.allergens?.slice(0, 2).map(a => <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>)}
                            </div>
                            <RecipeScaleDialog recipe={recipe} trigger={
                              <Button
                                size="sm"
                                className="w-full"
                                data-testid={`button-scale-recipe-mobile-${recipe.id}`}
                              >
                                <Calculator size={14} className="mr-2" />
                                {t("recipes.scale")}
                              </Button>
                            } />
                            <div className="flex items-center gap-2 pt-2 border-t">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-secondary border-secondary/30 hover:bg-secondary/10"
                                onClick={() => setPreviewRecipe(recipe)}
                                data-testid={`button-preview-recipe-mobile-${recipe.id}`}
                              >
                                 <Eye size={14} className="mr-1" />{t("recipes.preview")}
                              </Button>
                              <AddRecipeDialog recipe={recipe} mode="edit" trigger={
                                <Button size="sm" variant="outline" className="flex-1" data-testid={`button-edit-recipe-mobile-${recipe.id}`}>
                                   <Edit size={14} className="mr-1" />{t("recipes.edit")}
                                </Button>
                              } />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="px-3 text-destructive hover:text-destructive" data-testid={`button-delete-recipe-mobile-${recipe.id}`}>
                                    <Trash2 size={14} />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t("recipes.deleteTitle")}</AlertDialogTitle>
                                    <AlertDialogDescription>{t("recipes.deleteDescription", { name: recipe.name })}</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t("recipes.cancel")}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteRecipe.mutate(recipe.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      {t("recipes.delete")}
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
                <Card className="overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-card">
                      <TableRow className="border-border">
                        <TableHead>{t("recipes.title")}</TableHead>
                        <TableHead>{t("recipes.category")}</TableHead>
                        <TableHead>{t("recipes.ingredients")}</TableHead>
                        <TableHead>{t("recipes.costPerKg")}</TableHead>
                        <TableHead>{t("recipes.diet")}</TableHead>
                        <TableHead>{t("recipe.allergens")}</TableHead>
                        <TableHead>{t("recipes.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {desktopVirtual.startIndex > 0 && (
                        <TableRow style={{ height: desktopVirtual.startIndex * ROW_HEIGHT }}>
                          <TableCell colSpan={7} className="p-0 border-0" />
                        </TableRow>
                      )}
                      {desktopVirtual.visibleItems.map(index => {
                        const recipe = filteredRecipes[index];
                        const { costPer1Kg } = calcCost(recipe);
                        return (
                          <TableRow
                            key={recipe.id}
                            style={{ height: ROW_HEIGHT }}
                            className="cursor-pointer hover:bg-accent/40 transition-colors"
                            data-testid={`recipe-row-${recipe.id}`}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Utensils size={16} className="text-secondary flex-shrink-0" />
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
                              <span className="text-muted-foreground text-sm"> {t("recipes.ingredientsShort")}</span>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-secondary">{costPer1Kg.toFixed(2)} PLN/kg</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {recipe.isVegan && <Badge variant="outline" className="text-xs text-green-700">{t("recipe.vegan")}</Badge>}
                                {recipe.isGlutenFree && <Badge variant="outline" className="text-xs text-blue-700">{t("recipe.glutenFree")}</Badge>}
                                {recipe.isLactoseFree && <Badge variant="outline" className="text-xs text-purple-700">{t("recipe.lactoseFree")}</Badge>}
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
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-secondary hover:text-secondary hover:bg-secondary/10"
                                  onClick={() => setPreviewRecipe(recipe)}
                                  data-testid={`button-preview-recipe-${recipe.id}`}
                                   title={t("recipes.preview")}
                                >
                                  <Eye size={14} />
                                </Button>
                                <RecipeScaleDialog recipe={recipe} trigger={
                                  <Button size="sm" variant="ghost" data-testid={`button-scale-recipe-${recipe.id}`} title={t("recipes.scale")}>
                                    <Calculator size={14} />
                                  </Button>
                                } />
                                <AddRecipeDialog recipe={recipe} mode="edit" trigger={
                                  <Button size="sm" variant="ghost" data-testid={`button-edit-recipe-${recipe.id}`} title={t("recipes.edit")}>
                                    <Edit size={14} />
                                  </Button>
                                } />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" data-testid={`button-delete-recipe-${recipe.id}`} title={t("recipes.deleteTitle")}>
                                      <Trash2 size={14} />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{t("recipes.deleteTitle")}</AlertDialogTitle>
                                      <AlertDialogDescription>{t("recipes.deleteDescription", { name: recipe.name })}</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{t("recipes.cancel")}</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteRecipe.mutate(recipe.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        {t("recipes.delete")}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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

      <RecipePreviewSheet
        recipe={previewRecipe}
        open={!!previewRecipe}
        onClose={() => setPreviewRecipe(null)}
      />
    </div>
  );
}
