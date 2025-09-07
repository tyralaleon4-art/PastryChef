import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import RecipeCard from "@/components/recipe-card";
import AddRecipeDialog from "@/components/add-recipe-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, Plus } from "lucide-react";
import type { RecipeWithDetails } from "@shared/schema";

export default function Recipes() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data: recipes = [], isLoading } = useQuery<RecipeWithDetails[]>({
    queryKey: ["/api/recipes", search, categoryFilter],
    enabled: true,
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });


  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = !search || recipe.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || categoryFilter === "all" || recipe.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <Header 
          title="Recipe Library" 
          subtitle="Manage and organize your complete recipe collection"
          action={
            <AddRecipeDialog 
              trigger={
                <Button data-testid="button-add-recipe">
                  <Plus size={16} className="mr-2" />
                  New Recipe
                </Button>
              }
            />
          }
        />
        
        <div className="p-6">
          {/* Search and Filter */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex items-center space-x-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input 
                  className="pl-10" 
                  placeholder="Search recipes..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-recipes"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter} data-testid="select-category-filter">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" data-testid="button-filter-recipes">
                <Filter size={16} className="mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {/* Recipe Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-lg h-64"></div>
                </div>
              ))}
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No recipes found</p>
              <p className="text-muted-foreground text-sm mt-2">
                {search || categoryFilter ? "Try adjusting your search or filter criteria" : "Start by creating your first recipe"}
              </p>
              <Button className="mt-4" data-testid="button-create-first-recipe">
                <Plus size={16} className="mr-2" />
                Create Recipe
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe}
                  />
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredRecipes.length} of {recipes.length} recipes
                </p>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" data-testid="button-previous-page">
                    Previous
                  </Button>
                  <Button variant="default" size="sm" data-testid="button-page-1">
                    1
                  </Button>
                  <Button variant="outline" size="sm" data-testid="button-page-2">
                    2
                  </Button>
                  <Button variant="outline" size="sm" data-testid="button-page-3">
                    3
                  </Button>
                  <Button variant="outline" size="sm" data-testid="button-next-page">
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
