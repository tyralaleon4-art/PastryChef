import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Copy, Calculator } from "lucide-react";
import type { RecipeWithDetails } from "@shared/schema";

interface RecipeCardProps {
  recipe: RecipeWithDetails;
  costPerServing?: string;
}

export default function RecipeCard({ recipe, costPerServing }: RecipeCardProps) {
  const defaultImage = "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=200&fit=crop";

  return (
    <Card className="recipe-card bg-background border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer" data-testid={`recipe-card-${recipe.id}`}>
      <img 
        src={recipe.imageUrl || defaultImage}
        alt={recipe.name}
        className="w-full h-48 object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = defaultImage;
        }}
      />
      <CardContent className="p-4">
        <h4 className="font-semibold text-foreground mb-2" data-testid={`recipe-name-${recipe.id}`}>
          {recipe.name}
        </h4>
        <p className="text-sm text-muted-foreground mb-3" data-testid={`recipe-description-${recipe.id}`}>
          {recipe.description || "No description available"}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span data-testid={`recipe-category-${recipe.id}`}>
            {recipe.category?.name || "Uncategorized"}
          </span>
          <span data-testid={`recipe-servings-${recipe.id}`}>
            {recipe.servings} servings
          </span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm font-medium text-primary" data-testid={`recipe-cost-${recipe.id}`}>
            {costPerServing || "$0.00/serving"}
          </span>
          <div className="flex items-center space-x-1">
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-primary" data-testid={`button-edit-recipe-${recipe.id}`}>
              <Edit size={14} />
            </Button>
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-primary" data-testid={`button-copy-recipe-${recipe.id}`}>
              <Copy size={14} />
            </Button>
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-primary" data-testid={`button-calculate-recipe-${recipe.id}`}>
              <Calculator size={14} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
