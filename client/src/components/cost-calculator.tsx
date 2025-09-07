import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign } from "lucide-react";
import type { RecipeWithDetails } from "@shared/schema";

export default function CostCalculator() {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [costData, setCostData] = useState<any>(null);

  const { data: recipes = [] } = useQuery<RecipeWithDetails[]>({
    queryKey: ["/api/recipes"],
  });

  const calculateCost = async () => {
    if (!selectedRecipeId) return;

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
      console.error("Failed to calculate cost:", error);
    }
  };

  return (
    <Card className="bg-background border border-border" data-testid="cost-calculator">
      <CardContent className="p-6">
        <h4 className="font-semibold text-foreground mb-4 flex items-center">
          <DollarSign className="text-secondary mr-2" size={20} />
          Cost Calculator
        </h4>
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-muted-foreground mb-1">
              Recipe Name
            </Label>
            <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId} data-testid="select-recipe">
              <SelectTrigger>
                <SelectValue placeholder="Select a recipe" />
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
                <span className="text-muted-foreground">Ingredient Cost:</span>
                <span className="font-medium" data-testid="ingredient-cost">
                  ${costData.totalCost}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Labor Cost:</span>
                <span className="font-medium">$12.00</span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-2">
                <span className="font-medium">Cost per Serving:</span>
                <span className="font-bold text-primary" data-testid="cost-per-serving">
                  ${costData.costPerServing}
                </span>
              </div>
            </div>
          )}
          <Button 
            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            onClick={calculateCost}
            disabled={!selectedRecipeId}
            data-testid="button-calculate-cost"
          >
            Calculate Cost
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
