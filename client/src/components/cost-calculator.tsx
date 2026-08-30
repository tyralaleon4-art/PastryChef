import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins, Loader2 } from "lucide-react";
import type { RecipeWithDetails } from "@shared/schema";
import { useI18n } from "@/i18n";

export default function CostCalculator() {
  const { t } = useI18n();
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [costData, setCostData] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const { data: recipes = [] } = useQuery<RecipeWithDetails[]>({
    queryKey: ["/api/recipes"],
  });

  const calculateCost = async () => {
    if (!selectedRecipeId) return;
    setIsCalculating(true);
    try {
      const response = await fetch(`/api/recipes/${selectedRecipeId}/calculate-cost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scalingFactor: 1 }),
      });

      if (response.ok) {
        const data = await response.json();
        setCostData(data);
      }
    } catch (error) {
      console.error("Nie udało się obliczyć kosztu:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Card className="bg-card border border-border" data-testid="cost-calculator">
      <CardContent className="p-6">
        <h4 className="font-semibold text-foreground mb-4 flex items-center">
          <Coins className="text-secondary mr-2" size={20} />
          {t("calculator.cost")}
        </h4>
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-muted-foreground mb-1">
              {t("calculator.selectRecipe")}
            </Label>
            <Select value={selectedRecipeId} onValueChange={(v) => { setSelectedRecipeId(v); setCostData(null); }} data-testid="select-recipe">
              <SelectTrigger>
                <SelectValue placeholder={t("calculator.selectRecipe")} />
              </SelectTrigger>
              <SelectContent>
                {recipes.map((recipe) => (
                  <SelectItem key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {costData && (
            <div className="bg-muted p-3 rounded-md space-y-2">
              <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("calculator.totalCost")}</span>
                <span className="font-medium" data-testid="ingredient-cost">
                  {Number(costData.totalCost).toFixed(2)} PLN
                </span>
              </div>
              {costData.costPerServing != null && (
                <div className="flex justify-between text-sm border-t border-border pt-2">
                  <span className="font-medium">{t("calculator.costPerServing")}</span>
                  <span className="font-bold text-secondary" data-testid="cost-per-serving">
                    {Number(costData.costPerServing).toFixed(2)} PLN
                  </span>
                </div>
              )}
            </div>
          )}
          <Button 
            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            onClick={calculateCost}
            disabled={!selectedRecipeId || isCalculating}
            data-testid="button-calculate-cost"
          >
            {isCalculating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("calculator.calculating")}</> : t("calculator.calculateCost")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
