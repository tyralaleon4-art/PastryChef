import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calculator, Copy, FileText, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculateRecipeWeight, scaleQuantity, formatQuantity } from "@shared/unitConversion";
import PrintableRecipe from "./printable-recipe";
import type { RecipeWithDetails, Ingredient } from "@shared/schema";

interface RecipeScaleDialogProps {
  trigger?: React.ReactNode;
  recipe?: RecipeWithDetails; // Pre-selected recipe
}

interface ScaledIngredient {
  ingredientId: string;
  ingredientName: string;
  originalQuantity: number;
  originalUnit: string;
  scaledQuantity: number;
  scaledUnit: string;
  cost?: number;
}

export default function RecipeScaleDialog({ trigger, recipe }: RecipeScaleDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState(recipe?.id || "");
  const [targetWeight, setTargetWeight] = useState("");
  const [targetUnit, setTargetUnit] = useState("g");
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: recipes = [] } = useQuery<RecipeWithDetails[]>({
    queryKey: ["/api/recipes"],
  });

  const { data: ingredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  // Get the selected recipe
  const selectedRecipe = selectedRecipeId 
    ? recipes.find(r => r.id === selectedRecipeId) 
    : null;

  // Calculate original weight and scaled ingredients
  const { originalWeight, scaledIngredients, missingData, canScale } = useMemo(() => {
    if (!selectedRecipe || !targetWeight) {
      return { 
        originalWeight: 0, 
        scaledIngredients: [], 
        missingData: [], 
        canScale: false 
      };
    }

    const targetGrams = targetUnit === "kg" 
      ? parseFloat(targetWeight) * 1000 
      : parseFloat(targetWeight);

    if (isNaN(targetGrams) || targetGrams <= 0) {
      return { 
        originalWeight: 0, 
        scaledIngredients: [], 
        missingData: [], 
        canScale: false 
      };
    }

    // Calculate original recipe weight
    const weightResult = calculateRecipeWeight(
      selectedRecipe.recipeIngredients,
      ingredients,
      selectedRecipe.totalYieldGrams || undefined
    );

    if (weightResult.totalGrams <= 0) {
      return { 
        originalWeight: 0, 
        scaledIngredients: [], 
        missingData: weightResult.missingData, 
        canScale: false 
      };
    }

    const scaleFactor = targetGrams / weightResult.totalGrams;

    // Create scaled ingredients
    const scaled: ScaledIngredient[] = selectedRecipe.recipeIngredients.map(ri => {
      const ingredient = ingredients.find(ing => ing.id === ri.ingredientId);
      const originalQty = parseFloat(ri.quantity.toString());
      const scaledQty = scaleQuantity(originalQty, ri.unit, scaleFactor);

      return {
        ingredientId: ri.ingredientId,
        ingredientName: ingredient?.name || "Unknown",
        originalQuantity: originalQty,
        originalUnit: ri.unit,
        scaledQuantity: scaledQty,
        scaledUnit: ri.unit,
        cost: ingredient?.costPerUnit ? parseFloat(ingredient.costPerUnit) : undefined,
      };
    });

    return {
      originalWeight: weightResult.totalGrams,
      scaledIngredients: scaled,
      missingData: weightResult.missingData,
      canScale: true
    };
  }, [selectedRecipe, ingredients, targetWeight, targetUnit]);

  const handleCopyToClipboard = () => {
    if (!selectedRecipe || !canScale) return;

    const text = [
      `Recipe: ${selectedRecipe.name}`,
      `Target Weight: ${targetWeight}${targetUnit}`,
      `Original Weight: ${Math.round(originalWeight)}g`,
      `Scale Factor: ${(parseFloat(targetWeight) / (originalWeight / (targetUnit === "kg" ? 1000 : 1))).toFixed(3)}x`,
      "",
      "Scaled Ingredients:",
      ...scaledIngredients.map(si => 
        `• ${formatQuantity(si.scaledQuantity, si.scaledUnit)} ${si.scaledUnit} ${si.ingredientName}`
      )
    ].join("\n");

    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Scaled recipe has been copied to your clipboard."
      });
    });
  };

  const totalCost = useMemo(() => {
    if (!canScale) return 0;
    return scaledIngredients.reduce((sum, si) => {
      if (!si.cost) return sum;
      // Convert scaled quantity to ingredient's base unit for cost calculation
      const ingredient = ingredients.find(ing => ing.id === si.ingredientId);
      if (!ingredient) return sum;
      
      // Simple cost calculation - this could be enhanced with unit conversion
      const costPerUnit = si.cost;
      return sum + (si.scaledQuantity * costPerUnit / 1000); // Assuming cost is per kg
    }, 0);
  }, [scaledIngredients, ingredients, canScale]);

  const scaleFactor = useMemo(() => {
    if (!canScale || !targetWeight || originalWeight <= 0) return 0;
    const targetGrams = targetUnit === "kg" ? parseFloat(targetWeight) * 1000 : parseFloat(targetWeight);
    return targetGrams / originalWeight;
  }, [canScale, targetWeight, targetUnit, originalWeight]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: selectedRecipe ? `${selectedRecipe.name} - Scaled Recipe` : 'Scaled Recipe',
    print: async (printIframe) => {
      // Custom PDF download function instead of print dialog
      try {
        if (!printIframe.contentDocument) {
          throw new Error('Content document not available');
        }
        const element = printIframe.contentDocument.body;
        
        // Generate canvas from HTML
        const canvas = await html2canvas(element, {
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });

        // Create PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        // Calculate dimensions to fit A4 page
        const imgProperties = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width;
        
        // Add margins
        const margin = 10;
        const availableWidth = pdfWidth - (margin * 2);
        const availableHeight = (imgProperties.height * availableWidth) / imgProperties.width;

        // Add image to PDF with margins
        pdf.addImage(imgData, 'PNG', margin, margin, availableWidth, availableHeight);

        // Download the PDF
        const fileName = selectedRecipe 
          ? `${selectedRecipe.name.replace(/[^a-z0-9]/gi, '_')}_Scaled_Recipe.pdf`
          : 'Scaled_Recipe.pdf';
        
        pdf.save(fileName);

        toast({
          title: "PDF Downloaded",
          description: "The scaled recipe has been downloaded as a PDF file."
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: "Download Failed",
          description: "There was an error generating the PDF. Please try again.",
          variant: "destructive"
        });
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" data-testid="button-recipe-scale">
            <Calculator size={16} className="mr-2" />
            Scale Recipe
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-recipe-scale">
        <DialogHeader>
          <DialogTitle>Recipe Scale Calculator</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Recipe Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recipe-select">Select Recipe</Label>
              <Select
                value={selectedRecipeId}
                onValueChange={setSelectedRecipeId}
                data-testid="select-recipe-for-scaling"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a recipe to scale" />
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
              <Label htmlFor="target-weight">Target Weight</Label>
              <div className="flex space-x-2">
                <Input
                  id="target-weight"
                  type="number"
                  step="0.1"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  placeholder="500"
                  data-testid="input-target-weight"
                />
                <Select value={targetUnit} onValueChange={setTargetUnit} data-testid="select-target-unit">
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
          </div>

          {/* Recipe Info */}
          {selectedRecipe && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{selectedRecipe.name}</h3>
                  {selectedRecipe.description && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedRecipe.description}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    {selectedRecipe.isVegan && <Badge variant="secondary">V</Badge>}
                    {selectedRecipe.isGlutenFree && <Badge variant="secondary">GF</Badge>}
                    {selectedRecipe.isLactoseFree && <Badge variant="secondary">LF</Badge>}
                  </div>
                </div>
                {canScale && (
                  <div className="text-right text-sm">
                    <div>Original: <strong>{Math.round(originalWeight)}g</strong></div>
                    {targetWeight && (
                      <div className="text-primary">
                        Scale: <strong>
                          {(parseFloat(targetWeight) / (originalWeight / (targetUnit === "kg" ? 1000 : 1))).toFixed(2)}x
                        </strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Missing Data Warnings */}
          {missingData.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="text-yellow-600 dark:text-yellow-400 mt-0.5" size={16} />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Missing conversion data - using fallback calculations
                  </p>
                  <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 ml-2">
                    {missingData.slice(0, 3).map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                    {missingData.length > 3 && <li>• ... and {missingData.length - 3} more</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Scaled Ingredients Table */}
          {canScale && scaledIngredients.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Scaled Ingredients</h4>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyToClipboard}
                    data-testid="button-copy-scaled-recipe"
                  >
                    <Copy size={14} className="mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    data-testid="button-print-scaled-recipe"
                  >
                    <FileText size={14} className="mr-1" />
                    Download PDF
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3">Ingredient</th>
                      <th className="text-right p-3">Original</th>
                      <th className="text-right p-3">Scaled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scaledIngredients.map((si, index) => (
                      <tr key={si.ingredientId} className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}>
                        <td className="p-3 font-medium">{si.ingredientName}</td>
                        <td className="p-3 text-right text-muted-foreground">
                          {formatQuantity(si.originalQuantity, si.originalUnit)} {si.originalUnit}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatQuantity(si.scaledQuantity, si.scaledUnit)} {si.scaledUnit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalCost > 0 && (
                <div className="mt-3 text-right text-sm">
                  <span className="text-muted-foreground">Estimated cost: </span>
                  <span className="font-semibold">{totalCost.toFixed(2)} PLN</span>
                </div>
              )}
            </div>
          )}

          {/* No recipe selected or scaling not possible */}
          {(!selectedRecipe || !canScale) && selectedRecipeId && targetWeight && (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="mx-auto mb-2" size={48} />
              <p>Unable to calculate scaling for this recipe.</p>
              <p className="text-sm">Please check the ingredient data or add a total yield weight to the recipe.</p>
            </div>
          )}
        </div>

        {/* Hidden printable component */}
        {canScale && selectedRecipe && (
          <div style={{ display: 'none' }}>
            <PrintableRecipe
              ref={printRef}
              recipe={selectedRecipe}
              targetWeight={targetWeight}
              targetUnit={targetUnit}
              originalWeight={originalWeight}
              scaledIngredients={scaledIngredients}
              scaleFactor={scaleFactor}
              totalCost={totalCost > 0 ? totalCost : undefined}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}