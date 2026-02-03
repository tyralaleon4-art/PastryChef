import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
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
  Factory,
  Download,
  FileText
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PrintableProductionPlan from "@/components/printable-production-plan";
import type { 
  ProductionPlanWithDetails, 
  RecipeWithDetails,
  InsertProductionPlan,
  InsertProductionPlanRecipe,
  ProductionPlanRecipe
} from "@shared/schema";

// Type for individual production plan recipe with details
type ProductionPlanRecipeWithDetails = ProductionPlanRecipe & { 
  recipe: RecipeWithDetails;
};
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
  const [isRecipeProductionDialogOpen, setIsRecipeProductionDialogOpen] = useState(false);
  const [selectedRecipeForProduction, setSelectedRecipeForProduction] = useState<ProductionPlanRecipeWithDetails | null>(null);
  const [completedIngredients, setCompletedIngredients] = useState<Set<string>>(new Set());
  const [completedInstructions, setCompletedInstructions] = useState<Set<number>>(new Set());
  const [exportData, setExportData] = useState<{
    planName: string;
    planDescription?: string;
    recipes: any[];
    ingredientList: any[];
  } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  // Functions for recipe production mode
  const toggleIngredientCompletion = (ingredientId: string) => {
    setCompletedIngredients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientId)) {
        newSet.delete(ingredientId);
      } else {
        newSet.add(ingredientId);
      }
      return newSet;
    });
  };

  const toggleInstructionCompletion = (index: number) => {
    setCompletedInstructions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Calculate production progress for selected recipe
  const calculateRecipeProgress = () => {
    if (!selectedRecipeForProduction) return 0;
    
    const totalIngredients = selectedRecipeForProduction.recipe.recipeIngredients.length;
    const totalInstructions = selectedRecipeForProduction.recipe.instructions?.length || 0;
    const totalSteps = totalIngredients + totalInstructions;
    
    if (totalSteps === 0) return 100;
    
    const completedSteps = completedIngredients.size + completedInstructions.size;
    return Math.round((completedSteps / totalSteps) * 100);
  };

  // Reset production state when opening modal
  const openRecipeProductionModal = (planRecipe: ProductionPlanRecipeWithDetails) => {
    setSelectedRecipeForProduction(planRecipe);
    setCompletedIngredients(new Set());
    setCompletedInstructions(new Set());
    setIsRecipeProductionDialogOpen(true);
  };

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

  // Remove recipe from production plan
  const removeRecipeMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      return apiRequest("DELETE", `/api/production-plan-recipes/${recipeId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-plans"] });
      toast({ title: "Przepis usunięty", description: "Przepis został pomyślnie usunięty z planu." });
    },
    onError: () => {
      toast({ title: "Błąd", description: "Nie udało się usunąć przepisu z planu.", variant: "destructive" });
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

  const handleExportPlan = async (planId: string) => {
    try {
      const response = await fetch(`/api/production-plans/${planId}/export`);
      if (!response.ok) throw new Error("Export failed");
      
      const data = await response.json();
      setExportData(data);
      
      // Wait for render then generate PDF
      setTimeout(() => {
        handlePrint();
      }, 100);
    } catch (error) {
      toast({ 
        title: "Błąd eksportu", 
        description: "Nie udało się wyeksportować planu.", 
        variant: "destructive" 
      });
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: exportData ? `Plan_Produkcji_${exportData.planName}` : 'Plan_Produkcji',
    print: async (printIframe) => {
      try {
        if (!printIframe.contentDocument) {
          throw new Error('Content document not available');
        }
        const element = printIframe.contentDocument.body;
        
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const imgProperties = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const margin = 10;
        const availableWidth = pdfWidth - (margin * 2);
        const imgHeight = (imgProperties.height * availableWidth) / imgProperties.width;

        // Handle multi-page PDF if content is long
        let heightLeft = imgHeight;
        let position = margin;

        pdf.addImage(imgData, 'PNG', margin, position, availableWidth, imgHeight);
        heightLeft -= (pdfHeight - margin * 2);

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, position, availableWidth, imgHeight);
          heightLeft -= (pdfHeight - margin * 2);
        }

        const fileName = exportData 
          ? `Plan_Produkcji_${exportData.planName.replace(/[^a-z0-9]/gi, '_')}.pdf`
          : 'Plan_Produkcji.pdf';
        
        pdf.save(fileName);
        setExportData(null);

        toast({
          title: "PDF pobrany!",
          description: "Plan produkcji został wyeksportowany jako PDF."
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: "Błąd generowania PDF",
          description: "Spróbuj ponownie.",
          variant: "destructive"
        });
      }
    }
  });


  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen md:h-screen flex-col md:flex-row md:overflow-hidden">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        <div className="flex-1 flex flex-col min-h-0">
          <Header 
            title="Plan produkcji" 
            subtitle="Planowanie wielu przepisów i obliczanie zapotrzebowania na surowce"
          />
          
          <main className="flex-1 overflow-y-auto px-4 md:px-6">
            <div className="max-w-7xl mx-auto py-4 md:py-6">
              {/* Plan Selection and Creation */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <ClipboardList className="mr-2" size={20} />
                      Zarządzanie planami
                    </span>
                    <ResponsiveDialog 
                      open={isNewPlanDialogOpen} 
                      onOpenChange={setIsNewPlanDialogOpen}
                      title="Nowy plan produkcji"
                      trigger={
                        <Button data-testid="button-create-plan">
                          <Plus className="mr-2" size={16} />
                          Nowy plan
                        </Button>
                      }
                      footer={
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsNewPlanDialogOpen(false)}>
                            Anuluj
                          </Button>
                          <Button onClick={handleCreatePlan} disabled={createPlanMutation.isPending} data-testid="button-save-plan">
                            {createPlanMutation.isPending ? "Tworzenie..." : "Utwórz"}
                          </Button>
                        </div>
                      }
                      className="max-w-lg"
                    >
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
                      </div>
                    </ResponsiveDialog>
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
                        <div className="flex space-x-2 flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => handleExportPlan(selectedPlan.id)}
                            data-testid="button-export-plan"
                          >
                            <Download className="mr-2" size={16} />
                            Eksportuj
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => archivePlanMutation.mutate(selectedPlan.id)}
                            disabled={archivePlanMutation.isPending}
                            data-testid="button-archive-plan"
                          >
                            <Archive className="mr-2" size={16} />
                            {archivePlanMutation.isPending ? "Archiwizowanie..." : "Archiwizuj"}
                          </Button>
                          <ResponsiveDialog 
                            open={isAddRecipeDialogOpen} 
                            onOpenChange={setIsAddRecipeDialogOpen}
                            title="Dodaj przepis do planu"
                            trigger={
                              <Button data-testid="button-add-recipe">
                                <Plus className="mr-2" size={16} />
                                Dodaj przepis
                              </Button>
                            }
                            footer={
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setIsAddRecipeDialogOpen(false)}>
                                  Anuluj
                                </Button>
                                <Button onClick={handleAddRecipe} disabled={addRecipeMutation.isPending} data-testid="button-save-recipe">
                                  {addRecipeMutation.isPending ? "Dodawanie..." : "Dodaj"}
                                </Button>
                              </div>
                            }
                            className="max-w-lg"
                          >
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="recipe-select">Przepis</Label>
                                <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                                  <SelectTrigger data-testid="select-recipe">
                                    <SelectValue placeholder="Wybierz przepis..." />
                                  </SelectTrigger>
                                  <SelectContent className="z-50">
                                    {recipes.map(recipe => (
                                      <SelectItem key={recipe.id} value={recipe.id}>
                                        {recipe.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="sm:col-span-2">
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
                                    <SelectContent className="z-50">
                                      <SelectItem value="g">g</SelectItem>
                                      <SelectItem value="kg">kg</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </ResponsiveDialog>
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
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openRecipeProductionModal(planRecipe)}
                                    data-testid={`button-start-recipe-production-${planRecipe.id}`}
                                  >
                                    <Factory className="mr-1" size={14} />
                                    Rozpocznij
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeRecipeMutation.mutate(planRecipe.id)}
                                    disabled={removeRecipeMutation.isPending}
                                    data-testid={`button-remove-recipe-${planRecipe.id}`}
                                  >
                                    <Trash2 className="mr-1" size={14} />
                                    {removeRecipeMutation.isPending ? "Usuwanie..." : "Usuń"}
                                  </Button>
                                  <Badge variant={planRecipe.completed ? "default" : "secondary"}>
                                    {planRecipe.completed ? "Ukończone" : "W trakcie"}
                                  </Badge>
                                </div>
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
      
      {/* Individual Recipe Production Dialog */}
      <ResponsiveDialog 
        open={isRecipeProductionDialogOpen} 
        onOpenChange={setIsRecipeProductionDialogOpen}
        title={selectedRecipeForProduction ? 
          `Produkcja: ${selectedRecipeForProduction.recipe.name}` : 
          "Produkcja"
        }
        description={selectedRecipeForProduction ? 
          `Docelowa waga: ${selectedRecipeForProduction.targetWeight} ${selectedRecipeForProduction.targetUnit}` : 
          undefined
        }
        trigger={<></>}
        footer={
          selectedRecipeForProduction && (
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsRecipeProductionDialogOpen(false)}
                data-testid="button-cancel-production"
                className="w-full sm:w-auto"
              >
                Zamknij
              </Button>
              <Button
                onClick={() => {
                  handleToggleRecipeComplete(selectedRecipeForProduction.id, true);
                  setIsRecipeProductionDialogOpen(false);
                  toast({ title: "Produkcja ukończona", description: "Przepis został oznaczony jako ukończony." });
                }}
                data-testid="button-complete-production"
                className="w-full sm:w-auto"
              >
                <CheckCircle className="mr-2" size={16} />
                Ukończ produkcję
              </Button>
            </div>
          )
        }
        className="max-w-4xl"
      >
          
          {selectedRecipeForProduction && (
            <div className="space-y-6 py-4">
              {/* Production Progress */}
              <div className="border-b pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Postęp produkcji</span>
                  <span className="text-sm text-muted-foreground">
                    {calculateRecipeProgress()}%
                  </span>
                </div>
                <Progress value={calculateRecipeProgress()} className="h-2" />
              </div>

              {/* Scaled Ingredients Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Utensils className="mr-2" size={18} />
                    Składniki
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedRecipeForProduction.recipe.recipeIngredients.map((recipeIngredient: any) => {
                    const targetGrams = selectedRecipeForProduction.targetUnit === "kg" ? 
                      Number(selectedRecipeForProduction.targetWeight) * 1000 : 
                      Number(selectedRecipeForProduction.targetWeight);
                    
                    // Calculate original recipe weight
                    const originalWeight = selectedRecipeForProduction.recipe.recipeIngredients.reduce((sum: number, ri: any) => {
                      return sum + convertToGrams(Number(ri.quantity), ri.unit);
                    }, 0);
                    
                    const scaleFactor = originalWeight > 0 ? targetGrams / originalWeight : 1;
                    const scaledQuantity = Number(recipeIngredient.quantity) * scaleFactor;
                    
                    return (
                      <div key={recipeIngredient.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                        <Checkbox
                          checked={completedIngredients.has(recipeIngredient.id)}
                          onCheckedChange={() => toggleIngredientCompletion(recipeIngredient.id)}
                          data-testid={`checkbox-recipe-ingredient-${recipeIngredient.id}`}
                        />
                        <div className="flex-1">
                          <div className="font-medium">
                            {recipeIngredient.ingredient.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {scaledQuantity.toFixed(2)} {recipeIngredient.unit}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Instructions Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2" size={18} />
                    Instrukcje
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(selectedRecipeForProduction.recipe.instructions || []).map((instruction: string, index: number) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                      <Checkbox
                        checked={completedInstructions.has(index)}
                        onCheckedChange={() => toggleInstructionCompletion(index)}
                        data-testid={`checkbox-recipe-instruction-${index}`}
                      />
                      <div className="flex-1">
                        <div className="flex items-start space-x-2">
                          <span className="font-bold text-primary min-w-[2rem]">
                            {index + 1}.
                          </span>
                          <span className="leading-relaxed">{instruction}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsRecipeProductionDialogOpen(false)}
                  data-testid="button-cancel-production"
                >
                  Zamknij
                </Button>
                <Button
                  onClick={() => {
                    // TODO: Mark recipe as completed and close dialog
                    handleToggleRecipeComplete(selectedRecipeForProduction.id, true);
                    setIsRecipeProductionDialogOpen(false);
                    toast({ title: "Produkcja ukończona", description: "Przepis został oznaczony jako ukończony." });
                  }}
                  data-testid="button-complete-production"
                >
                  <CheckCircle className="mr-2" size={16} />
                  Ukończ produkcję
                </Button>
              </div>
            </div>
          )}
      </ResponsiveDialog>

      {/* Hidden printable component for PDF export */}
      {exportData && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <PrintableProductionPlan
            ref={printRef}
            planName={exportData.planName}
            planDescription={exportData.planDescription}
            recipes={exportData.recipes}
            ingredientList={exportData.ingredientList}
          />
        </div>
      )}
    </div>
  );
}