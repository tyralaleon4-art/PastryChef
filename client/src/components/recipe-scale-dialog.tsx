import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calculator, Copy, FileText, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { calculateRecipeWeight, scaleQuantity, formatQuantity } from "@shared/unitConversion";
import PrintableRecipe from "./printable-recipe";
import type { RecipeWithDetails, Ingredient } from "@shared/schema";
import { BRANDING } from "@/config/branding";

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
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const isPolish = user?.language?.toLowerCase().startsWith("pl") ?? false;
  const language = isPolish ? "pl" : "en";
  const author = user?.displayName || user?.username || "";
  const messages = isPolish ? {
    dialogTitle: "Kalkulator skalowania receptury",
    dialogDescription: "Wybierz recepturę i docelową wagę, aby przeliczyć ilości składników.",
    scaleRecipe: "Skaluj recepturę",
    selectRecipe: "Wybierz recepturę",
    chooseRecipe: "Wybierz recepturę do przeskalowania",
    targetWeight: "Docelowa waga",
    originalWeight: "Waga początkowa:",
    scale: "Skala:",
    vegan: "Wegańskie",
    glutenFree: "Bez glutenu",
    lactoseFree: "Bez laktozy",
    missingConversionData: "Brak danych przeliczeniowych — użyto obliczeń zastępczych",
    additionalMissingData: (count: number) => `... i ${count} więcej`,
    scaledIngredients: "Przeskalowane składniki",
    copy: "Kopiuj",
    downloadPdf: "Pobierz PDF",
    ingredient: "Składnik",
    original: "Początkowo",
    scaled: "Po przeskalowaniu",
    percentage: "Procent",
    estimatedCost: "Szacowany koszt:",
    unableToCalculate: "Nie można obliczyć skalowania tej receptury.",
    unableToCalculateHint: "Sprawdź dane składników lub dodaj do receptury całkowitą wagę wydajności.",
    unknownIngredient: "Nieznany składnik",
    recipeClipboardLabel: "Receptura",
    targetWeightClipboardLabel: "Docelowa waga",
    originalWeightClipboardLabel: "Waga początkowa",
    scaleFactorClipboardLabel: "Współczynnik skalowania",
    scaledIngredientsClipboardLabel: "Przeskalowane składniki",
    copiedTitle: "Skopiowano do schowka",
    copiedDescription: "Przeskalowana receptura została skopiowana do schowka.",
    copyFailedTitle: "Kopiowanie nie powiodło się",
    copyFailedDescription: "Nie udało się skopiować przeskalowanej receptury do schowka.",
    pdfDownloadedTitle: "Pobrano PDF",
    pdfDownloadedDescription: "Przeskalowana receptura została pobrana jako plik PDF.",
    downloadFailedTitle: "Pobieranie nie powiodło się",
    downloadFailedDescription: "Wystąpił błąd podczas generowania PDF. Spróbuj ponownie.",
    scaledRecipe: "Przeskalowana receptura",
  } : {
    dialogTitle: "Recipe Scale Calculator",
    dialogDescription: "Select a recipe and target weight to recalculate ingredient quantities.",
    scaleRecipe: "Scale Recipe",
    selectRecipe: "Select Recipe",
    chooseRecipe: "Choose a recipe to scale",
    targetWeight: "Target Weight",
    originalWeight: "Original:",
    scale: "Scale:",
    vegan: "Vegan",
    glutenFree: "Gluten-free",
    lactoseFree: "Lactose-free",
    missingConversionData: "Missing conversion data — using fallback calculations",
    additionalMissingData: (count: number) => `... and ${count} more`,
    scaledIngredients: "Scaled Ingredients",
    copy: "Copy",
    downloadPdf: "Download PDF",
    ingredient: "Ingredient",
    original: "Original",
    scaled: "Scaled",
    percentage: "Percentage",
    estimatedCost: "Estimated cost:",
    unableToCalculate: "Unable to calculate scaling for this recipe.",
    unableToCalculateHint: "Please check the ingredient data or add a total yield weight to the recipe.",
    unknownIngredient: "Unknown ingredient",
    recipeClipboardLabel: "Recipe",
    targetWeightClipboardLabel: "Target Weight",
    originalWeightClipboardLabel: "Original Weight",
    scaleFactorClipboardLabel: "Scale Factor",
    scaledIngredientsClipboardLabel: "Scaled Ingredients",
    copiedTitle: "Copied to clipboard",
    copiedDescription: "Scaled recipe has been copied to your clipboard.",
    copyFailedTitle: "Copy Failed",
    copyFailedDescription: "Unable to copy the scaled recipe to your clipboard.",
    pdfDownloadedTitle: "PDF Downloaded",
    pdfDownloadedDescription: "The scaled recipe has been downloaded as a PDF file.",
    downloadFailedTitle: "Download Failed",
    downloadFailedDescription: "There was an error generating the PDF. Please try again.",
    scaledRecipe: "Scaled Recipe",
  };

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
        ingredientName: ingredient?.name || messages.unknownIngredient,
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
  }, [selectedRecipe, ingredients, targetWeight, targetUnit, messages.unknownIngredient]);

  const handleCopyToClipboard = () => {
    if (!selectedRecipe || !canScale) return;

    const clipboardText = [
      `${messages.recipeClipboardLabel}: ${selectedRecipe.name}`,
      `${messages.targetWeightClipboardLabel}: ${targetWeight}${targetUnit}`,
      `${messages.originalWeightClipboardLabel}: ${Math.round(originalWeight)}g`,
      `${messages.scaleFactorClipboardLabel}: ${(parseFloat(targetWeight) / (originalWeight / (targetUnit === "kg" ? 1000 : 1))).toFixed(3)}x`,
      "",
      `${messages.scaledIngredientsClipboardLabel}:`,
      ...scaledIngredients.map(si => 
        `• ${formatQuantity(si.scaledQuantity, si.scaledUnit)} ${si.scaledUnit} ${si.ingredientName}`
      )
    ].join("\n");

    navigator.clipboard.writeText(clipboardText)
      .then(() => {
        toast({
          title: messages.copiedTitle,
          description: messages.copiedDescription,
        });
      })
      .catch(() => {
        toast({
          title: messages.copyFailedTitle,
          description: messages.copyFailedDescription,
          variant: "destructive",
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

  // Calculate ingredient percentages based on total scaled weight
  const ingredientsWithPercentages = useMemo(() => {
    if (!canScale || scaledIngredients.length === 0) return [];
    
    const totalScaledWeight = scaledIngredients.reduce((sum, si) => {
      // Convert to grams for percentage calculation
      const weight = si.scaledUnit === 'kg' ? si.scaledQuantity * 1000 : 
                     si.scaledUnit === 'l' ? si.scaledQuantity * 1000 : 
                     si.scaledUnit === 'ml' ? si.scaledQuantity : 
                     si.scaledQuantity;
      return sum + weight;
    }, 0);
    
    return scaledIngredients.map(si => {
      const weight = si.scaledUnit === 'kg' ? si.scaledQuantity * 1000 : 
                     si.scaledUnit === 'l' ? si.scaledQuantity * 1000 : 
                     si.scaledUnit === 'ml' ? si.scaledQuantity : 
                     si.scaledQuantity;
      const percentage = totalScaledWeight > 0 ? (weight / totalScaledWeight * 100) : 0;
      return { ...si, percentage };
    });
  }, [scaledIngredients, canScale]);

  const documentTitle = selectedRecipe
    ? `${selectedRecipe.name} - ${messages.scaledRecipe} - ${BRANDING.productName}`
    : `${messages.scaledRecipe} - ${BRANDING.productName}`;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle,
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
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        // Split the rendered canvas into A4-sized slices so content below the
        // first page is retained rather than clipped.
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const availableWidth = pdfWidth - (margin * 2);
        const availableHeight = pdfHeight - (margin * 2);
        const canvasPixelsPerPage = Math.floor((availableHeight * canvas.width) / availableWidth);

        for (let sourceY = 0; sourceY < canvas.height; sourceY += canvasPixelsPerPage) {
          const sliceHeight = Math.min(canvasPixelsPerPage, canvas.height - sourceY);
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = sliceHeight;
          const context = pageCanvas.getContext("2d");
          if (!context) {
            throw new Error("Unable to create PDF page");
          }
          context.drawImage(
            canvas,
            0, sourceY, canvas.width, sliceHeight,
            0, 0, canvas.width, sliceHeight,
          );

          if (sourceY > 0) pdf.addPage();
          pdf.addImage(
            pageCanvas.toDataURL("image/jpeg", 0.88),
            "JPEG",
            margin,
            margin,
            availableWidth,
            (sliceHeight * availableWidth) / canvas.width,
            undefined,
            "FAST",
          );
        }

        // Download the PDF
        const fileName = `${documentTitle.replace(/[^a-z0-9]+/gi, "_")}.pdf`;
        
        pdf.save(fileName);

        toast({
          title: messages.pdfDownloadedTitle,
          description: messages.pdfDownloadedDescription,
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: messages.downloadFailedTitle,
          description: messages.downloadFailedDescription,
          variant: "destructive"
        });
      }
    }
  });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={messages.dialogTitle}
      description={messages.dialogDescription}
      className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
      testId="dialog-recipe-scale"
      trigger={trigger || (
        <Button variant="outline" data-testid="button-recipe-scale">
          <Calculator size={16} className="mr-2" />
          {messages.scaleRecipe}
        </Button>
      )}
    >
      <div className="space-y-6">
          {/* Recipe Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recipe-select">{messages.selectRecipe}</Label>
              <Select
                value={selectedRecipeId}
                onValueChange={setSelectedRecipeId}
                data-testid="select-recipe-for-scaling"
              >
                <SelectTrigger>
                  <SelectValue placeholder={messages.chooseRecipe} />
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
              <Label htmlFor="target-weight">{messages.targetWeight}</Label>
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
                    {selectedRecipe.isVegan && <Badge variant="secondary">{messages.vegan}</Badge>}
                    {selectedRecipe.isGlutenFree && <Badge variant="secondary">{messages.glutenFree}</Badge>}
                    {selectedRecipe.isLactoseFree && <Badge variant="secondary">{messages.lactoseFree}</Badge>}
                  </div>
                </div>
                {canScale && (
                  <div className="text-right text-sm">
                     <div>{messages.originalWeight} <strong>{Math.round(originalWeight)}g</strong></div>
                    {targetWeight && (
                      <div className="text-primary">
                         {messages.scale} <strong>
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
                     {messages.missingConversionData}
                  </p>
                  <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 ml-2">
                    {missingData.slice(0, 3).map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                     {missingData.length > 3 && <li>• {messages.additionalMissingData(missingData.length - 3)}</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Scaled Ingredients Table */}
          {canScale && scaledIngredients.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{messages.scaledIngredients}</h4>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyToClipboard}
                    data-testid="button-copy-scaled-recipe"
                  >
                    <Copy size={14} className="mr-1" />
                    {messages.copy}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    data-testid="button-print-scaled-recipe"
                  >
                    <FileText size={14} className="mr-1" />
                    {messages.downloadPdf}
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3">{messages.ingredient}</th>
                      <th className="text-right p-3">{messages.original}</th>
                      <th className="text-right p-3">{messages.scaled}</th>
                      <th className="text-right p-3">{messages.percentage}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredientsWithPercentages.map((si, index) => (
                      <tr key={si.ingredientId} className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}>
                        <td className="p-3 font-medium">{si.ingredientName}</td>
                        <td className="p-3 text-right text-muted-foreground">
                          {formatQuantity(si.originalQuantity, si.originalUnit)} {si.originalUnit}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatQuantity(si.scaledQuantity, si.scaledUnit)} {si.scaledUnit}
                        </td>
                        <td className="p-3 text-right font-medium text-primary" data-testid={`percentage-${index}`}>
                          {si.percentage.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalCost > 0 && (
                <div className="mt-3 text-right text-sm">
                  <span className="text-muted-foreground">{messages.estimatedCost} </span>
                  <span className="font-semibold">{totalCost.toFixed(2)} PLN</span>
                </div>
              )}
            </div>
          )}

          {/* No recipe selected or scaling not possible */}
          {(!selectedRecipe || !canScale) && selectedRecipeId && targetWeight && (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="mx-auto mb-2" size={48} />
              <p>{messages.unableToCalculate}</p>
              <p className="text-sm">{messages.unableToCalculateHint}</p>
            </div>
          )}
        </div>

        {/* Hidden printable component */}
        {canScale && selectedRecipe && (
          <div style={{ display: 'none' }}>
            <PrintableRecipe
              ref={printRef}
              recipe={selectedRecipe}
              author={author}
              language={language}
              targetWeight={targetWeight}
              targetUnit={targetUnit}
              originalWeight={originalWeight}
              scaledIngredients={scaledIngredients}
              scaleFactor={scaleFactor}
              totalCost={totalCost > 0 ? totalCost : undefined}
            />
          </div>
        )}
    </ResponsiveDialog>
  );
}