import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Factory, 
  Scale, 
  CheckCircle, 
  Circle, 
  ChefHat, 
  Clock,
  Utensils,
  AlertCircle,
  RotateCcw 
} from "lucide-react";
import type { RecipeWithDetails } from "@shared/schema";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

interface ScaledIngredient {
  ingredientId: string;
  ingredientName: string;
  originalQuantity: number;
  originalUnit: string;
  scaledQuantity: number;
  scaledUnit: string;
  completed: boolean;
}

interface ProductionInstruction {
  instruction: string;
  stepNumber: number;
  completed: boolean;
}

export default function Production() {
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [targetUnit, setTargetUnit] = useState("g");
  const [scaledIngredients, setScaledIngredients] = useState<ScaledIngredient[]>([]);
  const [instructions, setInstructions] = useState<ProductionInstruction[]>([]);
  const [isProducing, setIsProducing] = useState(false);

  const { data: recipes = [] } = useQuery<RecipeWithDetails[]>({
    queryKey: ["/api/recipes"],
  });

  const selectedRecipe = recipes.find(recipe => recipe.id === selectedRecipeId);

  // Helper function to convert units for scaling
  const convertToGrams = (quantity: number, unit: string): number => {
    switch (unit) {
      case 'g': return quantity;
      case 'kg': return quantity * 1000;
      case 'ml': return quantity; // Assuming 1ml ≈ 1g for most ingredients
      case 'l': return quantity * 1000;
      case 'pcs': return quantity * 100; // Rough estimate: 1 piece ≈ 100g
      default: return quantity;
    }
  };

  // Calculate original total weight in grams
  const originalWeight = useMemo(() => {
    if (!selectedRecipe) return 0;
    return selectedRecipe.recipeIngredients.reduce((sum, ri) => {
      return sum + convertToGrams(Number(ri.quantity), ri.unit);
    }, 0);
  }, [selectedRecipe]);

  // Calculate scale factor and scaled ingredients
  useEffect(() => {
    if (!selectedRecipe || !targetWeight || originalWeight <= 0) {
      setScaledIngredients([]);
      return;
    }

    const targetGrams = targetUnit === "kg" ? parseFloat(targetWeight) * 1000 : parseFloat(targetWeight);
    const scaleFactor = targetGrams / originalWeight;

    const scaled = selectedRecipe.recipeIngredients.map(ri => {
      const originalQty = Number(ri.quantity);
      const scaledQty = originalQty * scaleFactor;
      
      return {
        ingredientId: ri.ingredientId,
        ingredientName: ri.ingredient.name,
        originalQuantity: originalQty,
        originalUnit: ri.unit,
        scaledQuantity: scaledQty,
        scaledUnit: ri.unit,
        completed: false
      };
    });

    setScaledIngredients(scaled);
  }, [selectedRecipe, targetWeight, targetUnit, originalWeight]);

  // Set up instructions when recipe changes
  useEffect(() => {
    if (!selectedRecipe || !selectedRecipe.instructions) {
      setInstructions([]);
      return;
    }

    const productionInstructions = selectedRecipe.instructions.map((instruction, index) => ({
      instruction,
      stepNumber: index + 1,
      completed: false
    }));

    setInstructions(productionInstructions);
  }, [selectedRecipe]);

  const toggleIngredientCompletion = (ingredientId: string) => {
    setScaledIngredients(prev => 
      prev.map(ing => 
        ing.ingredientId === ingredientId 
          ? { ...ing, completed: !ing.completed }
          : ing
      )
    );
  };

  const toggleInstructionCompletion = (stepNumber: number) => {
    setInstructions(prev =>
      prev.map(inst =>
        inst.stepNumber === stepNumber
          ? { ...inst, completed: !inst.completed }
          : inst
      )
    );
  };

  const startProduction = () => {
    setIsProducing(true);
  };

  const resetProduction = () => {
    setScaledIngredients(prev => prev.map(ing => ({ ...ing, completed: false })));
    setInstructions(prev => prev.map(inst => ({ ...inst, completed: false })));
  };

  const finishProduction = () => {
    setIsProducing(false);
    setSelectedRecipeId("");
    setTargetWeight("");
    setScaledIngredients([]);
    setInstructions([]);
  };

  // Calculate progress
  const ingredientProgress = scaledIngredients.length > 0 
    ? (scaledIngredients.filter(ing => ing.completed).length / scaledIngredients.length) * 100 
    : 0;
  
  const instructionProgress = instructions.length > 0
    ? (instructions.filter(inst => inst.completed).length / instructions.length) * 100
    : 0;

  const overallProgress = scaledIngredients.length > 0 && instructions.length > 0
    ? (ingredientProgress + instructionProgress) / 2
    : scaledIngredients.length > 0 ? ingredientProgress : instructionProgress;

  const canStartProduction = selectedRecipe && targetWeight && originalWeight > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header title="Production" subtitle="Track your recipe production with interactive checklists" />
          <main className="flex-1 p-4 md:p-6">
            <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center" data-testid="production-title">
              <Factory className="mr-3" size={32} />
              Production
            </h1>
            <p className="text-muted-foreground">
              Track your recipe production with interactive checklists
            </p>
          </div>
        </div>

        {!isProducing ? (
          // Recipe Selection and Setup
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ChefHat className="mr-2" size={20} />
                  Recipe Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="recipe-select">Select Recipe</Label>
                  <Select
                    value={selectedRecipeId}
                    onValueChange={setSelectedRecipeId}
                    data-testid="select-production-recipe"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a recipe to produce" />
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

                <div>
                  <Label htmlFor="target-weight">Target Production Weight</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="target-weight"
                      type="number"
                      step="0.1"
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(e.target.value)}
                      placeholder="1000"
                      data-testid="input-production-weight"
                    />
                    <Select value={targetUnit} onValueChange={setTargetUnit} data-testid="select-production-unit">
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedRecipe && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">{selectedRecipe.name}</h3>
                    {selectedRecipe.description && (
                      <p className="text-sm text-muted-foreground mb-2">{selectedRecipe.description}</p>
                    )}
                    <div className="flex gap-2">
                      {selectedRecipe.isVegan && <Badge variant="secondary">V</Badge>}
                      {selectedRecipe.isGlutenFree && <Badge variant="secondary">GF</Badge>}
                      {selectedRecipe.isLactoseFree && <Badge variant="secondary">LF</Badge>}
                    </div>
                    {originalWeight > 0 && targetWeight && (
                      <div className="mt-2 text-sm">
                        <div>Original: <strong>{originalWeight.toFixed(0)}g</strong></div>
                        <div className="text-primary">
                          Scale Factor: <strong>
                            {(parseFloat(targetWeight) / (originalWeight / (targetUnit === "kg" ? 1000 : 1))).toFixed(2)}x
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  onClick={startProduction}
                  disabled={!canStartProduction}
                  className="w-full"
                  data-testid="button-start-production"
                >
                  <Scale className="mr-2" size={16} />
                  Start Production
                </Button>
              </CardContent>
            </Card>

            {/* Preview of scaled ingredients */}
            {scaledIngredients.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Production Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium">Scaled Ingredients:</h4>
                    {scaledIngredients.slice(0, 5).map((ing, index) => (
                      <div key={ing.ingredientId} className="flex justify-between items-center text-sm">
                        <span>{ing.ingredientName}</span>
                        <span className="font-medium">
                          {ing.scaledQuantity.toFixed(ing.scaledQuantity < 10 ? 1 : 0)} {ing.scaledUnit}
                        </span>
                      </div>
                    ))}
                    {scaledIngredients.length > 5 && (
                      <div className="text-sm text-muted-foreground">
                        ... and {scaledIngredients.length - 5} more ingredients
                      </div>
                    )}
                  </div>

                  {instructions.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium">Instructions:</h4>
                      <div className="text-sm text-muted-foreground">
                        {instructions.length} step{instructions.length !== 1 ? 's' : ''} to complete
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          // Production Mode
          <div className="space-y-6">
            {/* Production Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-3 md:space-y-0">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold">{selectedRecipe?.name}</h2>
                    <p className="text-muted-foreground text-sm md:text-base">
                      Target: {targetWeight}{targetUnit} 
                      (Scale: {(parseFloat(targetWeight) / (originalWeight / (targetUnit === "kg" ? 1000 : 1))).toFixed(2)}x)
                    </p>
                  </div>
                  <div className="hidden md:flex space-x-2">
                    <Button variant="outline" onClick={resetProduction} data-testid="button-reset-production">
                      <RotateCcw className="mr-2" size={16} />
                      Reset
                    </Button>
                    <Button onClick={finishProduction} data-testid="button-finish-production">
                      <CheckCircle className="mr-2" size={16} />
                      Finish
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Overall Progress</span>
                      <span className="text-sm text-muted-foreground">{overallProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={overallProgress} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Accordion Layout */}
            <div className="block md:hidden">
              <Accordion type="multiple" className="space-y-4">
                <AccordionItem value="ingredients" className="border border-border rounded-lg">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <span className="flex items-center">
                        <Utensils className="mr-2" size={20} />
                        Ingredients
                      </span>
                      <div className="flex items-center space-x-2 mr-4">
                        <span className="text-sm text-muted-foreground">
                          {scaledIngredients.filter(ing => ing.completed).length}/{scaledIngredients.length}
                        </span>
                        <Progress value={ingredientProgress} className="h-1 w-16" />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      {scaledIngredients.map((ingredient) => (
                        <div 
                          key={ingredient.ingredientId}
                          className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${
                            ingredient.completed 
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                              : 'bg-background border-border'
                          }`}
                        >
                          <Checkbox
                            checked={ingredient.completed}
                            onCheckedChange={() => toggleIngredientCompletion(ingredient.ingredientId)}
                            data-testid={`checkbox-ingredient-${ingredient.ingredientId}`}
                            className="w-5 h-5"
                          />
                          <div className="flex-1">
                            <div className={`font-medium text-base ${
                              ingredient.completed ? 'line-through text-muted-foreground' : ''
                            }`}>
                              {ingredient.ingredientName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {ingredient.scaledQuantity.toFixed(ingredient.scaledQuantity < 10 ? 1 : 0)} {ingredient.scaledUnit}
                            </div>
                          </div>
                          {ingredient.completed && <CheckCircle className="text-green-600" size={20} />}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                {instructions.length > 0 && (
                  <AccordionItem value="instructions" className="border border-border rounded-lg">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center justify-between w-full">
                        <span className="flex items-center">
                          <Clock className="mr-2" size={20} />
                          Instructions
                        </span>
                        <div className="flex items-center space-x-2 mr-4">
                          <span className="text-sm text-muted-foreground">
                            {instructions.filter(inst => inst.completed).length}/{instructions.length}
                          </span>
                          <Progress value={instructionProgress} className="h-1 w-16" />
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-3">
                        {instructions.map((instruction) => (
                          <div 
                            key={instruction.stepNumber}
                            className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors ${
                              instruction.completed 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                                : 'bg-background border-border'
                            }`}
                          >
                            <Checkbox
                              checked={instruction.completed}
                              onCheckedChange={() => toggleInstructionCompletion(instruction.stepNumber)}
                              data-testid={`checkbox-instruction-${instruction.stepNumber}`}
                              className="w-5 h-5 mt-1"
                            />
                            <div className="flex-1">
                              <div className={`flex items-start space-x-2 ${
                                instruction.completed ? 'line-through text-muted-foreground' : ''
                              }`}>
                                <span className="font-bold text-primary min-w-[2rem] text-base">
                                  {instruction.stepNumber}.
                                </span>
                                <span className="text-base leading-relaxed">{instruction.instruction}</span>
                              </div>
                            </div>
                            {instruction.completed && <CheckCircle className="text-blue-600" size={20} />}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
            
            {/* Desktop Grid Layout */}
            <div className="hidden md:grid md:grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ingredients Checklist */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Utensils className="mr-2" size={20} />
                      Ingredients
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {scaledIngredients.filter(ing => ing.completed).length}/{scaledIngredients.length}
                    </span>
                  </CardTitle>
                  <Progress value={ingredientProgress} className="h-1" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {scaledIngredients.map((ingredient) => (
                    <div 
                      key={ingredient.ingredientId}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                        ingredient.completed 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                          : 'bg-background border-border'
                      }`}
                    >
                      <Checkbox
                        checked={ingredient.completed}
                        onCheckedChange={() => toggleIngredientCompletion(ingredient.ingredientId)}
                        data-testid={`checkbox-ingredient-${ingredient.ingredientId}`}
                      />
                      <div className="flex-1">
                        <div className={`font-medium ${ingredient.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {ingredient.ingredientName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {ingredient.scaledQuantity.toFixed(ingredient.scaledQuantity < 10 ? 1 : 0)} {ingredient.scaledUnit}
                        </div>
                      </div>
                      {ingredient.completed && <CheckCircle className="text-green-600" size={20} />}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Instructions Checklist */}
              {instructions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Clock className="mr-2" size={20} />
                        Instructions
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {instructions.filter(inst => inst.completed).length}/{instructions.length}
                      </span>
                    </CardTitle>
                    <Progress value={instructionProgress} className="h-1" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {instructions.map((instruction) => (
                      <div 
                        key={instruction.stepNumber}
                        className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                          instruction.completed 
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                            : 'bg-background border-border'
                        }`}
                      >
                        <Checkbox
                          checked={instruction.completed}
                          onCheckedChange={() => toggleInstructionCompletion(instruction.stepNumber)}
                          data-testid={`checkbox-instruction-${instruction.stepNumber}`}
                        />
                        <div className="flex-1">
                          <div className={`flex items-start space-x-2 ${instruction.completed ? 'line-through text-muted-foreground' : ''}`}>
                            <span className="font-bold text-primary min-w-[2rem]">
                              {instruction.stepNumber}.
                            </span>
                            <span>{instruction.instruction}</span>
                          </div>
                        </div>
                        {instruction.completed && <CheckCircle className="text-blue-600" size={20} />}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Production Complete Alert */}
            {overallProgress === 100 && (
              <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="text-green-600" size={24} />
                    <div>
                      <h3 className="font-semibold text-green-800 dark:text-green-200">
                        Production Complete!
                      </h3>
                      <p className="text-green-700 dark:text-green-300">
                        All ingredients have been added and all instructions completed.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mobile Sticky Bottom Actions */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50">
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={resetProduction} 
                  className="flex-1 h-12"
                  data-testid="button-reset-production-mobile"
                >
                  <RotateCcw className="mr-2" size={16} />
                  Reset
                </Button>
                <Button 
                  onClick={finishProduction} 
                  className="flex-1 h-12"
                  data-testid="button-finish-production-mobile"
                >
                  <CheckCircle className="mr-2" size={16} />
                  Finish
                </Button>
              </div>
            </div>

            {/* Mobile Bottom Padding */}
            <div className="md:hidden h-20"></div>
          </div>
        )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}