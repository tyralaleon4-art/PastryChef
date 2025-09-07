import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AddIngredientDialog from "@/components/add-ingredient-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Package } from "lucide-react";
import type { IngredientWithStock } from "@shared/schema";

export default function Ingredients() {
  const [search, setSearch] = useState("");

  const { data: ingredients = [], isLoading } = useQuery<IngredientWithStock[]>({
    queryKey: ["/api/ingredients", search],
  });

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStockBadgeVariant = (stockStatus: string) => {
    switch (stockStatus) {
      case "low": return "destructive";
      case "expired": return "destructive";
      default: return "secondary";
    }
  };

  const getStockBadgeText = (stockStatus: string) => {
    switch (stockStatus) {
      case "low": return "Low Stock";
      case "expired": return "Expired";
      default: return "Normal";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <Header 
          title="Ingredient Management" 
          subtitle="Track inventory, costs, and supplier information"
          action={
            <AddIngredientDialog />
          }
        />
        
        <div className="p-6">
          {/* Search */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input 
                className="pl-10" 
                placeholder="Search ingredients..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-ingredients"
              />
            </div>
          </div>

          {/* Ingredients Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-lg h-48"></div>
                </div>
              ))}
            </div>
          ) : filteredIngredients.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">No ingredients found</p>
              <p className="text-muted-foreground text-sm mt-2">
                {search ? "Try adjusting your search criteria" : "Start by adding your first ingredient"}
              </p>
              <AddIngredientDialog 
                trigger={
                  <Button className="mt-4" data-testid="button-create-first-ingredient">
                    <Plus size={16} className="mr-2" />
                    Add Ingredient
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredIngredients.map((ingredient) => (
                <Card key={ingredient.id} className="hover:shadow-md transition-shadow" data-testid={`ingredient-card-${ingredient.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{ingredient.name}</h3>
                        {ingredient.category && (
                          <p className="text-sm text-primary font-medium mb-1">{ingredient.category.name}</p>
                        )}
                        <p className="text-sm text-muted-foreground">{ingredient.supplier || "No supplier"}</p>
                      </div>
                      <Badge variant={getStockBadgeVariant(ingredient.stockStatus)} data-testid={`badge-stock-${ingredient.id}`}>
                        {getStockBadgeText(ingredient.stockStatus)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Price per kg:</span>
                        <span className="font-medium">{Number(ingredient.costPerUnit).toFixed(2)} PLN</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current Stock:</span>
                        <span className="font-medium">{Number(ingredient.currentStock).toFixed(1)} {ingredient.unit}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Minimum Stock:</span>
                        <span className="font-medium">{Number(ingredient.minimumStock).toFixed(1)} {ingredient.unit}</span>
                      </div>
                      {ingredient.expiryDate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Expires:</span>
                          <span className="font-medium">{new Date(ingredient.expiryDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Button size="sm" variant="outline" data-testid={`button-edit-${ingredient.id}`}>
                          <Edit size={14} />
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-delete-${ingredient.id}`}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      <Button size="sm" variant="outline" data-testid={`button-restock-${ingredient.id}`}>
                        Restock
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
