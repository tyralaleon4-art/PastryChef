import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AddIngredientDialog from "@/components/add-ingredient-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Plus, Edit, Trash2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { IngredientWithStock } from "@shared/schema";

export default function Ingredients() {
  const [search, setSearch] = useState("");
  const [dietaryFilters, setDietaryFilters] = useState({
    vegan: false,
    glutenFree: false,
    lactoseFree: false,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ingredients = [], isLoading } = useQuery<IngredientWithStock[]>({
    queryKey: ["/api/ingredients"],
  });

  const deleteIngredient = useMutation({
    mutationFn: async (ingredientId: string) => {
      const response = await apiRequest("DELETE", `/api/ingredients/${ingredientId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Ingredient deleted",
        description: "Ingredient has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete ingredient. It may be used in recipes.",
        variant: "destructive",
      });
    },
  });

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(search.toLowerCase());
    const matchesDietary = 
      (!dietaryFilters.vegan || ingredient.isVegan) &&
      (!dietaryFilters.glutenFree || ingredient.isGlutenFree) &&
      (!dietaryFilters.lactoseFree || ingredient.isLactoseFree);
    return matchesSearch && matchesDietary;
  });

  const getStockBadgeVariant = (stockStatus: string) => {
    switch (stockStatus) {
      case "low": return "destructive";
      case "expired": return "destructive";
      default: return "secondary";
    }
  };

  const getStockBadgeText = (stockStatus: string) => {
    switch (stockStatus) {
      case "low": return "Low Stock";
      case "expired": return "Expired";
      default: return "Normal";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <Header 
          title="Ingredient Management" 
          subtitle="Track inventory, costs, and supplier information"
          action={
            <AddIngredientDialog />
          }
        />
        
        <div className="p-4 md:p-6">
          {/* Search and Filter */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
            <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input 
                  className="pl-10" 
                  placeholder="Search ingredients..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-ingredients"
                />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="ingredient-vegan-filter" 
                    checked={dietaryFilters.vegan}
                    onCheckedChange={(checked) => setDietaryFilters(prev => ({...prev, vegan: checked === true}))}
                    data-testid="checkbox-filter-ingredient-vegan"
                  />
                  <label htmlFor="ingredient-vegan-filter" className="text-sm font-medium cursor-pointer">
                    Vegan
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="ingredient-gluten-free-filter" 
                    checked={dietaryFilters.glutenFree}
                    onCheckedChange={(checked) => setDietaryFilters(prev => ({...prev, glutenFree: checked === true}))}
                    data-testid="checkbox-filter-ingredient-gluten-free"
                  />
                  <label htmlFor="ingredient-gluten-free-filter" className="text-sm font-medium cursor-pointer">
                    Gluten Free
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="ingredient-lactose-free-filter" 
                    checked={dietaryFilters.lactoseFree}
                    onCheckedChange={(checked) => setDietaryFilters(prev => ({...prev, lactoseFree: checked === true}))}
                    data-testid="checkbox-filter-ingredient-lactose-free"
                  />
                  <label htmlFor="ingredient-lactose-free-filter" className="text-sm font-medium cursor-pointer">
                    Lactose Free
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Ingredients Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse h-12 bg-muted rounded"></div>
              ))}
            </div>
          ) : filteredIngredients.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">No ingredients found</p>
              <p className="text-muted-foreground text-sm mt-2">
                {search ? "Try adjusting your search criteria" : "Start by adding your first ingredient"}
              </p>
              <AddIngredientDialog 
                trigger={
                  <Button className="mt-4" data-testid="button-create-first-ingredient">
                    <Plus size={16} className="mr-2" />
                    Add Ingredient
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="block md:hidden space-y-4">
                {filteredIngredients.map((ingredient) => (
                  <Card key={ingredient.id} className="p-4" data-testid={`ingredient-card-${ingredient.id}`}>
                    <div className="space-y-3">
                      {/* Ingredient Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <Package size={20} className="text-primary mt-1" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base leading-tight">{ingredient.name}</h3>
                            <div className="flex gap-1 mt-1">
                              {ingredient.isVegan && <Badge variant="outline" className="text-xs text-green-600">V</Badge>}
                              {ingredient.isGlutenFree && <Badge variant="outline" className="text-xs text-blue-600">GF</Badge>}
                              {ingredient.isLactoseFree && <Badge variant="outline" className="text-xs text-purple-600">LF</Badge>}
                            </div>
                          </div>
                        </div>
                        <Badge variant={getStockBadgeVariant(ingredient.stockStatus)} data-testid={`badge-stock-mobile-${ingredient.id}`}>
                          {getStockBadgeText(ingredient.stockStatus)}
                        </Badge>
                      </div>

                      {/* Ingredient Details */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Category</div>
                          <div className="mt-1">
                            {ingredient.category ? (
                              <Badge variant="secondary" className="text-xs">{ingredient.category.name}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Price/kg</div>
                          <div className="mt-1 font-medium">
                            {Number(ingredient.costPerUnit).toFixed(2)} PLN
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Current Stock</div>
                          <div className="mt-1 font-medium">
                            {Number(ingredient.currentStock).toFixed(1)} {ingredient.unit}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Min Stock</div>
                          <div className="mt-1 font-medium">
                            {Number(ingredient.minimumStock).toFixed(1)} {ingredient.unit}
                          </div>
                        </div>
                      </div>

                      {/* Supplier */}
                      {ingredient.supplier && (
                        <div>
                          <div className="text-sm text-muted-foreground">Supplier</div>
                          <div className="mt-1 text-sm font-medium">{ingredient.supplier}</div>
                        </div>
                      )}

                      {/* Allergens */}
                      {ingredient.allergens && ingredient.allergens.length > 0 && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Allergens</div>
                          <div className="flex flex-wrap gap-1">
                            {ingredient.allergens.slice(0, 3).map((allergen) => (
                              <Badge key={allergen} variant="destructive" className="text-xs">
                                {allergen}
                              </Badge>
                            ))}
                            {ingredient.allergens.length > 3 && (
                              <Badge variant="destructive" className="text-xs">
                                +{ingredient.allergens.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center space-x-2 pt-2 border-t">
                        <AddIngredientDialog
                          ingredient={ingredient}
                          mode="edit"
                          trigger={
                            <Button size="default" variant="outline" className="flex-1 h-10" data-testid={`button-edit-mobile-${ingredient.id}`}>
                              <Edit size={16} className="mr-2" />
                              Edit
                            </Button>
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="default" variant="outline" className="h-10 px-4" data-testid={`button-delete-mobile-${ingredient.id}`}>
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Ingredient</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{ingredient.name}"? This action cannot be undone and may affect recipes that use this ingredient.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteIngredient.mutate(ingredient.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {deleteIngredient.isPending ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block">
                <Card>
                  <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price/kg</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Allergens</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIngredients.map((ingredient) => (
                    <TableRow key={ingredient.id} data-testid={`ingredient-row-${ingredient.id}`}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{ingredient.name}</div>
                          <div className="text-xs text-muted-foreground flex gap-1 mt-1">
                            {ingredient.isVegan && <Badge variant="outline" className="text-xs text-green-600">V</Badge>}
                            {ingredient.isGlutenFree && <Badge variant="outline" className="text-xs text-blue-600">GF</Badge>}
                            {ingredient.isLactoseFree && <Badge variant="outline" className="text-xs text-purple-600">LF</Badge>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {ingredient.category ? (
                          <Badge variant="secondary" className="text-xs">{ingredient.category.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {Number(ingredient.costPerUnit).toFixed(2)} PLN
                      </TableCell>
                      <TableCell>
                        {Number(ingredient.currentStock).toFixed(1)} {ingredient.unit}
                      </TableCell>
                      <TableCell>
                        {Number(ingredient.minimumStock).toFixed(1)} {ingredient.unit}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStockBadgeVariant(ingredient.stockStatus)} data-testid={`badge-stock-${ingredient.id}`}>
                          {getStockBadgeText(ingredient.stockStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {ingredient.supplier || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {ingredient.allergens && ingredient.allergens.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-32">
                            {ingredient.allergens.slice(0, 2).map((allergen) => (
                              <Badge key={allergen} variant="destructive" className="text-xs">
                                {allergen}
                              </Badge>
                            ))}
                            {ingredient.allergens.length > 2 && (
                              <Badge variant="destructive" className="text-xs">
                                +{ingredient.allergens.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <AddIngredientDialog
                            ingredient={ingredient}
                            mode="edit"
                            trigger={
                              <Button size="sm" variant="outline" data-testid={`button-edit-${ingredient.id}`}>
                                <Edit size={14} />
                              </Button>
                            }
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" data-testid={`button-delete-${ingredient.id}`}>
                                <Trash2 size={14} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Ingredient</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{ingredient.name}"? This action cannot be undone and may affect recipes that use this ingredient.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteIngredient.mutate(ingredient.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deleteIngredient.isPending ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
