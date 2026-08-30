import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Copy, Calculator, Utensils } from "lucide-react";
import type { RecipeWithDetails } from "@shared/schema";
import RecipeNutrition from "./recipe-nutrition";
import { useI18n } from "@/i18n";

interface RecipeCardProps {
  recipe: RecipeWithDetails;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const { t } = useI18n();
  const convertToKg = (quantity: number, unit: string, ingredient: any): number => {
    switch (unit) {
      case 'g': return quantity / 1000;
      case 'kg': return quantity;
      case 'ml': return (quantity * (ingredient.densityGPerMl || 1)) / 1000;
      case 'l': return (quantity * 1000 * (ingredient.densityGPerMl || 1)) / 1000;
      case 'pcs': return (quantity * (ingredient.weightPerPieceG || 100)) / 1000;
      default: return quantity;
    }
  };

  const totalCost = recipe.recipeIngredients.reduce((sum, ri) => {
    const weightInKg = convertToKg(Number(ri.quantity), ri.unit, ri.ingredient);
    return sum + Number(ri.ingredient.costPerUnit) * weightInKg;
  }, 0);

  const totalWeightKg = recipe.recipeIngredients.reduce((sum, ri) => {
    return sum + convertToKg(Number(ri.quantity), ri.unit, ri.ingredient);
  }, 0);

  const costPer1Kg = totalWeightKg > 0 ? totalCost / totalWeightKg : 0;

  return (
    <Card className="recipe-card bg-white border border-border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden" data-testid={`recipe-card-${recipe.id}`}>
      {/* Gold top accent strip */}
      <div className="h-0.5 bg-gradient-to-r from-secondary/60 via-secondary to-secondary/60" />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground text-base mb-0.5 flex items-center gap-1.5 truncate" data-testid={`recipe-name-${recipe.id}`}>
              <Utensils size={14} className="text-secondary flex-shrink-0" />
              <span className="truncate">{recipe.name}</span>
            </h4>
            {recipe.description && (
              <p className="text-xs text-muted-foreground line-clamp-2" data-testid={`recipe-description-${recipe.id}`}>
                {recipe.description}
              </p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-base font-bold text-secondary" data-testid={`recipe-cost-${recipe.id}`}>
              {costPer1Kg.toFixed(2)} zł
            </div>
            <div className="text-[10px] text-muted-foreground">/ kg</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {recipe.category && (
            <Badge variant="secondary" className="text-xs" data-testid={`recipe-category-${recipe.id}`}>
              {recipe.category.name}
            </Badge>
          )}
          {recipe.isVegan && <Badge variant="outline" className="text-xs text-emerald-700 border-emerald-300 bg-emerald-50">{t("recipe.vegan")}</Badge>}
          {recipe.isGlutenFree && <Badge variant="outline" className="text-xs text-blue-700 border-blue-300 bg-blue-50">{t("recipe.glutenFree")}</Badge>}
          {recipe.isLactoseFree && <Badge variant="outline" className="text-xs text-purple-700 border-purple-300 bg-purple-50">{t("recipe.lactoseFree")}</Badge>}
        </div>

        {recipe.allergens && recipe.allergens.length > 0 && (
          <div className="mb-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{t("recipe.allergens")}</div>
            <div className="flex flex-wrap gap-1">
              {recipe.allergens.map((allergen) => (
                <Badge key={allergen} variant="destructive" className="text-[10px]">
                  {allergen}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mb-3">
          <RecipeNutrition recipeId={recipe.id} compact />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <div className="text-xs text-muted-foreground">
            {recipe.recipeIngredients.length} {recipe.recipeIngredients.length === 1 ? t("recipe.ingredientOne") : recipe.recipeIngredients.length < 5 ? t("recipe.ingredientFew") : t("recipe.ingredientMany")}
          </div>
          <div className="flex items-center gap-0.5">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary" data-testid={`button-edit-recipe-${recipe.id}`}>
              <Edit size={13} />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary" data-testid={`button-copy-recipe-${recipe.id}`}>
              <Copy size={13} />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary" data-testid={`button-calculate-recipe-${recipe.id}`}>
              <Calculator size={13} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
