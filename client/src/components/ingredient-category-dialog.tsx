import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { InsertIngredientCategory } from "@shared/schema";

export default function IngredientCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCategory = useMutation({
    mutationFn: async (category: InsertIngredientCategory) => {
      const response = await apiRequest("POST", "/api/ingredient-categories", category);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredient-categories"] });
      setOpen(false);
      setName("");
      setDescription("");
      toast({
        title: "Kategoria utworzona",
        description: "Kategoria składników została utworzona pomyślnie.",
      });
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się utworzyć kategorii składników.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    createCategory.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title="Dodaj kategorię składników"
      className="sm:max-w-md"
      testId="dialog-add-category"
      trigger={
        <Button variant="outline" size="sm" data-testid="button-add-category">
          <Plus size={16} className="mr-1" />
          Dodaj kategorię
        </Button>
      }
      footer={
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
            Anuluj
          </Button>
          <Button 
            type="submit" 
            form="ingredient-category-form"
            disabled={createCategory.isPending || !name.trim()}
            data-testid="button-save-category"
          >
            {createCategory.isPending ? "Tworzenie..." : "Utwórz"}
          </Button>
        </div>
      }
    >
      <form id="ingredient-category-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nazwa kategorii</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Mąki, Słodziki, Przyprawy"
              style={{ fontSize: '16px' }}
              required
              data-testid="input-category-name"
            />
          </div>
          <div>
            <Label htmlFor="description">Opis (opcjonalnie)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Krótki opis kategorii"
              data-testid="input-category-description"
            />
          </div>
        </form>
    </ResponsiveDialog>
  );
}
