import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ClipboardList, 
  Plus, 
  Scale, 
  CheckCircle, 
  Circle, 
  ChefHat, 
  Trash2,
  Edit,
  Calculator,
  Archive,
  Clock,
  Utensils,
  RotateCcw,
  Factory
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { 
  ProductionPlanWithDetails, 
  RecipeWithDetails,
  InsertProductionPlan,
  InsertProductionPlanRecipe
} from "@shared/schema";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

interface ScaledIngredientRequirement {
  ingredientId: string;
  ingredientName: string;
  totalQuantity: number;
  unit: string;
  completed: boolean;
  recipes: Array<{
    recipeName: string;
    quantity: number;
  }>;
}

interface ProductionRecipeInstruction {
  recipeId: string;
  recipeName: string;
  instruction: string;
  stepNumber: number;
  completed: boolean;
}

export default function ProductionPlan() {
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlanWithDetails | null>(null);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanDescription, setNewPlanDescription] = useState("");
  const [isNewPlanDialogOpen, setIsNewPlanDialogOpen] = useState(false);
  const [isAddRecipeDialogOpen, setIsAddRecipeDialogOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [targetUnit, setTargetUnit] = useState("g");
  const [isProducing, setIsProducing] = useState(false);
  const [productionInstructions, setProductionInstructions] = useState<ProductionRecipeInstruction[]>([]);
  const [scaledIngredients, setScaledIngredients] = useState<ScaledIngredientRequirement[]>([]);

  const { toast } = useToast();

  // Fetch production plans
  const { data: productionPlans = [] } = useQuery<ProductionPlanWithDetails[]>({
    queryKey: ["/api/production-plans"],
  });

  // Fetch recipes for adding to plan
  const { data: recipes = [] } = useQuery<RecipeWithDetails[]>({
    queryKey: ["/api/recipes"],
  });

  // Create new production plan
  const createPlanMutation = useMutation({
    mutationFn: async (planData: InsertProductionPlan) => {
      return apiRequest("POST", "/api/production-plans", planData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-plans"] });
      setNewPlanName("");
      setNewPlanDescription("");
      setIsNewPlanDialogOpen(false);
      toast({ title: "Plan utworzony pomyślnie" });
    },
    onError: () => {
      toast({ title: "Błąd podczas tworzenia planu", variant: "destructive" });
    }
  });

  // Add recipe to plan
  const addRecipeMutation = useMutation({
    mutationFn: async ({ planId, recipeData }: { planId: string, recipeData: InsertProductionPlanRecipe }) => {
      return apiRequest("POST", `/api/production-plans/${planId}/recipes`, recipeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-plans"] });
      setSelectedRecipeId("");
      setTargetWeight("");
      setTargetUnit("g");
      setIsAddRecipeDialogOpen(false);
      toast({ title: "Przepis dodany do planu" });
    },
    onError: () => {
      toast({ title: "Błąd podczas dodawania przepisu", variant: "destructive" });
    }
  });

  // Update recipe progress
  const updateRecipeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<InsertProductionPlanRecipe> }) => {
      return apiRequest("PUT", `/api/production-plan-recipes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-plans"] });
    }
  });

  // Archive production plan
  const archivePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      return apiRequest("PUT", `/api/production-plans/${planId}/archive`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-plans"] });
      setSelectedPlanId("");
      setSelectedPlan(null);
      toast({ title: "Plan został zarchiwizowany" });
    },
    onError: () => {
      toast({ title: "Błąd podczas archiwizacji planu", variant: "destructive" });
    }
  });

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

  // Initialize production mode data when plan changes
  useEffect(() => {
    if (!selectedPlan || !isProducing) {
      setScaledIngredients([]);
      setProductionInstructions([]);
      return;
    }

    // Calculate scaled ingredients
    const ingredientMap = new Map<string, ScaledIngredientRequirement>();

    selectedPlan.productionPlanRecipes.forEach(planRecipe => {
      const recipe = planRecipe.recipe;
      const targetGrams = planRecipe.targetUnit === "kg" ? 
        Number(planRecipe.targetWeight) * 1000 : 
        Number(planRecipe.targetWeight);

      const originalWeight = recipe.recipeIngredients.reduce((sum, ri) => {
        return sum + convertToGrams(Number(ri.quantity), ri.unit);
      }, 0);

      if (originalWeight <= 0) return;

      const scaleFactor = targetGrams / originalWeight;

      recipe.recipeIngredients.forEach(ri => {
        const scaledQty = Number(ri.quantity) * scaleFactor;
        const key = ri.ingredientId;

        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)!;
          existing.totalQuantity += scaledQty;
          existing.recipes.push({
            recipeName: recipe.name,
            quantity: scaledQty
          });
        } else {
          ingredientMap.set(key, {
            ingredientId: ri.ingredientId,
            ingredientName: ri.ingredient.name,
            totalQuantity: scaledQty,
            unit: ri.unit,
            completed: false,
            recipes: [{
              recipeName: recipe.name,
              quantity: scaledQty
            }]
          });
        }
      });
    });

    setScaledIngredients(Array.from(ingredientMap.values()));

    // Calculate production instructions
    const instructions: ProductionRecipeInstruction[] = [];
    selectedPlan.productionPlanRecipes.forEach(planRecipe => {
      const recipe = planRecipe.recipe;
      if (recipe.instructions && recipe.instructions.length > 0) {
        recipe.instructions.forEach((instruction, index) => {
          instructions.push({
            recipeId: recipe.id,
            recipeName: recipe.name,
            instruction,
            stepNumber: index + 1,
            completed: false
          });
        });
      }
    });

    setProductionInstructions(instructions);
  }, [selectedPlan, isProducing]);

  // Calculate aggregate ingredient requirements for planning mode
  const aggregateIngredients = useMemo((): ScaledIngredientRequirement[] => {
    if (!selectedPlan) return [];

    const ingredientMap = new Map<string, ScaledIngredientRequirement>();

    selectedPlan.productionPlanRecipes.forEach(planRecipe => {
      const recipe = planRecipe.recipe;
      const targetGrams = planRecipe.targetUnit === "kg" ? 
        Number(planRecipe.targetWeight) * 1000 : 
        Number(planRecipe.targetWeight);

      // Calculate original recipe weight
      const originalWeight = recipe.recipeIngredients.reduce((sum, ri) => {
        return sum + convertToGrams(Number(ri.quantity), ri.unit);
      }, 0);

      if (originalWeight <= 0) return;

      const scaleFactor = targetGrams / originalWeight;

      recipe.recipeIngredients.forEach(ri => {
        const scaledQty = Number(ri.quantity) * scaleFactor;
        const key = ri.ingredientId;

        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)!;
          existing.totalQuantity += scaledQty;
          existing.recipes.push({
            recipeName: recipe.name,
            quantity: scaledQty
          });
        } else {
          ingredientMap.set(key, {
            ingredientId: ri.ingredientId,
            ingredientName: ri.ingredient.name,
            totalQuantity: scaledQty,
            unit: ri.unit,
            completed: false,
            recipes: [{
              recipeName: recipe.name,
              quantity: scaledQty
            }]
          });
        }
      });
    });

    return Array.from(ingredientMap.values());
  }, [selectedPlan]);

  // Update selected plan when planId changes
  useEffect(() => {
    if (selectedPlanId) {
      const plan = productionPlans.find(p => p.id === selectedPlanId);
      setSelectedPlan(plan || null);
    } else {
      setSelectedPlan(null);
    }
  }, [selectedPlanId, productionPlans]);

  const handleCreatePlan = () => {
    if (!newPlanName.trim()) {
      toast({ title: "Nazwa planu jest wymagana", variant: "destructive" });
      return;
    }

    createPlanMutation.mutate({
      name: newPlanName,
      description: newPlanDescription,
      status: "active"
    });
  };

  const handleAddRecipe = () => {
    if (!selectedRecipeId || !targetWeight || !selectedPlanId) {
      toast({ title: "Wypełnij wszystkie pola", variant: "destructive" });
      return;
    }

    addRecipeMutation.mutate({
      planId: selectedPlanId,
      recipeData: {
        planId: selectedPlanId,
        recipeId: selectedRecipeId,
        targetWeight: targetWeight,
        targetUnit,
        completed: false,
        completedIngredients: [],
        completedInstructions: []
      }
    });
  };

  const handleToggleRecipeComplete = (planRecipeId: string, completed: boolean) => {
    updateRecipeMutation.mutate({
      id: planRecipeId,
      data: { completed }
    });
  };

  // Production mode functions
  const startProduction = () => {
    setIsProducing(true);
  };

  const resetProduction = () => {
    setScaledIngredients(prev => prev.map(ing => ({ ...ing, completed: false })));
    setProductionInstructions(prev => prev.map(inst => ({ ...inst, completed: false })));
  };

  const finishProduction = () => {
    setIsProducing(false);
    setScaledIngredients([]);
    setProductionInstructions([]);
  };

  const toggleIngredientCompletion = (ingredientId: string) => {
    setScaledIngredients(prev => 
      prev.map(ing => 
        ing.ingredientId === ingredientId 
          ? { ...ing, completed: !ing.completed }
          : ing
      )
    );
  };

  const toggleInstructionCompletion = (recipeId: string, stepNumber: number) => {
    setProductionInstructions(prev =>
      prev.map(inst =>
        inst.recipeId === recipeId && inst.stepNumber === stepNumber
          ? { ...inst, completed: !inst.completed }
          : inst
      )
    );
  };

  // Calculate progress for production mode
  const ingredientProgress = scaledIngredients.length > 0 
    ? (scaledIngredients.filter(ing => ing.completed).length / scaledIngredients.length) * 100 
    : 0;
  
  const instructionProgress = productionInstructions.length > 0
    ? (productionInstructions.filter(inst => inst.completed).length / productionInstructions.length) * 100
    : 0;

  const overallProgress = scaledIngredients.length > 0 && productionInstructions.length > 0
    ? (ingredientProgress + instructionProgress) / 2
    : scaledIngredients.length > 0 ? ingredientProgress : instructionProgress;

  const canStartProduction = selectedPlan && selectedPlan.productionPlanRecipes.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title="Plan produkcji" 
            subtitle="Planowanie wielu przepisów i obliczanie zapotrzebowania na surowce"
          />
          
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6">
              {/* Plan Selection and Creation */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <ClipboardList className="mr-2" size={20} />
                      Zarządzanie planami
                    </span>
                    <Dialog open={isNewPlanDialogOpen} onOpenChange={setIsNewPlanDialogOpen}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-create-plan">
                          <Plus className="mr-2" size={16} />
                          Nowy plan
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Nowy plan produkcji</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="plan-name">Nazwa planu</Label>
                            <Input
                              id="plan-name"
                              value={newPlanName}
                              onChange={(e) => setNewPlanName(e.target.value)}
                              placeholder="Wprowadź nazwę planu"
                              data-testid="input-plan-name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="plan-description">Opis (opcjonalny)</Label>
                            <Textarea
                              id="plan-description"
                              value={newPlanDescription}
                              onChange={(e) => setNewPlanDescription(e.target.value)}
                              placeholder="Wprowadź opis planu"
                              data-testid="input-plan-description"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsNewPlanDialogOpen(false)}>
                              Anuluj
                            </Button>
                            <Button onClick={handleCreatePlan} disabled={createPlanMutation.isPending} data-testid="button-save-plan">
                              {createPlanMutation.isPending ? "Tworzenie..." : "Utwórz"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="plan-select">Wybierz plan produkcji</Label>
                      <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                        <SelectTrigger data-testid="select-plan">
                          <SelectValue placeholder="Wybierz plan..." />
                        </SelectTrigger>
                        <SelectContent>
                          {productionPlans.map(plan => (
                            <SelectItem key={plan.id} value={plan.id}>
                              <div>
                                <div className="font-medium">{plan.name}</div>
                                {plan.description && (
                                  <div className="text-sm text-muted-foreground">{plan.description}</div>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Plan Details */}
              {selectedPlan && (
                <div className="space-y-6">
                  {!isProducing ? (
                    /* Planning Mode */
                    <>
                      {/* Plan Header */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div>
                              <h2 className="text-xl font-bold" data-testid="text-plan-name">{selectedPlan.name}</h2>
                              {selectedPlan.description && (
                                <p className="text-muted-foreground mt-1">{selectedPlan.description}</p>
                              )}
                            </div>
                            <Badge variant={selectedPlan.status === "active" ? "default" : "secondary"}>
                              {selectedPlan.status}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Liczba przepisów: {selectedPlan.productionPlanRecipes.length}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Ukończone: {selectedPlan.productionPlanRecipes.filter(r => r.completed).length}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              {canStartProduction && (
                                <Button 
                                  onClick={startProduction}
                                  data-testid="button-start-production-plan"
                                >
                                  <Factory className="mr-2" size={16} />
                                  Rozpocznij produkcję
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                onClick={() => archivePlanMutation.mutate(selectedPlan.id)}
                                disabled={archivePlanMutation.isPending}
                                data-testid="button-archive-plan"
                              >
                                <Archive className="mr-2" size={16} />
                                {archivePlanMutation.isPending ? "Archiwizowanie..." : "Archiwizuj"}
                              </Button>
                          <Dialog open={isAddRecipeDialogOpen} onOpenChange={setIsAddRecipeDialogOpen}>
                            <DialogTrigger asChild>
                              <Button data-testid="button-add-recipe">
                                <Plus className="mr-2" size={16} />
                                Dodaj przepis
                              </Button>
                            </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Dodaj przepis do planu</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="recipe-select">Przepis</Label>
                                <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                                  <SelectTrigger data-testid="select-recipe">
                                    <SelectValue placeholder="Wybierz przepis..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {recipes.map(recipe => (
                                      <SelectItem key={recipe.id} value={recipe.id}>
                                        {recipe.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-2">
                                  <Label htmlFor="target-weight">Docelowa waga</Label>
                                  <Input
                                    id="target-weight"
                                    type="number"
                                    value={targetWeight}
                                    onChange={(e) => setTargetWeight(e.target.value)}
                                    placeholder="0"
                                    data-testid="input-target-weight"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="target-unit">Jednostka</Label>
                                  <Select value={targetUnit} onValueChange={setTargetUnit}>
                                    <SelectTrigger data-testid="select-unit">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="g">g</SelectItem>
                                      <SelectItem value="kg">kg</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setIsAddRecipeDialogOpen(false)}>
                                  Anuluj
                                </Button>
                                <Button onClick={handleAddRecipe} disabled={addRecipeMutation.isPending} data-testid="button-save-recipe">
                                  {addRecipeMutation.isPending ? "Dodawanie..." : "Dodaj"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                      {/* Recipes in Plan */}
                      {selectedPlan.productionPlanRecipes.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <ChefHat className="mr-2" size={20} />
                              Przepisy w planie
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {selectedPlan.productionPlanRecipes.map((planRecipe) => (
                                <div key={planRecipe.id} className="border rounded-lg p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <Checkbox
                                        checked={Boolean(planRecipe.completed)}
                                        onCheckedChange={(checked) => 
                                          handleToggleRecipeComplete(planRecipe.id, Boolean(checked))
                                        }
                                        data-testid={`checkbox-recipe-${planRecipe.id}`}
                                      />
                                      <div>
                                        <h4 className="font-medium" data-testid={`text-recipe-name-${planRecipe.id}`}>
                                          {planRecipe.recipe.name}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                          Docelowa waga: {planRecipe.targetWeight} {planRecipe.targetUnit}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge variant={planRecipe.completed ? "default" : "secondary"}>
                                      {planRecipe.completed ? "Ukończone" : "W trakcie"}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Aggregate Ingredient Requirements */}
                      {aggregateIngredients.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <Calculator className="mr-2" size={20} />
                              Łączne zapotrzebowanie na surowce
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {aggregateIngredients.map((ingredient) => (
                                <div key={ingredient.ingredientId} className="border rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-3">
                                      <Checkbox
                                        checked={ingredient.completed}
                                        onCheckedChange={(checked) => {
                                          // Update ingredient completion status
                                          ingredient.completed = Boolean(checked);
                                        }}
                                        data-testid={`checkbox-ingredient-${ingredient.ingredientId}`}
                                      />
                                      <div>
                                        <h4 className="font-medium" data-testid={`text-ingredient-name-${ingredient.ingredientId}`}>
                                          {ingredient.ingredientName}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                          Łącznie: <strong>{ingredient.totalQuantity.toFixed(2)} {ingredient.unit}</strong>
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="ml-6">
                                    <p className="text-xs text-muted-foreground mb-1">Szczegóły według przepisów:</p>
                                    {ingredient.recipes.map((recipeDetail, index) => (
                                      <p key={index} className="text-xs text-muted-foreground">
                                        • {recipeDetail.recipeName}: {recipeDetail.quantity.toFixed(2)} {ingredient.unit}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  ) : (
                    /* Production Mode */
                    <div className="space-y-6">
                      {/* Production Header */}
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-3 md:space-y-0">
                            <div>
                              <h2 className="text-xl md:text-2xl font-bold">{selectedPlan.name}</h2>
                              <p className="text-muted-foreground text-sm md:text-base">
                                Produkcja: {selectedPlan.productionPlanRecipes.length} przepisów
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="outline" onClick={resetProduction} data-testid="button-reset-production-plan">
                                <RotateCcw className="mr-2" size={16} />
                                Reset
                              </Button>
                              <Button onClick={finishProduction} data-testid="button-finish-production-plan">
                                <CheckCircle className="mr-2" size={16} />
                                Zakończ
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">Ogólny postęp</span>
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
                                  Składniki
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
                                      data-testid={`checkbox-production-ingredient-${ingredient.ingredientId}`}
                                      className="w-5 h-5"
                                    />
                                    <div className="flex-1">
                                      <div className={`font-medium text-base ${
                                        ingredient.completed ? 'line-through text-muted-foreground' : ''
                                      }`}>
                                        {ingredient.ingredientName}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {ingredient.totalQuantity.toFixed(2)} {ingredient.unit}
                                      </div>
                                    </div>
                                    {ingredient.completed && <CheckCircle className="text-green-600" size={20} />}
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                          
                          {productionInstructions.length > 0 && (
                            <AccordionItem value="instructions" className="border border-border rounded-lg">
                              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                <div className="flex items-center justify-between w-full">
                                  <span className="flex items-center">
                                    <Clock className="mr-2" size={20} />
                                    Instrukcje
                                  </span>
                                  <div className="flex items-center space-x-2 mr-4">
                                    <span className="text-sm text-muted-foreground">
                                      {productionInstructions.filter(inst => inst.completed).length}/{productionInstructions.length}
                                    </span>
                                    <Progress value={instructionProgress} className="h-1 w-16" />
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4">
                                <div className="space-y-3">
                                  {productionInstructions.map((instruction) => (
                                    <div 
                                      key={`${instruction.recipeId}-${instruction.stepNumber}`}
                                      className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors ${
                                        instruction.completed 
                                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                                          : 'bg-background border-border'
                                      }`}
                                    >
                                      <Checkbox
                                        checked={instruction.completed}
                                        onCheckedChange={() => toggleInstructionCompletion(instruction.recipeId, instruction.stepNumber)}
                                        data-testid={`checkbox-production-instruction-${instruction.recipeId}-${instruction.stepNumber}`}
                                        className="w-5 h-5 mt-1"
                                      />
                                      <div className="flex-1">
                                        <div className={`flex items-start space-x-2 ${
                                          instruction.completed ? 'line-through text-muted-foreground' : ''
                                        }`}>
                                          <span className="font-bold text-primary min-w-[2rem] text-base">
                                            {instruction.stepNumber}.
                                          </span>
                                          <div>
                                            <div className="text-xs text-muted-foreground mb-1">{instruction.recipeName}</div>
                                            <span className="text-base leading-relaxed">{instruction.instruction}</span>
                                          </div>
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
                                Składniki
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
                                  data-testid={`checkbox-production-ingredient-${ingredient.ingredientId}`}
                                />
                                <div className="flex-1">
                                  <div className={`font-medium ${ingredient.completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {ingredient.ingredientName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {ingredient.totalQuantity.toFixed(2)} {ingredient.unit}
                                  </div>
                                </div>
                                {ingredient.completed && <CheckCircle className="text-green-600" size={20} />}
                              </div>
                            ))}
                          </CardContent>
                        </Card>

                        {/* Instructions Checklist */}
                        {productionInstructions.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center">
                                  <Clock className="mr-2" size={20} />
                                  Instrukcje
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {productionInstructions.filter(inst => inst.completed).length}/{productionInstructions.length}
                                </span>
                              </CardTitle>
                              <Progress value={instructionProgress} className="h-1" />
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {productionInstructions.map((instruction) => (
                                <div 
                                  key={`${instruction.recipeId}-${instruction.stepNumber}`}
                                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                                    instruction.completed 
                                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                                      : 'bg-background border-border'
                                  }`}
                                >
                                  <Checkbox
                                    checked={instruction.completed}
                                    onCheckedChange={() => toggleInstructionCompletion(instruction.recipeId, instruction.stepNumber)}
                                    data-testid={`checkbox-production-instruction-${instruction.recipeId}-${instruction.stepNumber}`}
                                  />
                                  <div className="flex-1">
                                    <div className={`flex items-start space-x-2 ${
                                      instruction.completed ? 'line-through text-muted-foreground' : ''
                                    }`}>
                                      <span className="font-bold text-primary min-w-[2rem]">
                                        {instruction.stepNumber}.
                                      </span>
                                      <div>
                                        <div className="text-xs text-muted-foreground mb-1">{instruction.recipeName}</div>
                                        <span className="leading-relaxed">{instruction.instruction}</span>
                                      </div>
                                    </div>
                                  </div>
                                  {instruction.completed && <CheckCircle className="text-blue-600" size={20} />}
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {!selectedPlan && (
                <Card>
                  <CardContent className="text-center py-8">
                    <ClipboardList className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <h3 className="text-lg font-medium mb-2">Brak wybranego planu</h3>
                    <p className="text-muted-foreground mb-4">
                      Wybierz istniejący plan produkcji lub utwórz nowy, aby zacząć planowanie.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}