import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RecipeCategoryDialog from "./recipe-category-dialog";
import type { InsertRecipe, Category, Ingredient } from "@shared/schema";

interface AddRecipeDialogProps {
  trigger?: React.ReactNode;
}

interface RecipeIngredientItem {
  ingredientId: string;
  quantity: string;
  unit: string;
}

export default function AddRecipeDialog({ trigger }: AddRecipeDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isVegan, setIsVegan] = useState(false);
  const [isGlutenFree, setIsGlutenFree] = useState(false);
  const [isLactoseFree, setIsLactoseFree] = useState(false);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredientItem[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: ingredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  // Helper function to convert units to kg for cost calculation
  const convertToKg = (quantity: number, unit: string): number => {
    switch (unit) {
      case 'g': return quantity / 1000;
      case 'kg': return quantity;
      case 'ml': return quantity / 1000; // Assuming 1ml ≈ 1g for most ingredients
      case 'l': return quantity;
      case 'pcs': return quantity * 0.1; // Rough estimate: 1 piece ≈ 100g
      default: return quantity;
    }
  };

  // Calculate total cost, weight, percentages and detect allergens from selected ingredients
  const { totalCost, totalWeight, recipeDetails, validDetails, detectedAllergens, isVeganCompatible, isGlutenFreeCompatible, isLactoseFreeCompatible } = useMemo(() => {
    let cost = 0;
    let weight = 0; // Total weight in kg for percentage calculation
    const allergenSet = new Set<string>();
    let vegan = true;
    let glutenFree = true;
    let lactoseFree = true;
    
    // Index-aligned details array (same length as recipeIngredients)
    const details: Array<{
      ingredientId: string;
      ingredientName: string;
      quantity: number;
      unit: string;
      cost: number;
      weightInKg: number;
      percentage: number;
    } | null> = [];

    // Valid details for the breakdown list (only complete rows)
    const validDetailsForBreakdown: Array<{
      ingredientId: string;
      ingredientName: string;
      quantity: number;
      unit: string;
      cost: number;
      weightInKg: number;
      percentage: number;
    }> = [];

    // First pass: calculate costs and weights for each row
    recipeIngredients.forEach((ri, index) => {
      const ingredient = ingredients.find(ing => ing.id === ri.ingredientId);
      if (ingredient && ri.quantity) {
        const quantity = Number(ri.quantity);
        const weightInKg = convertToKg(quantity, ri.unit);
        const ingredientCost = Number(ingredient.costPerUnit) * weightInKg;
        
        cost += ingredientCost;
        weight += weightInKg;
        
        const detail = {
          ingredientId: ri.ingredientId,
          ingredientName: ingredient.name,
          quantity,
          unit: ri.unit,
          cost: ingredientCost,
          weightInKg,
          percentage: 0 // Will be calculated in second pass
        };
        
        details[index] = detail;
        validDetailsForBreakdown.push(detail);
        
        // Collect allergens
        if (ingredient.allergens && Array.isArray(ingredient.allergens)) {
          ingredient.allergens.forEach(allergen => allergenSet.add(allergen));
        }

        // Check dietary compatibility
        if (!ingredient.isVegan) vegan = false;
        if (!ingredient.isGlutenFree) glutenFree = false;
        if (!ingredient.isLactoseFree) lactoseFree = false;
      } else {
        details[index] = null; // Keep index alignment for incomplete rows
      }
    });

    // Second pass: calculate percentages
    if (weight > 0) {
      details.forEach(detail => {
        if (detail) {
          detail.percentage = (detail.weightInKg / weight) * 100;
        }
      });
      validDetailsForBreakdown.forEach(detail => {
        detail.percentage = (detail.weightInKg / weight) * 100;
      });
    }

    return {
      totalCost: cost,
      totalWeight: weight,
      recipeDetails: details,
      validDetails: validDetailsForBreakdown,
      detectedAllergens: Array.from(allergenSet),
      isVeganCompatible: vegan,
      isGlutenFreeCompatible: glutenFree,
      isLactoseFreeCompatible: lactoseFree
    };
  }, [recipeIngredients, ingredients]);

  // Auto-set dietary flags based on ingredient compatibility
  useEffect(() => {
    if (recipeIngredients.length > 0) {
      setIsVegan(isVeganCompatible);
      setIsGlutenFree(isGlutenFreeCompatible);
      setIsLactoseFree(isLactoseFreeCompatible);
    }
  }, [isVeganCompatible, isGlutenFreeCompatible, isLactoseFreeCompatible, recipeIngredients.length]);

  const createRecipe = useMutation({
    mutationFn: async (recipe: InsertRecipe & { recipeIngredients: RecipeIngredientItem[] }) => {
      const response = await apiRequest("POST", "/api/recipes", recipe);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setOpen(false);
      resetForm();
      toast({
        title: "Recipe added",
        description: "Recipe has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add recipe.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategoryId("");
    setIsVegan(false);
    setIsGlutenFree(false);
    setIsLactoseFree(false);
    setRecipeIngredients([]);
  };

  const addIngredient = () => {
    setRecipeIngredients([...recipeIngredients, { ingredientId: "", quantity: "", unit: "g" }]);
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredientItem, value: string) => {
    const updated = recipeIngredients.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setRecipeIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || recipeIngredients.length === 0) return;
    
    createRecipe.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      categoryId: categoryId && categoryId !== "none" ? categoryId : undefined,
      allergens: detectedAllergens,
      isVegan,
      isGlutenFree,
      isLactoseFree,
      instructions: [],
      recipeIngredients: recipeIngredients.filter(ri => ri.ingredientId && ri.quantity)
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-add-recipe">
            <Plus size={16} className="mr-2" />
            Add Recipe
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-add-recipe">
        <DialogHeader>
          <DialogTitle>Add New Recipe</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Recipe Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sernik krakowski"
                required
                data-testid="input-recipe-name"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <div className="flex space-x-2">
                <Select value={categoryId} onValueChange={setCategoryId} data-testid="select-recipe-category">
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <RecipeCategoryDialog />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description of the recipe..."
              rows={3}
              data-testid="input-recipe-description"
            />
          </div>



          {/* Ingredients Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Ingredients</Label>
              <Button type="button" variant="outline" size="sm" onClick={addIngredient} data-testid="button-add-ingredient-to-recipe">
                <Plus size={16} className="mr-2" />
                Add Ingredient
              </Button>
            </div>

            <div className="space-y-3">
              {recipeIngredients.map((item, index) => {
                const recipeDetail = recipeDetails[index];
                return (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Select 
                        value={item.ingredientId} 
                        onValueChange={(value) => updateIngredient(index, 'ingredientId', value)}
                        data-testid={`select-ingredient-${index}`}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ingredient" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map((ingredient) => (
                            <SelectItem key={ingredient.id} value={ingredient.id}>
                              {ingredient.name} ({Number(ingredient.costPerUnit).toFixed(2)} PLN/kg)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                        placeholder="500"
                        data-testid={`input-quantity-${index}`}
                      />
                    </div>
                    <div className="w-20">
                      <Select 
                        value={item.unit} 
                        onValueChange={(value) => updateIngredient(index, 'unit', value)}
                        data-testid={`select-unit-${index}`}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="ml">ml</SelectItem>
                          <SelectItem value="l">l</SelectItem>
                          <SelectItem value="pcs">pcs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {recipeDetail && recipeDetail.percentage > 0 && (
                      <div className="w-20 text-sm font-medium text-primary text-center">
                        {recipeDetail.percentage.toFixed(1)}%
                      </div>
                    )}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeIngredient(index)}
                      data-testid={`button-remove-ingredient-${index}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                );
              })}
              
              {recipeIngredients.length === 0 && (
                <p className="text-muted-foreground text-sm">No ingredients added yet.</p>
              )}
            </div>
          </div>

          {/* Cost and Allergen Information */}
          {recipeIngredients.length > 0 && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center">
                  <Calculator size={16} className="mr-2" />
                  Recipe Analysis
                </h4>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {totalCost.toFixed(2)} PLN total
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total weight: {(totalWeight * 1000).toFixed(0)}g
                  </div>
                </div>
              </div>
              
              {/* Ingredient breakdown with percentages */}
              {validDetails.length > 0 && (
                <div className="mb-3">
                  <Label className="text-sm font-medium">Ingredient Breakdown:</Label>
                  <div className="mt-2 space-y-1">
                    {validDetails.map((detail, index) => (
                      <div key={`${detail.ingredientId}-${index}`} className="flex justify-between items-center text-sm">
                        <span className="font-medium">{detail.ingredientName}</span>
                        <div className="flex items-center space-x-3">
                          <span>{detail.quantity}{detail.unit}</span>
                          <span className="text-primary font-medium">{detail.percentage.toFixed(1)}%</span>
                          <span className="text-muted-foreground">{detail.cost.toFixed(2)} PLN</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {detectedAllergens.length > 0 && (
                <div className="mb-3">
                  <Label className="text-sm font-medium">Detected Allergens:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {detectedAllergens.map((allergen) => (
                      <Badge key={allergen} variant="secondary" className="text-xs">
                        {allergen}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-4 text-sm">
                <span className={isVeganCompatible ? "text-green-600" : "text-muted-foreground"}>
                  {isVeganCompatible ? "✓" : "✗"} Vegan Compatible
                </span>
                <span className={isGlutenFreeCompatible ? "text-green-600" : "text-muted-foreground"}>
                  {isGlutenFreeCompatible ? "✓" : "✗"} Gluten Free Compatible
                </span>
                <span className={isLactoseFreeCompatible ? "text-green-600" : "text-muted-foreground"}>
                  {isLactoseFreeCompatible ? "✓" : "✗"} Lactose Free Compatible
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createRecipe.isPending || !name.trim() || recipeIngredients.length === 0}
              data-testid="button-save-recipe"
            >
              {createRecipe.isPending ? "Adding..." : "Add Recipe"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}