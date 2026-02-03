import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import IngredientCategoryDialog from "./ingredient-category-dialog";
import type { InsertIngredient, IngredientCategory, IngredientWithStock } from "@shared/schema";

const POLISH_ALLERGENS = [
  "Gluten",
  "Crustaceans",
  "Eggs",
  "Fish",
  "Peanuts",
  "Soybeans",
  "Milk",
  "Nuts",
  "Celery",
  "Mustard",
  "Sesame",
  "Sulfites",
  "Lupin",
  "Mollusks"
];

interface AddIngredientDialogProps {
  trigger?: React.ReactNode;
  ingredient?: IngredientWithStock; // For editing existing ingredient
  mode?: "add" | "edit";
}

export default function AddIngredientDialog({ trigger, ingredient, mode = "add" }: AddIngredientDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [supplier, setSupplier] = useState("");
  const [currentStock, setCurrentStock] = useState("");
  const [minimumStock, setMinimumStock] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [allergens, setAllergens] = useState<string[]>([]);
  const [isVegan, setIsVegan] = useState(false);
  const [isGlutenFree, setIsGlutenFree] = useState(false);
  const [isLactoseFree, setIsLactoseFree] = useState(false);
  // Recipe scaling metadata (optional)
  const [densityGPerMl, setDensityGPerMl] = useState("");
  const [weightPerPieceG, setWeightPerPieceG] = useState("");
  // Nutritional values per 100g
  const [caloriesPer100g, setCaloriesPer100g] = useState("");
  const [proteinPer100g, setProteinPer100g] = useState("");
  const [fatPer100g, setFatPer100g] = useState("");
  const [carbsPer100g, setCarbsPer100g] = useState("");
  const [fiberPer100g, setFiberPer100g] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery<IngredientCategory[]>({
    queryKey: ["/api/ingredient-categories"],
  });

  const [isAILoading, setIsAILoading] = useState(false);

  const handleAIFill = async () => {
    if (!name.trim()) {
      toast({
        title: "Wprowadź nazwę",
        description: "Wpisz nazwę składnika, aby AI mogło go wyszukać.",
        variant: "destructive",
      });
      return;
    }

    setIsAILoading(true);
    try {
      const response = await apiRequest("POST", "/api/ai/ingredient-info", { name: name.trim() });
      const data = await response.json();
      
      if (data.pricePerKg) {
        setCostPerUnit(String(data.pricePerKg));
      }
      if (data.allergens && Array.isArray(data.allergens)) {
        setAllergens(data.allergens);
      }
      if (typeof data.isVegan === 'boolean') {
        setIsVegan(data.isVegan);
      }
      if (typeof data.isGlutenFree === 'boolean') {
        setIsGlutenFree(data.isGlutenFree);
      }
      if (typeof data.isLactoseFree === 'boolean') {
        setIsLactoseFree(data.isLactoseFree);
      }
      if (data.densityGPerMl) {
        setDensityGPerMl(String(data.densityGPerMl));
      }
      if (data.supplier) {
        setSupplier(data.supplier);
      }
      if (data.name && data.name !== name) {
        setName(data.name);
      }
      // Nutritional values
      if (data.caloriesPer100g) {
        setCaloriesPer100g(String(data.caloriesPer100g));
      }
      if (data.proteinPer100g) {
        setProteinPer100g(String(data.proteinPer100g));
      }
      if (data.fatPer100g) {
        setFatPer100g(String(data.fatPer100g));
      }
      if (data.carbsPer100g) {
        setCarbsPer100g(String(data.carbsPer100g));
      }
      if (data.fiberPer100g) {
        setFiberPer100g(String(data.fiberPer100g));
      }

      toast({
        title: "AI uzupełniło dane!",
        description: `Znaleziono informacje o: ${data.name || name}`,
      });
    } catch (error) {
      toast({
        title: "Błąd AI",
        description: "Nie udało się pobrać danych z AI. Spróbuj ponownie.",
        variant: "destructive",
      });
    } finally {
      setIsAILoading(false);
    }
  };

  // Initialize form with ingredient data when editing
  useEffect(() => {
    if (ingredient && mode === "edit") {
      setName(ingredient.name);
      setCategoryId(ingredient.categoryId || "none");
      setCostPerUnit(ingredient.costPerUnit);
      setSupplier(ingredient.supplier || "");
      setCurrentStock(ingredient.currentStock || "0");
      setMinimumStock(ingredient.minimumStock || "0");
      setExpiryDate(ingredient.expiryDate ? ingredient.expiryDate.toISOString().split('T')[0] : "");
      setAllergens(ingredient.allergens || []);
      setIsVegan(ingredient.isVegan || false);
      setIsGlutenFree(ingredient.isGlutenFree || false);
      setIsLactoseFree(ingredient.isLactoseFree || false);
      setDensityGPerMl(ingredient.densityGPerMl || "");
      setWeightPerPieceG(ingredient.weightPerPieceG || "");
      setCaloriesPer100g(ingredient.caloriesPer100g || "");
      setProteinPer100g(ingredient.proteinPer100g || "");
      setFatPer100g(ingredient.fatPer100g || "");
      setCarbsPer100g(ingredient.carbsPer100g || "");
      setFiberPer100g(ingredient.fiberPer100g || "");
    } else if (mode === "add") {
      resetForm();
    }
  }, [ingredient, mode]);

  const createIngredient = useMutation({
    mutationFn: async (ingredientData: InsertIngredient) => {
      if (mode === "edit" && ingredient) {
        const response = await apiRequest("PUT", `/api/ingredients/${ingredient.id}`, ingredientData);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/ingredients", ingredientData);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setOpen(false);
      resetForm();
      toast({
        title: mode === "edit" ? "Ingredient updated" : "Ingredient added",
        description: mode === "edit" 
          ? "Ingredient has been updated successfully." 
          : "Ingredient has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: mode === "edit" ? "Failed to update ingredient." : "Failed to add ingredient.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setCategoryId("");
    setCostPerUnit("");
    setSupplier("");
    setCurrentStock("");
    setMinimumStock("");
    setExpiryDate("");
    setAllergens([]);
    setIsVegan(false);
    setIsGlutenFree(false);
    setIsLactoseFree(false);
    setDensityGPerMl("");
    setWeightPerPieceG("");
    setCaloriesPer100g("");
    setProteinPer100g("");
    setFatPer100g("");
    setCarbsPer100g("");
    setFiberPer100g("");
  };

  const toggleAllergen = (allergen: string) => {
    setAllergens(prev => 
      prev.includes(allergen) 
        ? prev.filter(a => a !== allergen)
        : [...prev, allergen]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !costPerUnit.trim()) return;
    
    createIngredient.mutate({
      name: name.trim(),
      categoryId: categoryId && categoryId !== "none" ? categoryId : undefined,
      unit: "kg", // Default to kg as requested (price per kg)
      costPerUnit: costPerUnit,
      supplier: supplier.trim() || undefined,
      currentStock: currentStock || "0",
      minimumStock: minimumStock || "0",
      allergens: allergens,
      isVegan,
      isGlutenFree,
      isLactoseFree,
      // Recipe scaling metadata (optional)
      densityGPerMl: densityGPerMl ? densityGPerMl : undefined,
      weightPerPieceG: weightPerPieceG ? weightPerPieceG : undefined,
      // Nutritional values per 100g
      caloriesPer100g: caloriesPer100g ? caloriesPer100g : undefined,
      proteinPer100g: proteinPer100g ? proteinPer100g : undefined,
      fatPer100g: fatPer100g ? fatPer100g : undefined,
      carbsPer100g: carbsPer100g ? carbsPer100g : undefined,
      fiberPer100g: fiberPer100g ? fiberPer100g : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={mode === "edit" ? "Edit Ingredient" : "Add New Ingredient"}
      className="sm:max-w-2xl max-h-[80vh] overflow-y-auto"
      testId="dialog-add-ingredient"
      trigger={trigger || (
        <Button data-testid="button-add-ingredient">
          <Plus size={16} className="mr-2" />
          Add Ingredient
        </Button>
      )}
      footer={
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="ingredient-form"
            disabled={createIngredient.isPending || !name.trim() || !costPerUnit.trim()}
            data-testid="button-save-ingredient"
          >
            {createIngredient.isPending 
              ? (mode === "edit" ? "Updating..." : "Adding...") 
              : (mode === "edit" ? "Update Ingredient" : "Add Ingredient")
            }
          </Button>
        </div>
      }
    >
      <form id="ingredient-form" onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Ingredient Name</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Mąka pszenna typ 500"
                  required
                  data-testid="input-ingredient-name"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAIFill}
                  disabled={isAILoading || !name.trim()}
                  title="Wypełnij dane za pomocą AI"
                  data-testid="button-ai-fill"
                >
                  {isAILoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="costPerUnit">Price per Kg (PLN)</Label>
              <Input
                id="costPerUnit"
                type="number"
                step="0.01"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                placeholder="e.g., 3.50"
                required
                data-testid="input-price-per-kg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="category">Category</Label>
              <div className="flex space-x-2">
                <Select value={categoryId} onValueChange={setCategoryId} data-testid="select-ingredient-category">
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <IngredientCategoryDialog />
              </div>
            </div>
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g., Młyny Polskie"
                data-testid="input-supplier"
              />
            </div>
          </div>

          {/* Allergens & Dietary Properties */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Allergens</Label>
              <div className="grid grid-cols-2 gap-1 mt-2 max-h-32 overflow-y-auto">
                {POLISH_ALLERGENS.map((allergen) => (
                  <div key={allergen} className="flex items-center space-x-1">
                    <Checkbox 
                      id={`allergen-${allergen}`}
                      checked={allergens.includes(allergen)}
                      onCheckedChange={(checked) => {
                        if (checked === true) {
                          toggleAllergen(allergen);
                        } else {
                          toggleAllergen(allergen);
                        }
                      }}
                      data-testid={`checkbox-allergen-${allergen.toLowerCase()}`}
                    />
                    <Label htmlFor={`allergen-${allergen}`} className="text-xs font-normal">
                      {allergen}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Dietary Properties</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="ingredient-vegan" 
                    checked={isVegan} 
                    onCheckedChange={(checked) => setIsVegan(checked === true)}
                    data-testid="checkbox-ingredient-vegan"
                  />
                  <Label htmlFor="ingredient-vegan" className="text-sm font-normal">Vegan</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="ingredient-glutenFree" 
                    checked={isGlutenFree} 
                    onCheckedChange={(checked) => setIsGlutenFree(checked === true)}
                    data-testid="checkbox-ingredient-gluten-free"
                  />
                  <Label htmlFor="ingredient-glutenFree" className="text-sm font-normal">Gluten Free</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="ingredient-lactoseFree" 
                    checked={isLactoseFree} 
                    onCheckedChange={(checked) => setIsLactoseFree(checked === true)}
                    data-testid="checkbox-ingredient-lactose-free"
                  />
                  <Label htmlFor="ingredient-lactoseFree" className="text-sm font-normal">Lactose Free</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Recipe Scaling Metadata (Optional) */}
          <div className="border-t pt-4">
            <Label className="text-sm font-medium mb-3 block">Recipe Scaling Properties (Optional)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="densityGPerMl">Density (g per ml)</Label>
                <Input
                  id="densityGPerMl"
                  type="number"
                  step="0.001"
                  value={densityGPerMl}
                  onChange={(e) => setDensityGPerMl(e.target.value)}
                  placeholder="e.g., 1.000 for water, 0.915 for oil"
                  data-testid="input-density-g-per-ml"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used to convert ml/l measurements to grams for recipe scaling
                </p>
              </div>
              <div>
                <Label htmlFor="weightPerPieceG">Weight per piece (g)</Label>
                <Input
                  id="weightPerPieceG"
                  type="number"
                  step="0.1"
                  value={weightPerPieceG}
                  onChange={(e) => setWeightPerPieceG(e.target.value)}
                  placeholder="e.g., 60 for large egg, 2 for almond"
                  data-testid="input-weight-per-piece-g"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used to convert piece measurements to grams for recipe scaling
                </p>
              </div>
            </div>
          </div>

          {/* Nutritional Values per 100g */}
          <div className="border-t pt-4">
            <Label className="text-sm font-medium mb-3 block">Wartości odżywcze (na 100g)</Label>
            <div className="grid grid-cols-5 gap-2">
              <div>
                <Label htmlFor="caloriesPer100g" className="text-xs">Kalorie (kcal)</Label>
                <Input
                  id="caloriesPer100g"
                  type="number"
                  step="0.1"
                  value={caloriesPer100g}
                  onChange={(e) => setCaloriesPer100g(e.target.value)}
                  placeholder="0"
                  data-testid="input-calories"
                />
              </div>
              <div>
                <Label htmlFor="proteinPer100g" className="text-xs">Białko (g)</Label>
                <Input
                  id="proteinPer100g"
                  type="number"
                  step="0.1"
                  value={proteinPer100g}
                  onChange={(e) => setProteinPer100g(e.target.value)}
                  placeholder="0"
                  data-testid="input-protein"
                />
              </div>
              <div>
                <Label htmlFor="fatPer100g" className="text-xs">Tłuszcz (g)</Label>
                <Input
                  id="fatPer100g"
                  type="number"
                  step="0.1"
                  value={fatPer100g}
                  onChange={(e) => setFatPer100g(e.target.value)}
                  placeholder="0"
                  data-testid="input-fat"
                />
              </div>
              <div>
                <Label htmlFor="carbsPer100g" className="text-xs">Węglowodany (g)</Label>
                <Input
                  id="carbsPer100g"
                  type="number"
                  step="0.1"
                  value={carbsPer100g}
                  onChange={(e) => setCarbsPer100g(e.target.value)}
                  placeholder="0"
                  data-testid="input-carbs"
                />
              </div>
              <div>
                <Label htmlFor="fiberPer100g" className="text-xs">Błonnik (g)</Label>
                <Input
                  id="fiberPer100g"
                  type="number"
                  step="0.1"
                  value={fiberPer100g}
                  onChange={(e) => setFiberPer100g(e.target.value)}
                  placeholder="0"
                  data-testid="input-fiber"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="currentStock">Current Stock (kg)</Label>
              <Input
                id="currentStock"
                type="number"
                step="0.1"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                placeholder="25.5"
                data-testid="input-current-stock"
              />
            </div>
            <div>
              <Label htmlFor="minimumStock">Min Stock (kg)</Label>
              <Input
                id="minimumStock"
                type="number"
                step="0.1"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
                placeholder="5.0"
                data-testid="input-minimum-stock"
              />
            </div>
            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                data-testid="input-expiry-date"
              />
            </div>
          </div>

        </form>
    </ResponsiveDialog>
  );
}