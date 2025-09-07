import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { IngredientWithStock, InsertIngredient, InventoryLog, InsertInventoryLog } from "@shared/schema";

export function useIngredients(search?: string) {
  return useQuery<IngredientWithStock[]>({
    queryKey: ["/api/ingredients", search],
    enabled: true,
  });
}

export function useIngredient(id: string) {
  return useQuery({
    queryKey: ["/api/ingredients", id],
    enabled: !!id,
  });
}

export function useCreateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ingredient: InsertIngredient) => {
      const response = await apiRequest("POST", "/api/ingredients", ingredient);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ingredient }: { id: string; ingredient: Partial<InsertIngredient> }) => {
      const response = await apiRequest("PUT", `/api/ingredients/${id}`, ingredient);
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients", id] });
    },
  });
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/ingredients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });
}

export function useLowStockIngredients() {
  return useQuery<IngredientWithStock[]>({
    queryKey: ["/api/inventory/low-stock"],
  });
}

export function useInventoryLogs(ingredientId?: string) {
  return useQuery<(InventoryLog & { ingredient: any })[]>({
    queryKey: ["/api/inventory/logs", ingredientId],
  });
}

export function useAddInventoryLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: InsertInventoryLog) => {
      const response = await apiRequest("POST", "/api/inventory/logs", log);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });
}
