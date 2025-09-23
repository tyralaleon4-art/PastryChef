import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Copy, Calculator, Utensils } from "lucide-react";
import type { RecipeWithDetails } from "@shared/schema";

interface RecipeCardProps {
  recipe: RecipeWithDetails;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  // Helper function to convert units to kg for cost calculation
  const convertToKg = (quantity: number, unit: string, ingredient: any): number => {
    switch (unit) {
      case 'g': return quantity / 1000;
      case 'kg': return quantity;
      case 'ml': 
        // Use densityGPerMl if available, otherwise assume 1ml ≈ 1g
        const density = ingredient.densityGPerMl || 1;
        return (quantity * density) / 1000;
      case 'l': 
        const densityL = ingredient.densityGPerMl || 1;
        return (quantity * 1000 * densityL) / 1000; // 1L = 1000ml
      case 'pcs': 
        // Use weightPerPieceG if available, otherwise estimate 100g per piece
        const weightPerPiece = ingredient.weightPerPieceG || 100;
        return (quantity * weightPerPiece) / 1000;
      default: return quantity;
    }
  };

  // Calculate total cost with proper unit conversion
  const totalCost = recipe.recipeIngredients.reduce((sum, ri) => {
    const quantity = Number(ri.quantity);
    const weightInKg = convertToKg(quantity, ri.unit, ri.ingredient);
    const ingredientCost = Number(ri.ingredient.costPerUnit) * weightInKg;
    return sum + ingredientCost;
  }, 0);

  return (
    <Card className="recipe-card bg-background border border-border rounded-lg shadow-sm hover:shadow-md transition-all" data-testid={`recipe-card-${recipe.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-foreground text-lg mb-1 flex items-center" data-testid={`recipe-name-${recipe.id}`}>
              <Utensils size={16} className="mr-2 text-primary" />
              {recipe.name}
            </h4>
            {recipe.description && (
              <p className="text-sm text-muted-foreground mb-2" data-testid={`recipe-description-${recipe.id}`}>
                {recipe.description}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-primary" data-testid={`recipe-cost-${recipe.id}`}>
              {totalCost.toFixed(2)} PLN
            </div>
            <div className="text-xs text-muted-foreground">Total Cost</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {recipe.category && (
            <Badge variant="secondary" data-testid={`recipe-category-${recipe.id}`}>
              {recipe.category.name}
            </Badge>
          )}
          {recipe.isVegan && <Badge variant="outline" className="text-green-600">Vegan</Badge>}
          {recipe.isGlutenFree && <Badge variant="outline" className="text-blue-600">Gluten Free</Badge>}
          {recipe.isLactoseFree && <Badge variant="outline" className="text-purple-600">Lactose Free</Badge>}
        </div>

        {recipe.allergens && recipe.allergens.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-muted-foreground mb-1">Allergens:</div>
            <div className="flex flex-wrap gap-1">
              {recipe.allergens.map((allergen) => (
                <Badge key={allergen} variant="destructive" className="text-xs">
                  {allergen}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {recipe.recipeIngredients.length} ingredients
          </div>
          <div className="flex items-center space-x-1">
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-primary" data-testid={`button-edit-recipe-${recipe.id}`}>
              <Edit size={14} />
            </Button>
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-primary" data-testid={`button-copy-recipe-${recipe.id}`}>
              <Copy size={14} />
            </Button>
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-primary" data-testid={`button-calculate-recipe-${recipe.id}`}>
              <Calculator size={14} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
