import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import IngredientCategoryDialog from "./ingredient-category-dialog";
import type { InsertIngredient, IngredientCategory } from "@shared/schema";

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
}

export default function AddIngredientDialog({ trigger }: AddIngredientDialogProps) {
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery<IngredientCategory[]>({
    queryKey: ["/api/ingredient-categories"],
  });

  const createIngredient = useMutation({
    mutationFn: async (ingredient: InsertIngredient) => {
      const response = await apiRequest("POST", "/api/ingredients", ingredient);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setOpen(false);
      resetForm();
      toast({
        title: "Ingredient added",
        description: "Ingredient has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add ingredient.",
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
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-add-ingredient">
            <Plus size={16} className="mr-2" />
            Add Ingredient
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-add-ingredient">
        <DialogHeader>
          <DialogTitle>Add New Ingredient</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Ingredient Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Mąka pszenna typ 500"
                required
                data-testid="input-ingredient-name"
              />
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

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createIngredient.isPending || !name.trim() || !costPerUnit.trim()}
              data-testid="button-save-ingredient"
            >
              {createIngredient.isPending ? "Adding..." : "Add Ingredient"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}