import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { RecipeWithDetails, InsertRecipe } from "@shared/schema";

export function useRecipes(search?: string, categoryId?: string) {
  return useQuery<RecipeWithDetails[]>({
    queryKey: ["/api/recipes", search, categoryId],
    enabled: true,
  });
}

export function useRecipe(id: string) {
  return useQuery<RecipeWithDetails>({
    queryKey: ["/api/recipes", id],
    enabled: !!id,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipe: InsertRecipe) => {
      const response = await apiRequest("POST", "/api/recipes", recipe);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, recipe }: { id: string; recipe: Partial<InsertRecipe> }) => {
      const response = await apiRequest("PUT", `/api/recipes/${id}`, recipe);
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", id] });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/recipes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });
}

export function useCalculateRecipeCost() {
  return useMutation({
    mutationFn: async ({ id, scalingFactor = 1 }: { id: string; scalingFactor?: number }) => {
      const response = await apiRequest("POST", `/api/recipes/${id}/calculate-cost`, { scalingFactor });
      return response.json();
    },
  });
}
