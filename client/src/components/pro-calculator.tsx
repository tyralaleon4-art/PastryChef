import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { RecipeWithDetails } from "@shared/schema";

interface CalculatorIngredient {
  name: string;
  grams: number;
  percentage: number;
  cost: number;
}

export default function ProCalculator() {
  const [recipeName, setRecipeName] = useState("");
  const [targetMass, setTargetMass] = useState(1000);
  const [ingredients, setIngredients] = useState<CalculatorIngredient[]>(
    Array(12).fill(null).map((_, i) => ({
      name: "",
      grams: 0,
      percentage: 0,
      cost: 0
    }))
  );
  const [notes, setNotes] = useState("");
  const [totalGrams, setTotalGrams] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const { toast } = useToast();

  // Fetch recipes for loading functionality
  const { data: recipes = [] } = useQuery<RecipeWithDetails[]>({
    queryKey: ['/api/recipes'],
  });

  // Calculate percentages and costs
  const calculateAll = () => {
    const total = ingredients.reduce((sum, ing) => sum + (ing.grams || 0), 0);
    
    const updatedIngredients = ingredients.map(ing => {
      const percentage = total > 0 ? (ing.grams / total * 100) : 0;
      const cost = (ing.grams / 1000) * 5; // Przykładowa cena za kg
      return { ...ing, percentage, cost };
    });
    
    const totalCostCalculated = updatedIngredients.reduce((sum, ing) => sum + ing.cost, 0);
    
    setIngredients(updatedIngredients);
    setTotalGrams(total);
    setTotalCost(totalCostCalculated);
  };

  // Update ingredient value
  const updateIngredient = (index: number, field: keyof CalculatorIngredient, value: string | number) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
    
    // Recalculate if grams changed
    if (field === 'grams') {
      setTimeout(calculateAll, 0);
    }
  };

  // Load recipe data
  const loadRecipeData = () => {
    if (!recipeName.trim()) {
      toast({
        title: "Błąd",
        description: "Wpisz nazwę przepisu",
        variant: "destructive"
      });
      return;
    }

    const recipe = recipes.find(r => 
      r.name.toLowerCase().includes(recipeName.toLowerCase())
    );

    if (!recipe) {
      toast({
        title: "Błąd", 
        description: "Nie znaleziono przepisu!",
        variant: "destructive"
      });
      return;
    }

    // Calculate original mass
    const originalMass = recipe.recipeIngredients.reduce((sum, ing) => {
      const quantity = parseFloat(ing.quantity) || 0;
      return sum + quantity;
    }, 0);

    if (originalMass === 0) {
      toast({
        title: "Błąd",
        description: "Przepis nie ma składników z wagą",
        variant: "destructive"
      });
      return;
    }

    const multiplier = targetMass / originalMass;

    // Load ingredients (up to 12)
    const newIngredients = [...ingredients];
    recipe.recipeIngredients.slice(0, 12).forEach((recipeIng, index) => {
      const originalQuantity = parseFloat(recipeIng.quantity) || 0;
      const scaledQuantity = Math.round(originalQuantity * multiplier);
      
      newIngredients[index] = {
        name: recipeIng.ingredient.name,
        grams: scaledQuantity,
        percentage: 0,
        cost: 0
      };
    });

    // Clear remaining rows
    for (let i = recipe.recipeIngredients.length; i < 12; i++) {
      newIngredients[i] = { name: "", grams: 0, percentage: 0, cost: 0 };
    }

    setIngredients(newIngredients);
    setNotes(recipe.instructions?.join('\n') || "");
    
    // Calculate percentages after state update
    setTimeout(() => {
      const total = newIngredients.reduce((sum, ing) => sum + (ing.grams || 0), 0);
      
      const updatedIngredientsWithCalc = newIngredients.map(ing => {
        const percentage = total > 0 ? (ing.grams / total * 100) : 0;
        const cost = (ing.grams / 1000) * 5; // Przykładowa cena za kg
        return { ...ing, percentage, cost };
      });
      
      const totalCostCalculated = updatedIngredientsWithCalc.reduce((sum, ing) => sum + ing.cost, 0);
      
      setIngredients(updatedIngredientsWithCalc);
      setTotalGrams(total);
      setTotalCost(totalCostCalculated);
    }, 100);
    
    toast({
      title: "Sukces",
      description: "Przepis załadowany i przeliczony!",
      variant: "default"
    });
  };

  // Clear all data
  const clearCalculator = () => {
    setRecipeName("");
    setTargetMass(1000);
    setIngredients(Array(12).fill(null).map(() => ({
      name: "",
      grams: 0,
      percentage: 0,
      cost: 0
    })));
    setNotes("");
    setTotalGrams(0);
    setTotalCost(0);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            🧮 Kalkulator Procentowy - Tryb Pro
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Control Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label htmlFor="recipe-name" className="font-bold">NAZWA PRZEPISU:</Label>
              <Input
                id="recipe-name"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="Wpisz nazwę..."
                className="border border-black"
                data-testid="input-recipe-name"
              />
            </div>
            <div>
              <Label htmlFor="target-mass" className="font-bold">MASA DOCELOWA:</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="target-mass"
                  type="number"
                  value={targetMass}
                  onChange={(e) => setTargetMass(parseInt(e.target.value) || 1000)}
                  placeholder="1000"
                  className="border border-black"
                  data-testid="input-target-mass"
                />
                <span className="text-sm font-bold">g</span>
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <Button 
                onClick={loadRecipeData} 
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-load-recipe"
              >
                📋 ZAŁADUJ
              </Button>
              <Button 
                onClick={clearCalculator} 
                variant="outline"
                data-testid="button-clear-calculator"
              >
                🗑️ WYCZYŚĆ
              </Button>
            </div>
          </div>

          {/* Ingredients Table */}
          <div className="border-2 border-black mb-6">
            {/* Table Header */}
            <div className="grid grid-cols-4 bg-gray-100 dark:bg-gray-700 border-b-2 border-black">
              <div className="p-3 border-r border-black font-bold text-sm">SKŁADNIK</div>
              <div className="p-3 border-r border-black font-bold text-sm text-center">GRAMY</div>
              <div className="p-3 border-r border-black font-bold text-sm text-center">PROCENT</div>
              <div className="p-3 font-bold text-sm text-center">KOSZT</div>
            </div>
            
            {/* Table Rows */}
            {ingredients.map((ingredient, index) => (
              <div key={index} className="grid grid-cols-4 border-b border-gray-300">
                <div className="border-r border-gray-300">
                  <Input
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    placeholder={`Składnik ${index + 1}`}
                    className="border-none rounded-none text-sm bg-transparent"
                    data-testid={`input-ingredient-${index}`}
                  />
                </div>
                <div className="border-r border-gray-300">
                  <Input
                    type="number"
                    value={ingredient.grams || ""}
                    onChange={(e) => updateIngredient(index, 'grams', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="border-none rounded-none text-sm bg-transparent text-center"
                    data-testid={`input-grams-${index}`}
                  />
                </div>
                <div className="border-r border-gray-300 flex items-center justify-center p-3">
                  <span className="text-sm font-medium" data-testid={`text-percentage-${index}`}>
                    {ingredient.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-center p-3">
                  <span className="text-sm" data-testid={`text-cost-${index}`}>
                    {ingredient.cost.toFixed(2)} zł
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Notes Section */}
          <div className="border-2 border-black mb-6">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 border-b border-black font-bold text-sm">
              UWAGI / WYKONANIE:
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrukcje wykonania..."
              className="border-none rounded-none text-sm min-h-[80px] resize-none"
              data-testid="textarea-notes"
            />
          </div>

          {/* Summary */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-black text-sm">
            <div className="flex justify-between items-center">
              <span>
                <strong>SUMA:</strong> <span data-testid="text-total-grams">{totalGrams.toFixed(0)}</span>g
              </span>
              <span>
                <strong>KOSZT:</strong> <span data-testid="text-total-cost">{totalCost.toFixed(2)}</span> zł
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}