import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { registerAIRoutes } from "./ai-routes";
import { requireAuth, requireAdmin, hashPassword, verifyPassword } from "./auth";
import { 
  insertCategorySchema, 
  insertIngredientCategorySchema,
  insertIngredientSchema, 
  insertRecipeSchema,
  insertRecipeIngredientSchema,
  insertInventoryLogSchema,
  insertProductionPlanSchema,
  insertProductionPlanRecipeSchema,
  insertUserSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {

  // ==================== AUTH ROUTES ====================
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, displayName } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "Username already taken" });
      }
      const hashed = await hashPassword(password);
      const user = await storage.createUser({ username, password: hashed, role: "user", displayName: displayName || null });
      req.session.userId = user.id;
      req.session.userRole = user.role;
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to register" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      const valid = await verifyPassword(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      req.session.userId = user.id;
      req.session.userRole = user.role;
      // Wait for session to be persisted to DB before responding
      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to save session" });
        }
        const { password: _, ...safeUser } = user;
        res.json(safeUser);
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update own profile (displayName, password)
  app.put("/api/auth/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { displayName, currentPassword, newPassword } = req.body;

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const updates: any = {};

      if (displayName !== undefined) {
        updates.displayName = displayName || null;
      }

      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: "Podaj aktualne hasło" });
        }
        const { comparePasswords, hashPassword } = await import("./auth");
        const valid = await comparePasswords(currentPassword, user.password);
        if (!valid) {
          return res.status(400).json({ message: "Aktualne hasło jest nieprawidłowe" });
        }
        if (newPassword.length < 6) {
          return res.status(400).json({ message: "Nowe hasło musi mieć min. 6 znaków" });
        }
        updates.password = await hashPassword(newPassword);
      }

      const updated = await storage.updateUser(userId, updates);
      if (!updated) return res.status(404).json({ message: "User not found" });
      const { password: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // ==================== ADMIN ROUTES ====================
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const safe = allUsers.map(({ password: _, ...u }) => u);
      res.json(safe);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { username, password, role, displayName } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "Username already taken" });
      }
      const hashed = await hashPassword(password);
      const user = await storage.createUser({ username, password: hashed, role: role || "user", displayName: displayName || null });
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { username, password, role, displayName } = req.body;
      const updateData: any = {};
      if (username) updateData.username = username;
      if (role) updateData.role = role;
      if (displayName !== undefined) updateData.displayName = displayName;
      if (password) updateData.password = await hashPassword(password);
      const updated = await storage.updateUser(id, updateData);
      if (!updated) return res.status(404).json({ message: "User not found" });
      const { password: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      // Prevent deleting yourself
      if (id === req.session.userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      const deleted = await storage.deleteUser(id);
      if (!deleted) return res.status(404).json({ message: "User not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin: import all recipes from a user to the calling admin's account
  app.post("/api/admin/users/:id/import-recipes", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id: sourceUserId } = req.params;
      const adminUserId = req.session.userId!;

      if (sourceUserId === adminUserId) {
        return res.status(400).json({ message: "Cannot import from your own account" });
      }

      const sourceUser = await storage.getUser(sourceUserId);
      if (!sourceUser) return res.status(404).json({ message: "User not found" });

      const sourceRecipes = await storage.getRecipes(sourceUserId);
      const adminRecipes = await storage.getRecipes(adminUserId);
      const adminRecipeNames = new Set(adminRecipes.map(r => r.name));

      let imported = 0;
      let skipped = 0;

      for (const recipe of sourceRecipes) {
        let targetName = recipe.name;
        if (adminRecipeNames.has(targetName)) {
          targetName = `${targetName} (${sourceUser.displayName || sourceUser.username})`;
        }
        // If still clashes, skip
        if (adminRecipeNames.has(targetName)) {
          skipped++;
          continue;
        }

        const newRecipe = await storage.createRecipe({
          name: targetName,
          description: recipe.description,
          categoryId: null, // Categories are user-scoped, don't copy
          servings: recipe.servings,
          prepTimeMinutes: recipe.prepTimeMinutes,
          difficulty: recipe.difficulty,
          instructions: recipe.instructions,
          allergens: recipe.allergens,
          isVegan: recipe.isVegan,
          isGlutenFree: recipe.isGlutenFree,
          isLactoseFree: recipe.isLactoseFree,
          targetWeight: recipe.targetWeight,
          targetUnit: recipe.targetUnit,
          isActive: true,
        }, adminUserId);

        // Copy recipe ingredients (ingredients are global/shared)
        for (const ri of recipe.recipeIngredients) {
          await storage.addRecipeIngredient({
            recipeId: newRecipe.id,
            ingredientId: ri.ingredientId,
            quantity: ri.quantity,
            unit: ri.unit,
            notes: ri.notes,
          });
        }

        adminRecipeNames.add(targetName);
        imported++;
      }

      res.json({ imported, skipped, total: sourceRecipes.length });
    } catch (error) {
      console.error("Error importing recipes:", error);
      res.status(500).json({ message: "Failed to import recipes" });
    }
  });

  // Admin: impersonate / view user data
  app.get("/api/admin/users/:id/data", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) return res.status(404).json({ message: "User not found" });
      const recipes = await storage.getRecipes(id);
      const ingredientsList = await storage.getIngredients();
      const categoriesList = await storage.getCategories(id);
      res.json({ user: { ...user, password: undefined }, recipes, ingredients: ingredientsList, categories: categoriesList });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  // ==================== CATEGORIES ====================
  app.get("/api/categories", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const cats = await storage.getCategories(userId);
      res.json(cats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const category = insertCategorySchema.parse(req.body);
      const newCategory = await storage.createCategory(category, userId);
      res.status(201).json(newCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });

  app.put("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { id } = req.params;
      const category = insertCategorySchema.partial().parse(req.body);
      const updated = await storage.updateCategory(id, category, userId);
      if (!updated) return res.status(404).json({ message: "Category not found" });
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update category" });
      }
    }
  });

  app.delete("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { id } = req.params;
      const deleted = await storage.deleteCategory(id, userId);
      if (!deleted) return res.status(404).json({ message: "Category not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // ==================== INGREDIENT CATEGORIES ====================
  app.get("/api/ingredient-categories", requireAuth, async (req, res) => {
    try {
      const cats = await storage.getIngredientCategories();
      res.json(cats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ingredient categories" });
    }
  });

  app.post("/api/ingredient-categories", requireAuth, async (req, res) => {
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

  app.put("/api/ingredient-categories/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const category = insertIngredientCategorySchema.partial().parse(req.body);
      const updated = await storage.updateIngredientCategory(id, category);
      if (!updated) return res.status(404).json({ message: "Ingredient category not found" });
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid ingredient category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update ingredient category" });
      }
    }
  });

  app.delete("/api/ingredient-categories/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteIngredientCategory(id);
      if (!deleted) return res.status(404).json({ message: "Ingredient category not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete ingredient category" });
    }
  });

  // ==================== INGREDIENTS ====================
  app.get("/api/ingredients", requireAuth, async (req, res) => {
    try {
      const { search } = req.query;
      const ingredientsList = await storage.getIngredients(search as string | undefined);
      res.json(ingredientsList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ingredients" });
    }
  });

  app.get("/api/ingredients/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const ingredient = await storage.getIngredient(id);
      if (!ingredient) return res.status(404).json({ message: "Ingredient not found" });
      res.json(ingredient);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ingredient" });
    }
  });

  app.post("/api/ingredients", requireAuth, async (req, res) => {
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

  app.put("/api/ingredients/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const ingredient = insertIngredientSchema.partial().parse(req.body);
      const updated = await storage.updateIngredient(id, ingredient);
      if (!updated) return res.status(404).json({ message: "Ingredient not found" });
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid ingredient data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update ingredient" });
      }
    }
  });

  app.delete("/api/ingredients/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteIngredient(id);
      if (!deleted) return res.status(404).json({ message: "Ingredient not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete ingredient" });
    }
  });

  // ==================== RECIPES ====================
  app.get("/api/recipes", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { search, categoryId } = req.query;
      const recipeList = await storage.getRecipes(userId, search as string, categoryId as string);
      res.json(recipeList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  app.get("/api/recipes/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const recipe = await storage.getRecipe(id);
      if (!recipe) return res.status(404).json({ message: "Recipe not found" });
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  app.post("/api/recipes", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { recipeIngredients, ...recipeData } = req.body;
      const recipe = insertRecipeSchema.parse(recipeData);
      const newRecipe = await storage.createRecipe(recipe, userId);
      
      if (recipeIngredients && Array.isArray(recipeIngredients)) {
        for (const ri of recipeIngredients) {
          const recipeIngredient = insertRecipeIngredientSchema.parse({
            ...ri,
            recipeId: newRecipe.id
          });
          await storage.addRecipeIngredient(recipeIngredient);
        }
      }
      
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

  app.put("/api/recipes/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { recipeIngredients, ...recipeData } = req.body;
      const recipe = insertRecipeSchema.partial().parse(recipeData);
      const updated = await storage.updateRecipe(id, recipe);
      if (!updated) return res.status(404).json({ message: "Recipe not found" });
      
      if (recipeIngredients && Array.isArray(recipeIngredients)) {
        const validatedIngredients = recipeIngredients.map(ri => 
          insertRecipeIngredientSchema.parse({ ...ri, recipeId: id })
        );
        await storage.replaceRecipeIngredients(id, validatedIngredients);
      }
      
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

  app.delete("/api/recipes/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteRecipe(id);
      if (!deleted) return res.status(404).json({ message: "Recipe not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete recipe" });
    }
  });

  // Recipe Ingredients
  app.get("/api/recipes/:recipeId/ingredients", requireAuth, async (req, res) => {
    try {
      const { recipeId } = req.params;
      const recipeIngredientsList = await storage.getRecipeIngredients(recipeId);
      res.json(recipeIngredientsList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recipe ingredients" });
    }
  });

  app.post("/api/recipes/:recipeId/ingredients", requireAuth, async (req, res) => {
    try {
      const { recipeId } = req.params;
      const recipeIngredient = insertRecipeIngredientSchema.parse({ ...req.body, recipeId });
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

  app.put("/api/recipe-ingredients/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const recipeIngredient = insertRecipeIngredientSchema.partial().parse(req.body);
      const updated = await storage.updateRecipeIngredient(id, recipeIngredient);
      if (!updated) return res.status(404).json({ message: "Recipe ingredient not found" });
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid recipe ingredient data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update recipe ingredient" });
      }
    }
  });

  app.delete("/api/recipe-ingredients/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteRecipeIngredient(id);
      if (!deleted) return res.status(404).json({ message: "Recipe ingredient not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete recipe ingredient" });
    }
  });

  // ==================== INVENTORY ====================
  app.get("/api/inventory/low-stock", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const lowStockIngredients = await storage.getLowStockIngredients(userId);
      res.json(lowStockIngredients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock ingredients" });
    }
  });

  app.get("/api/inventory/logs", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { ingredientId } = req.query;
      const logs = await storage.getInventoryLogs(userId, ingredientId as string);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory logs" });
    }
  });

  app.post("/api/inventory/logs", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const log = insertInventoryLogSchema.parse(req.body);
      const newLog = await storage.addInventoryLog(log, userId);
      res.status(201).json(newLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid inventory log data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create inventory log" });
      }
    }
  });

  // ==================== STATS ====================
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const stats = await storage.getStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // ==================== COST CALCULATION ====================
  app.post("/api/recipes/:id/calculate-cost", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { scalingFactor = 1 } = req.body;
      const recipe = await storage.getRecipe(id);
      if (!recipe) return res.status(404).json({ message: "Recipe not found" });

      let totalCost = 0;
      for (const ri of recipe.recipeIngredients) {
        const ingredientCost = Number(ri.ingredient.costPerUnit) * Number(ri.quantity) * scalingFactor;
        totalCost += ingredientCost;
      }

      res.json({
        totalCost: totalCost.toFixed(2),
        costPerServing: totalCost.toFixed(2),
        scalingFactor,
        servings: scalingFactor
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate recipe cost" });
    }
  });

  // ==================== PRODUCTION PLANS ====================
  app.get("/api/production-plans", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const includeArchived = req.query.includeArchived === 'true';
      const plans = await storage.getProductionPlans(userId, includeArchived);
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch production plans" });
    }
  });

  app.get("/api/production-plans/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const plan = await storage.getProductionPlan(id);
      if (!plan) return res.status(404).json({ message: "Production plan not found" });
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch production plan" });
    }
  });

  app.post("/api/production-plans", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const plan = insertProductionPlanSchema.parse(req.body);
      const newPlan = await storage.createProductionPlan(plan, userId);
      res.status(201).json(newPlan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid production plan data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create production plan" });
      }
    }
  });

  app.put("/api/production-plans/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const plan = insertProductionPlanSchema.partial().parse(req.body);
      const updated = await storage.updateProductionPlan(id, plan);
      if (!updated) return res.status(404).json({ message: "Production plan not found" });
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid production plan data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update production plan" });
      }
    }
  });

  app.delete("/api/production-plans/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteProductionPlan(id);
      if (!deleted) return res.status(404).json({ message: "Production plan not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete production plan" });
    }
  });

  app.get("/api/production-plans/:id/print", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const plan = await storage.getProductionPlan(id);
      if (!plan) return res.status(404).json({ message: "Production plan not found" });

      const currentDate = new Date().toLocaleDateString('pl-PL');
      const currentTime = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

      const convertToGrams = (quantity: number, unit: string): number => {
        switch (unit) {
          case 'g': return quantity;
          case 'kg': return quantity * 1000;
          case 'ml': return quantity;
          case 'l': return quantity * 1000;
          case 'pcs': case 'szt': return quantity * 100;
          default: return quantity;
        }
      };

      const ingredientMap = new Map<string, { name: string; totalQuantity: number; unit: string; recipes: string[] }>();

      const recipeSections = plan.productionPlanRecipes.map((planRecipe: any, index: number) => {
        const recipe = planRecipe.recipe;
        const targetGrams = planRecipe.targetUnit === "kg"
          ? Number(planRecipe.targetWeight) * 1000
          : Number(planRecipe.targetWeight);
        const originalWeight = recipe.recipeIngredients.reduce((sum: number, ri: any) =>
          sum + convertToGrams(Number(ri.quantity), ri.unit), 0);
        const scaleFactor = originalWeight > 0 ? targetGrams / originalWeight : 1;

        const ingredientRows = recipe.recipeIngredients.map((ri: any) => {
          const scaled = (Number(ri.quantity) * scaleFactor).toFixed(1);
          const key = ri.ingredientId;
          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!;
            existing.totalQuantity += Number(ri.quantity) * scaleFactor;
            if (!existing.recipes.includes(recipe.name)) existing.recipes.push(recipe.name);
          } else {
            ingredientMap.set(key, {
              name: ri.ingredient.name,
              totalQuantity: Number(ri.quantity) * scaleFactor,
              unit: ri.unit,
              recipes: [recipe.name]
            });
          }
          return `<tr><td>${ri.ingredient.name}</td><td style="text-align:right;font-weight:bold">${scaled}</td><td>${ri.unit}</td></tr>`;
        }).join('');

        const instructionRows = (recipe.instructions || []).map((instr: string, i: number) =>
          `<li>${instr}</li>`).join('');

        return `
          <div class="recipe-card">
            <div class="recipe-header">
              <div class="recipe-name">${index + 1}. ${recipe.name}</div>
              <div class="recipe-meta">Cel: ${planRecipe.targetWeight} ${planRecipe.targetUnit} &nbsp;|&nbsp; Skala: ${scaleFactor.toFixed(2)}x</div>
            </div>
            <table class="ing-table">
              <thead><tr><th style="width:50%">Składnik</th><th style="width:25%">Ilość</th><th style="width:25%">Jed.</th></tr></thead>
              <tbody>${ingredientRows}</tbody>
            </table>
            ${instructionRows ? `<div class="instructions"><strong>Instrukcje:</strong><ol>${instructionRows}</ol></div>` : ''}
          </div>`;
      }).join('');

      const shoppingRows = Array.from(ingredientMap.values()).map(ing =>
        `<tr><td>${ing.name}</td><td style="text-align:right;font-weight:bold">${ing.totalQuantity.toFixed(1)} ${ing.unit}</td><td style="font-size:10px;color:#666">${ing.recipes.join(', ')}</td></tr>`
      ).join('');

      const html = `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Plan Produkcji - ${plan.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #000; background: #fff; padding: 10mm; }
  @media print {
    body { padding: 0; }
    .no-print { display: none !important; }
    .recipe-card { page-break-inside: avoid; }
  }
  h1 { font-size: 22px; font-weight: bold; margin-bottom: 4px; }
  .subtitle { font-size: 12px; color: #666; margin-bottom: 4px; }
  .date-info { font-size: 10px; color: #999; margin-bottom: 16px; }
  .summary { display: flex; gap: 24px; background: #f4f4f4; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; }
  .summary-item { text-align: center; }
  .summary-value { font-size: 22px; font-weight: bold; }
  .summary-label { font-size: 10px; color: #666; }
  h2 { font-size: 14px; font-weight: bold; border-bottom: 2px solid #333; padding-bottom: 4px; margin: 20px 0 12px; }
  .recipe-card { background: #f8f8f8; border: 1px solid #ddd; border-radius: 6px; padding: 12px; margin-bottom: 12px; }
  .recipe-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #ddd; }
  .recipe-name { font-size: 13px; font-weight: bold; }
  .recipe-meta { font-size: 10px; color: #666; text-align: right; }
  .ing-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px; }
  .ing-table th { background: #e0e0e0; padding: 5px 8px; text-align: left; border: 1px solid #ccc; }
  .ing-table td { padding: 4px 8px; border: 1px solid #ddd; background: #fff; }
  .instructions { font-size: 10px; margin-top: 8px; }
  .instructions ol { padding-left: 18px; margin-top: 4px; }
  .instructions li { margin-bottom: 3px; }
  .shopping { background: #f0f7f0; border: 2px solid #4a7c4a; border-radius: 8px; padding: 16px; margin-top: 20px; }
  .shopping-title { font-size: 16px; font-weight: bold; color: #2d5a2d; margin-bottom: 12px; text-align: center; }
  .shop-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .shop-table th { background: #4a7c4a; color: #fff; padding: 7px 8px; text-align: left; }
  .shop-table td { padding: 5px 8px; border-bottom: 1px solid #ccc; background: #fff; }
  .shop-table tr:nth-child(even) td { background: #f5f5f5; }
  .footer { margin-top: 24px; text-align: center; font-size: 9px; color: #aaa; border-top: 1px solid #eee; padding-top: 10px; }
  .print-btn { display: block; width: 100%; max-width: 320px; margin: 0 auto 12px; padding: 16px 28px; background: #16a34a; color: #fff; border: none; border-radius: 10px; font-size: 17px; font-weight: bold; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .print-btn:active { background: #15803d; }
  .ios-hint { background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px 16px; margin: 0 auto 16px; max-width: 480px; font-size: 13px; color: #78350f; line-height: 1.6; }
  .ios-hint b { display: block; margin-bottom: 4px; font-size: 14px; }
  .ios-hint ol { padding-left: 20px; margin-top: 4px; }
  .ios-hint li { margin-bottom: 2px; }
</style>
</head>
<body>
<div class="no-print" style="padding:16px 0;text-align:center">
  <button class="print-btn" onclick="window.print()">🖨️ Drukuj / Zapisz jako PDF</button>
  <div class="ios-hint" id="ios-hint" style="display:none">
    <b>📱 Jak zapisać PDF na iPhonie:</b>
    <ol>
      <li>Dotknij przycisku <b>Udostępnij</b> (kwadrat ze strzałką ↑) na dole Safari</li>
      <li>Przewiń w dół i wybierz <b>Drukuj</b></li>
      <li>Na ekranie podglądu wydruku — rozsuń dwa palce (powiększ miniaturę)</li>
      <li>Otworzy się plik PDF — dotknij <b>Udostępnij</b> ponownie</li>
      <li>Wybierz <b>Zapisz do Plików</b> i wskaż folder</li>
    </ol>
  </div>
</div>
<script>
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    document.getElementById('ios-hint').style.display = 'block';
  } else {
    window.onload = function() { window.print(); };
  }
</script>
<h1>${plan.name}</h1>
${plan.description ? `<div class="subtitle">${plan.description}</div>` : ''}
<div class="date-info">Wygenerowano: ${currentDate} o ${currentTime}</div>
<div class="summary">
  <div class="summary-item"><div class="summary-value">${plan.productionPlanRecipes.length}</div><div class="summary-label">Przepisy</div></div>
  <div class="summary-item"><div class="summary-value">${ingredientMap.size}</div><div class="summary-label">Składniki</div></div>
</div>
<h2>Przepisy (${plan.productionPlanRecipes.length})</h2>
${recipeSections}
<div class="shopping">
  <div class="shopping-title">Lista zakupów — suma składników</div>
  <table class="shop-table">
    <thead><tr><th style="width:40%">Składnik</th><th style="width:25%">Łącznie</th><th style="width:35%">Przepisy</th></tr></thead>
    <tbody>${shoppingRows}</tbody>
  </table>
</div>
<div class="footer">PastryPro — System zarządzania recepturami | Plan produkcji wygenerowany automatycznie</div>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate print view" });
    }
  });

  app.get("/api/production-plans-archived", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const plans = await storage.getArchivedProductionPlans(userId);
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch archived production plans" });
    }
  });

  app.put("/api/production-plans/:id/archive", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const archived = await storage.archiveProductionPlan(id);
      if (!archived) return res.status(404).json({ message: "Production plan not found" });
      res.json(archived);
    } catch (error) {
      res.status(500).json({ message: "Failed to archive production plan" });
    }
  });

  app.put("/api/production-plans/:id/unarchive", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const unarchived = await storage.unarchiveProductionPlan(id);
      if (!unarchived) return res.status(404).json({ message: "Production plan not found" });
      res.json(unarchived);
    } catch (error) {
      res.status(500).json({ message: "Failed to unarchive production plan" });
    }
  });

  app.post("/api/production-plans/:planId/recipes", requireAuth, async (req, res) => {
    try {
      const { planId } = req.params;
      const planRecipe = insertProductionPlanRecipeSchema.parse({ ...req.body, planId });
      const newPlanRecipe = await storage.addProductionPlanRecipe(planRecipe);
      res.status(201).json(newPlanRecipe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid production plan recipe data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add recipe to production plan" });
      }
    }
  });

  app.put("/api/production-plan-recipes/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const planRecipe = insertProductionPlanRecipeSchema.partial().parse(req.body);
      const updated = await storage.updateProductionPlanRecipe(id, planRecipe);
      if (!updated) return res.status(404).json({ message: "Production plan recipe not found" });
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid production plan recipe data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update production plan recipe" });
      }
    }
  });

  app.delete("/api/production-plan-recipes/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteProductionPlanRecipe(id);
      if (!deleted) return res.status(404).json({ message: "Production plan recipe not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete production plan recipe" });
    }
  });

  // Nutrition
  app.get("/api/recipes/:id/nutrition", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const recipe = await storage.getRecipe(id);
      if (!recipe) return res.status(404).json({ message: "Recipe not found" });

      let totalCalories = 0, totalProtein = 0, totalFat = 0, totalCarbs = 0, totalFiber = 0, totalWeightG = 0;

      for (const ri of recipe.recipeIngredients) {
        const ing = ri.ingredient;
        let weightG = 0;
        const qty = Number(ri.quantity);
        const unit = ri.unit.toLowerCase();
        if (unit === 'g') weightG = qty;
        else if (unit === 'kg') weightG = qty * 1000;
        else if (unit === 'ml') weightG = qty * Number(ing.densityGPerMl || 1);
        else if (unit === 'l') weightG = qty * 1000 * Number(ing.densityGPerMl || 1);
        else if (unit === 'pcs' || unit === 'szt') weightG = qty * Number(ing.weightPerPieceG || 0);
        else weightG = qty;

        totalWeightG += weightG;
        const factor = weightG / 100;
        if (ing.caloriesPer100g) totalCalories += Number(ing.caloriesPer100g) * factor;
        if (ing.proteinPer100g) totalProtein += Number(ing.proteinPer100g) * factor;
        if (ing.fatPer100g) totalFat += Number(ing.fatPer100g) * factor;
        if (ing.carbsPer100g) totalCarbs += Number(ing.carbsPer100g) * factor;
        if (ing.fiberPer100g) totalFiber += Number(ing.fiberPer100g) * factor;
      }

      res.json({
        totalCalories: Math.round(totalCalories),
        totalProtein: Math.round(totalProtein * 10) / 10,
        totalFat: Math.round(totalFat * 10) / 10,
        totalCarbs: Math.round(totalCarbs * 10) / 10,
        totalFiber: Math.round(totalFiber * 10) / 10,
        totalWeightG: Math.round(totalWeightG),
        per100g: totalWeightG > 0 ? {
          calories: Math.round(totalCalories / totalWeightG * 100),
          protein: Math.round(totalProtein / totalWeightG * 100 * 10) / 10,
          fat: Math.round(totalFat / totalWeightG * 100 * 10) / 10,
          carbs: Math.round(totalCarbs / totalWeightG * 100 * 10) / 10,
          fiber: Math.round(totalFiber / totalWeightG * 100 * 10) / 10,
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate nutrition" });
    }
  });

  // Register AI chat routes
  registerChatRoutes(app);
  registerImageRoutes(app);
  registerAIRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
