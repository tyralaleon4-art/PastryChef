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
import type { InsertCategory } from "@shared/schema";

export default function RecipeCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCategory = useMutation({
    mutationFn: async (category: InsertCategory) => {
      const response = await apiRequest("POST", "/api/categories", category);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setOpen(false);
      setName("");
      setDescription("");
      toast({
        title: "Category added",
        description: "Recipe category has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add recipe category.",
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
      title="Add Recipe Category"
      className="sm:max-w-md"
      testId="dialog-add-recipe-category"
      trigger={
        <Button type="button" variant="outline" size="sm" data-testid="button-add-recipe-category">
          <Plus size={16} />
        </Button>
      }
      footer={
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-recipe-category">
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="recipe-category-form"
            disabled={createCategory.isPending || !name.trim()}
            data-testid="button-save-recipe-category"
          >
            {createCategory.isPending ? "Adding..." : "Add Category"}
          </Button>
        </div>
      }
    >
      <form id="recipe-category-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="categoryName">Category Name</Label>
            <Input
              id="categoryName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Ciasta drożdżowe"
              required
              data-testid="input-recipe-category-name"
            />
          </div>
          
          <div>
            <Label htmlFor="categoryDescription">Description (optional)</Label>
            <Textarea
              id="categoryDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description of the recipe category..."
              rows={3}
              data-testid="input-recipe-category-description"
            />
          </div>

        </form>
    </ResponsiveDialog>
  );
}