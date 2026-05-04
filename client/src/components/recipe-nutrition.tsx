import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Beef, Droplet, Wheat, Leaf } from "lucide-react";

interface NutritionData {
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  totalFiber: number;
  totalWeightG: number;
  per100g: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
  } | null;
}

interface RecipeNutritionProps {
  recipeId: string;
  compact?: boolean;
}

export default function RecipeNutrition({ recipeId, compact = false }: RecipeNutritionProps) {
  const { data: nutrition, isLoading } = useQuery<NutritionData>({
    queryKey: ["/api/recipes", recipeId, "nutrition"],
    queryFn: async () => {
      const res = await fetch(`/api/recipes/${recipeId}/nutrition`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load nutrition");
      return res.json();
    },
    enabled: !!recipeId,
  });

  if (isLoading) {
    return <div className="animate-pulse bg-muted rounded-lg h-6" />;
  }

  if (!nutrition || nutrition.totalCalories === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        Brak danych o wartościach odżywczych
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded">
          <Flame size={12} /> {nutrition.per100g?.calories ?? 0} kcal/100g
        </span>
        <span className="flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded">
          <Beef size={12} /> {nutrition.per100g?.protein ?? 0}g białka
        </span>
        <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
          <Droplet size={12} /> {nutrition.per100g?.fat ?? 0}g tłuszczu
        </span>
        <span className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded">
          <Wheat size={12} /> {nutrition.per100g?.carbs ?? 0}g węglowodanów
        </span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="text-orange-500" size={20} />
          Wartości odżywcze
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Całkowita waga: {nutrition.totalWeightG}g
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Całość przepisu</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><Flame size={14} className="text-orange-500" /> Kalorie</span>
                  <span className="font-medium">{nutrition.totalCalories} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><Beef size={14} className="text-red-500" /> Białko</span>
                  <span className="font-medium">{nutrition.totalProtein}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><Droplet size={14} className="text-yellow-500" /> Tłuszcz</span>
                  <span className="font-medium">{nutrition.totalFat}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><Wheat size={14} className="text-amber-500" /> Węglowodany</span>
                  <span className="font-medium">{nutrition.totalCarbs}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><Leaf size={14} className="text-green-500" /> Błonnik</span>
                  <span className="font-medium">{nutrition.totalFiber}g</span>
                </div>
              </div>
            </div>
            {nutrition.per100g && (
              <div>
                <h4 className="font-medium text-sm mb-2">Na 100g</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>Kalorie</span><span className="font-medium">{nutrition.per100g.calories} kcal</span></div>
                  <div className="flex justify-between"><span>Białko</span><span className="font-medium">{nutrition.per100g.protein}g</span></div>
                  <div className="flex justify-between"><span>Tłuszcz</span><span className="font-medium">{nutrition.per100g.fat}g</span></div>
                  <div className="flex justify-between"><span>Węglowodany</span><span className="font-medium">{nutrition.per100g.carbs}g</span></div>
                  <div className="flex justify-between"><span>Błonnik</span><span className="font-medium">{nutrition.per100g.fiber}g</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
