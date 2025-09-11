import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCategorySchema, 
  insertIngredientCategorySchema,
  insertIngredientSchema, 
  insertRecipeSchema,
  insertRecipeIngredientSchema,
  insertInventoryLogSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const category = insertCategorySchema.parse(req.body);
      const newCategory = await storage.createCategory(category);
      res.status(201).json(newCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const category = insertCategorySchema.partial().parse(req.body);
      const updated = await storage.updateCategory(id, category);
      
      if (!updated) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update category" });
      }
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCategory(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Ingredient Categories
  app.get("/api/ingredient-categories", async (req, res) => {
    try {
      const categories = await storage.getIngredientCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ingredient categories" });
    }
  });

  app.post("/api/ingredient-categories", async (req, res) => {
    try {
      const category = insertIngredientCategorySchema.parse(req.body);
      const newCategory = await storage.createIngredientCategory(category);
      res.status(201).json(newCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid ingredient category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create ingredient category" });
      }
    }
  });

  app.put("/api/ingredient-categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const category = insertIngredientCategorySchema.partial().parse(req.body);
      const updated = await storage.updateIngredientCategory(id, category);
      
      if (!updated) {
        return res.status(404).json({ message: "Ingredient category not found" });
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid ingredient category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update ingredient category" });
      }
    }
  });

  app.delete("/api/ingredient-categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteIngredientCategory(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Ingredient category not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete ingredient category" });
    }
  });

  // Ingredients
  app.get("/api/ingredients", async (req, res) => {
    try {
      const { search } = req.query;
      const ingredients = await storage.getIngredients(search as string);
      res.json(ingredients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ingredients" });
    }
  });

  app.get("/api/ingredients/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ingredient = await storage.getIngredient(id);
      
      if (!ingredient) {
        return res.status(404).json({ message: "Ingredient not found" });
      }
      
      res.json(ingredient);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ingredient" });
    }
  });

  app.post("/api/ingredients", async (req, res) => {
    try {
      const ingredient = insertIngredientSchema.parse(req.body);
      const newIngredient = await storage.createIngredient(ingredient);
      res.status(201).json(newIngredient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid ingredient data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create ingredient" });
      }
    }
  });

  app.put("/api/ingredients/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ingredient = insertIngredientSchema.partial().parse(req.body);
      const updated = await storage.updateIngredient(id, ingredient);
      
      if (!updated) {
        return res.status(404).json({ message: "Ingredient not found" });
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid ingredient data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update ingredient" });
      }
    }
  });

  app.delete("/api/ingredients/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteIngredient(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Ingredient not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete ingredient" });
    }
  });

  // Recipes
  app.get("/api/recipes", async (req, res) => {
    try {
      const { search, categoryId } = req.query;
      const recipes = await storage.getRecipes(search as string, categoryId as string);
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  app.get("/api/recipes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const recipe = await storage.getRecipe(id);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  app.post("/api/recipes", async (req, res) => {
    try {
      const { recipeIngredients, ...recipeData } = req.body;
      const recipe = insertRecipeSchema.parse(recipeData);
      const newRecipe = await storage.createRecipe(recipe);
      
      // Add recipe ingredients if provided
      if (recipeIngredients && Array.isArray(recipeIngredients)) {
        for (const ri of recipeIngredients) {
          const recipeIngredient = insertRecipeIngredientSchema.parse({
            ...ri,
            recipeId: newRecipe.id
          });
          await storage.addRecipeIngredient(recipeIngredient);
        }
      }
      
      // Return the recipe with ingredients
      const recipeWithIngredients = await storage.getRecipe(newRecipe.id);
      res.status(201).json(recipeWithIngredients);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid recipe data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create recipe" });
      }
    }
  });

  app.put("/api/recipes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { recipeIngredients, ...recipeData } = req.body;
      const recipe = insertRecipeSchema.partial().parse(recipeData);
      const updated = await storage.updateRecipe(id, recipe);
      
      if (!updated) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      // Update recipe ingredients if provided
      if (recipeIngredients && Array.isArray(recipeIngredients)) {
        const validatedIngredients = recipeIngredients.map(ri => 
          insertRecipeIngredientSchema.parse({
            ...ri,
            recipeId: id
          })
        );
        await storage.replaceRecipeIngredients(id, validatedIngredients);
      }
      
      // Return the recipe with updated ingredients
      const recipeWithIngredients = await storage.getRecipe(id);
      res.json(recipeWithIngredients);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid recipe data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update recipe" });
      }
    }
  });

  app.delete("/api/recipes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteRecipe(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete recipe" });
    }
  });

  // Recipe Ingredients
  app.get("/api/recipes/:recipeId/ingredients", async (req, res) => {
    try {
      const { recipeId } = req.params;
      const recipeIngredients = await storage.getRecipeIngredients(recipeId);
      res.json(recipeIngredients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recipe ingredients" });
    }
  });

  app.post("/api/recipes/:recipeId/ingredients", async (req, res) => {
    try {
      const { recipeId } = req.params;
      const recipeIngredient = insertRecipeIngredientSchema.parse({ 
        ...req.body, 
        recipeId 
      });
      const newRecipeIngredient = await storage.addRecipeIngredient(recipeIngredient);
      res.status(201).json(newRecipeIngredient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid recipe ingredient data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add recipe ingredient" });
      }
    }
  });

  app.put("/api/recipe-ingredients/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const recipeIngredient = insertRecipeIngredientSchema.partial().parse(req.body);
      const updated = await storage.updateRecipeIngredient(id, recipeIngredient);
      
      if (!updated) {
        return res.status(404).json({ message: "Recipe ingredient not found" });
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid recipe ingredient data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update recipe ingredient" });
      }
    }
  });

  app.delete("/api/recipe-ingredients/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteRecipeIngredient(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Recipe ingredient not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete recipe ingredient" });
    }
  });

  // Inventory
  app.get("/api/inventory/low-stock", async (req, res) => {
    try {
      const lowStockIngredients = await storage.getLowStockIngredients();
      res.json(lowStockIngredients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock ingredients" });
    }
  });

  app.get("/api/inventory/logs", async (req, res) => {
    try {
      const { ingredientId } = req.query;
      const logs = await storage.getInventoryLogs(ingredientId as string);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory logs" });
    }
  });

  app.post("/api/inventory/logs", async (req, res) => {
    try {
      const log = insertInventoryLogSchema.parse(req.body);
      const newLog = await storage.addInventoryLog(log);
      res.status(201).json(newLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid inventory log data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create inventory log" });
      }
    }
  });

  // Statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Calculate recipe cost
  app.post("/api/recipes/:id/calculate-cost", async (req, res) => {
    try {
      const { id } = req.params;
      const { scalingFactor = 1 } = req.body;
      
      const recipe = await storage.getRecipe(id);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      let totalCost = 0;
      for (const ri of recipe.recipeIngredients) {
        const ingredientCost = Number(ri.ingredient.costPerUnit) * Number(ri.quantity) * scalingFactor;
        totalCost += ingredientCost;
      }

      const costPerServing = totalCost; // Assume 1 serving for now since servings field doesn't exist

      res.json({
        totalCost: totalCost.toFixed(2),
        costPerServing: costPerServing.toFixed(2),
        scalingFactor,
        servings: scalingFactor
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate recipe cost" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
