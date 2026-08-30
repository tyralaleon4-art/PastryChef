import { 
  users, 
  categories, 
  ingredientCategories,
  ingredients, 
  recipes, 
  recipeIngredients, 
  inventoryLogs,
  productionPlans,
  productionPlanRecipes,
  type User, 
  type InsertUser,
  type Category,
  type InsertCategory,
  type IngredientCategory,
  type InsertIngredientCategory,
  type Ingredient,
  type InsertIngredient,
  type Recipe,
  type InsertRecipe,
  type RecipeIngredient,
  type InsertRecipeIngredient,
  type InventoryLog,
  type InsertInventoryLog,
  type ProductionPlan,
  type InsertProductionPlan,
  type ProductionPlanRecipe,
  type InsertProductionPlanRecipe,
  type RecipeWithDetails,
  type IngredientWithStock,
  type ProductionPlanWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, and, lt, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Categories
  getCategories(userId: string): Promise<Category[]>;
  createCategory(category: InsertCategory, userId: string): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>, userId: string): Promise<Category | undefined>;
  deleteCategory(id: string, userId: string): Promise<boolean>;

  // Ingredient Categories
  getIngredientCategories(userId: string): Promise<IngredientCategory[]>;
  createIngredientCategory(category: InsertIngredientCategory, userId: string): Promise<IngredientCategory>;
  updateIngredientCategory(id: string, category: Partial<InsertIngredientCategory>, userId: string): Promise<IngredientCategory | undefined>;
  getIngredientCategoryUsage(id: string, userId: string): Promise<number | undefined>;
  deleteIngredientCategory(id: string, userId: string, replacementCategoryId?: string | null): Promise<boolean>;

  // Ingredients
  getIngredients(userId: string, search?: string): Promise<IngredientWithStock[]>;
  getIngredient(id: string, userId: string): Promise<Ingredient | undefined>;
  createIngredient(ingredient: InsertIngredient, userId: string): Promise<Ingredient>;
  updateIngredient(id: string, ingredient: Partial<InsertIngredient>, userId: string): Promise<Ingredient | undefined>;
  deleteIngredient(id: string, userId: string): Promise<boolean>;

  // Recipes
  getRecipes(userId: string, search?: string, categoryId?: string): Promise<RecipeWithDetails[]>;
  getRecipe(id: string, userId: string): Promise<RecipeWithDetails | undefined>;
  createRecipe(recipe: InsertRecipe, userId: string): Promise<Recipe>;
  updateRecipe(id: string, recipe: Partial<InsertRecipe>, userId: string): Promise<Recipe | undefined>;
  createRecipeWithIngredients(recipe: InsertRecipe, recipeIngredients: InsertRecipeIngredient[], userId: string): Promise<RecipeWithDetails>;
  updateRecipeWithIngredients(id: string, recipe: Partial<InsertRecipe>, recipeIngredients: InsertRecipeIngredient[] | undefined, userId: string): Promise<RecipeWithDetails | undefined>;
  deleteRecipe(id: string, userId: string): Promise<boolean>;

  // Recipe Ingredients
  getRecipeIngredients(recipeId: string, userId: string): Promise<(RecipeIngredient & { ingredient: Ingredient })[]>;
  addRecipeIngredient(recipeIngredient: InsertRecipeIngredient, userId: string): Promise<RecipeIngredient>;
  updateRecipeIngredient(id: string, recipeIngredient: Partial<InsertRecipeIngredient>, userId: string): Promise<RecipeIngredient | undefined>;
  deleteRecipeIngredient(id: string, userId: string): Promise<boolean>;
  replaceRecipeIngredients(recipeId: string, ingredients: InsertRecipeIngredient[], userId: string): Promise<RecipeIngredient[]>;

  // Inventory
  getLowStockIngredients(userId: string): Promise<IngredientWithStock[]>;
  getInventoryLogs(userId: string, ingredientId?: string): Promise<(InventoryLog & { ingredient: Ingredient })[]>;
  addInventoryLog(log: InsertInventoryLog, userId: string): Promise<InventoryLog>;

  // Production Plans
  getProductionPlans(userId: string, includeArchived?: boolean): Promise<ProductionPlanWithDetails[]>;
  getArchivedProductionPlans(userId: string): Promise<ProductionPlanWithDetails[]>;
  getProductionPlan(id: string, userId: string): Promise<ProductionPlanWithDetails | undefined>;
  createProductionPlan(plan: InsertProductionPlan, userId: string): Promise<ProductionPlan>;
  updateProductionPlan(id: string, plan: Partial<InsertProductionPlan>, userId: string): Promise<ProductionPlan | undefined>;
  archiveProductionPlan(id: string, userId: string): Promise<ProductionPlan | undefined>;
  unarchiveProductionPlan(id: string, userId: string): Promise<ProductionPlan | undefined>;
  deleteProductionPlan(id: string, userId: string): Promise<boolean>;

  // Production Plan Recipes
  addProductionPlanRecipe(planRecipe: InsertProductionPlanRecipe, userId: string): Promise<ProductionPlanRecipe>;
  updateProductionPlanRecipe(id: string, planRecipe: Partial<InsertProductionPlanRecipe>, userId: string): Promise<ProductionPlanRecipe | undefined>;
  deleteProductionPlanRecipe(id: string, userId: string): Promise<boolean>;

  // Statistics
  getStats(userId: string): Promise<{
    totalRecipes: number;
    activeIngredients: number;
    lowStockItems: number;
    totalCategories: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      sql`lower(${users.username}) = lower(${username})`
    );
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.createdAt));
  }

  async getCategories(userId: string): Promise<Category[]> {
    return await db.select().from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(asc(categories.name));
  }

  async createCategory(category: InsertCategory, userId: string): Promise<Category> {
    const [newCategory] = await db.insert(categories).values({ ...category, userId }).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>, userId: string): Promise<Category | undefined> {
    const [updated] = await db.update(categories).set(category)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteCategory(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getIngredientCategories(userId: string): Promise<IngredientCategory[]> {
    return await db.select().from(ingredientCategories)
      .where(eq(ingredientCategories.userId, userId))
      .orderBy(asc(ingredientCategories.name));
  }

  async createIngredientCategory(category: InsertIngredientCategory, userId: string): Promise<IngredientCategory> {
    const [newCategory] = await db.insert(ingredientCategories).values({ ...category, userId }).returning();
    return newCategory;
  }

  async updateIngredientCategory(id: string, category: Partial<InsertIngredientCategory>, userId: string): Promise<IngredientCategory | undefined> {
    const [updated] = await db.update(ingredientCategories).set(category)
      .where(and(eq(ingredientCategories.id, id), eq(ingredientCategories.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async getIngredientCategoryUsage(id: string, userId: string): Promise<number | undefined> {
    const [category] = await db.select({ id: ingredientCategories.id })
      .from(ingredientCategories)
      .where(and(eq(ingredientCategories.id, id), eq(ingredientCategories.userId, userId)));
    if (!category) return undefined;
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(ingredients)
      .where(and(eq(ingredients.categoryId, id), eq(ingredients.userId, userId)));
    return Number(result?.count ?? 0);
  }

  async deleteIngredientCategory(id: string, userId: string, replacementCategoryId?: string | null): Promise<boolean> {
    return await db.transaction(async (tx) => {
      const [category] = await tx.select({ id: ingredientCategories.id }).from(ingredientCategories)
        .where(and(eq(ingredientCategories.id, id), eq(ingredientCategories.userId, userId)));
      if (!category) return false;
      if (replacementCategoryId) {
        const [replacement] = await tx.select({ id: ingredientCategories.id }).from(ingredientCategories)
          .where(and(eq(ingredientCategories.id, replacementCategoryId), eq(ingredientCategories.userId, userId)));
        if (!replacement) return false;
      }
      await tx.update(ingredients).set({ categoryId: replacementCategoryId ?? null })
        .where(and(eq(ingredients.categoryId, id), eq(ingredients.userId, userId)));
      const result = await tx.delete(ingredientCategories)
        .where(and(eq(ingredientCategories.id, id), eq(ingredientCategories.userId, userId)));
      return (result.rowCount ?? 0) > 0;
    });
  }

  // ── Normalize null JSON arrays from legacy DB rows ─────────────────────────
  private normalizeIngredient<T extends Ingredient>(ing: T): T {
    return { ...ing, allergens: ing.allergens ?? [] };
  }

  private normalizeRecipe<T extends Recipe>(r: T): T {
    return { ...r, allergens: r.allergens ?? [], instructions: r.instructions ?? [] };
  }

  private normalizePlanRecipe<T extends { completedIngredients: string[] | null; completedInstructions: number[] | null }>(pr: T): T {
    return {
      ...pr,
      completedIngredients: pr.completedIngredients ?? [],
      completedInstructions: pr.completedInstructions ?? [],
    };
  }
  // ───────────────────────────────────────────────────────────────────────────

  private async assertOwnedIngredientCategory(categoryId: string | null | undefined, userId: string): Promise<void> {
    if (!categoryId) return;
    const [category] = await db.select({ id: ingredientCategories.id }).from(ingredientCategories)
      .where(and(eq(ingredientCategories.id, categoryId), eq(ingredientCategories.userId, userId)));
    if (!category) throw new Error("Ingredient category does not belong to user");
  }
  private async assertOwnedRecipeCategory(categoryId: string | null | undefined, userId: string): Promise<void> {
    if (!categoryId) return;
    const [category] = await db.select({ id: categories.id }).from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));
    if (!category) throw new Error("Recipe category does not belong to user");
  }

  async getIngredients(userId: string, search?: string): Promise<IngredientWithStock[]> {
    const results = await db.query.ingredients.findMany({
      where: search
        ? and(eq(ingredients.userId, userId), ilike(ingredients.name, `%${search}%`))
        : eq(ingredients.userId, userId),
      with: {
        category: true
      },
      orderBy: asc(ingredients.name)
    });
    
    return results.map(ingredient => ({
      ...this.normalizeIngredient(ingredient),
      stockStatus: this.determineStockStatus(ingredient)
    }));
  }

  private determineStockStatus(ingredient: Ingredient): "low" | "normal" | "expired" {
    if (ingredient.expiryDate && new Date(ingredient.expiryDate) < new Date()) {
      return "expired";
    }
    if (Number(ingredient.currentStock) <= Number(ingredient.minimumStock)) {
      return "low";
    }
    return "normal";
  }

  async getIngredient(id: string, userId: string): Promise<Ingredient | undefined> {
    const [ingredient] = await db.select().from(ingredients).where(and(eq(ingredients.id, id), eq(ingredients.userId, userId)));
    return ingredient ? this.normalizeIngredient(ingredient) : undefined;
  }

  async createIngredient(ingredient: InsertIngredient, userId: string): Promise<Ingredient> {
    await this.assertOwnedIngredientCategory(ingredient.categoryId, userId);
    const [newIngredient] = await db.insert(ingredients).values({
      ...ingredient,
      userId,
      allergens: ingredient.allergens ?? []
    }).returning();
    return newIngredient;
  }

  async updateIngredient(id: string, ingredient: Partial<InsertIngredient>, userId: string): Promise<Ingredient | undefined> {
    if (ingredient.categoryId !== undefined) {
      await this.assertOwnedIngredientCategory(ingredient.categoryId, userId);
    }
    const updateData: Partial<typeof ingredients.$inferInsert> = { ...ingredient };
    if (ingredient.allergens !== undefined) updateData.allergens = ingredient.allergens;
    const [updated] = await db.update(ingredients).set(updateData)
      .where(and(eq(ingredients.id, id), eq(ingredients.userId, userId))).returning();
    return updated || undefined;
  }

  async deleteIngredient(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(ingredients).where(and(eq(ingredients.id, id), eq(ingredients.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getRecipes(userId: string, search?: string, categoryId?: string): Promise<RecipeWithDetails[]> {
    let whereConditions: any[] = [eq(recipes.isActive, true), eq(recipes.userId, userId)];
    
    if (search) {
      whereConditions.push(ilike(recipes.name, `%${search}%`));
    }
    
    if (categoryId) {
      whereConditions.push(eq(recipes.categoryId, categoryId));
    }

    const results = await db.query.recipes.findMany({
      where: and(...whereConditions),
      with: {
        category: true,
        recipeIngredients: {
          with: {
            ingredient: true
          }
        }
      },
      orderBy: desc(recipes.updatedAt)
    });

    return results.map(r => ({
      ...this.normalizeRecipe(r),
      recipeIngredients: r.recipeIngredients.map(ri => ({
        ...ri,
        ingredient: this.normalizeIngredient(ri.ingredient)
      }))
    }));
  }

  async getRecipe(id: string, userId: string): Promise<RecipeWithDetails | undefined> {
    const result = await db.query.recipes.findFirst({
      where: and(eq(recipes.id, id), eq(recipes.userId, userId)),
      with: {
        category: true,
        recipeIngredients: {
          with: {
            ingredient: true
          }
        }
      }
    });

    if (!result) return undefined;
    return {
      ...this.normalizeRecipe(result),
      recipeIngredients: result.recipeIngredients.map(ri => ({
        ...ri,
        ingredient: this.normalizeIngredient(ri.ingredient)
      }))
    };
  }

  async createRecipe(recipe: InsertRecipe, userId: string): Promise<Recipe> {
    await this.assertOwnedRecipeCategory(recipe.categoryId, userId);
    const [newRecipe] = await db.insert(recipes).values({
      ...recipe,
      userId,
      allergens: recipe.allergens ?? [],
      instructions: recipe.instructions ?? []
    }).returning();
    return newRecipe;
  }

  async updateRecipe(id: string, recipe: Partial<InsertRecipe>, userId: string): Promise<Recipe | undefined> {
    if (recipe.categoryId !== undefined) await this.assertOwnedRecipeCategory(recipe.categoryId, userId);
    const updateData: Partial<typeof recipes.$inferInsert> = { ...recipe, updatedAt: new Date() };
    if (recipe.allergens !== undefined) updateData.allergens = recipe.allergens;
    if (recipe.instructions !== undefined) updateData.instructions = recipe.instructions;
    const [updated] = await db.update(recipes).set(updateData).where(and(eq(recipes.id, id), eq(recipes.userId, userId))).returning();
    return updated || undefined;
  }

  async createRecipeWithIngredients(recipe: InsertRecipe, ingredientsList: InsertRecipeIngredient[], userId: string): Promise<RecipeWithDetails> {
    const recipeId = await db.transaction(async tx => {
      if (recipe.categoryId) {
        const [category] = await tx.select({ id: categories.id }).from(categories)
          .where(and(eq(categories.id, recipe.categoryId), eq(categories.userId, userId)));
        if (!category) throw new Error("Recipe category does not belong to user");
      }
      for (const item of ingredientsList) {
        const [ingredient] = await tx.select({ id: ingredients.id }).from(ingredients)
          .where(and(eq(ingredients.id, item.ingredientId), eq(ingredients.userId, userId)));
        if (!ingredient) throw new Error("Ingredient does not belong to user");
      }
      const [created] = await tx.insert(recipes).values({
        ...recipe,
        userId,
        allergens: recipe.allergens ?? [],
        instructions: recipe.instructions ?? [],
      }).returning({ id: recipes.id });
      if (ingredientsList.length) {
        await tx.insert(recipeIngredients).values(ingredientsList.map(item => ({
          ...item,
          recipeId: created.id,
        })));
      }
      return created.id;
    });
    const created = await this.getRecipe(recipeId, userId);
    if (!created) throw new Error("Created recipe could not be loaded");
    return created;
  }

  async updateRecipeWithIngredients(id: string, recipe: Partial<InsertRecipe>, ingredientsList: InsertRecipeIngredient[] | undefined, userId: string): Promise<RecipeWithDetails | undefined> {
    const updatedId = await db.transaction(async tx => {
      const [existing] = await tx.select({ id: recipes.id }).from(recipes)
        .where(and(eq(recipes.id, id), eq(recipes.userId, userId)));
      if (!existing) return undefined;
      if (recipe.categoryId !== undefined && recipe.categoryId !== null) {
        const [category] = await tx.select({ id: categories.id }).from(categories)
          .where(and(eq(categories.id, recipe.categoryId), eq(categories.userId, userId)));
        if (!category) throw new Error("Recipe category does not belong to user");
      }
      if (ingredientsList) {
        for (const item of ingredientsList) {
          const [ingredient] = await tx.select({ id: ingredients.id }).from(ingredients)
            .where(and(eq(ingredients.id, item.ingredientId), eq(ingredients.userId, userId)));
          if (!ingredient) throw new Error("Ingredient does not belong to user");
        }
      }
      const updateData: Partial<typeof recipes.$inferInsert> = { ...recipe, updatedAt: new Date() };
      if (recipe.allergens !== undefined) updateData.allergens = recipe.allergens;
      if (recipe.instructions !== undefined) updateData.instructions = recipe.instructions;
      const [updated] = await tx.update(recipes).set(updateData)
        .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
        .returning({ id: recipes.id });
      if (!updated) throw new Error("Recipe no longer belongs to user");
      if (ingredientsList) {
        await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
        if (ingredientsList.length) {
          await tx.insert(recipeIngredients).values(ingredientsList.map(item => ({ ...item, recipeId: id })));
        }
      }
      return id;
    });
    return updatedId ? await this.getRecipe(updatedId, userId) : undefined;
  }

  async deleteRecipe(id: string, userId: string): Promise<boolean> {
    const [updated] = await db.update(recipes).set({ isActive: false }).where(and(eq(recipes.id, id), eq(recipes.userId, userId))).returning();
    return !!updated;
  }

  async getRecipeIngredients(recipeId: string, userId: string): Promise<(RecipeIngredient & { ingredient: Ingredient })[]> {
    const [recipe] = await db.select({ id: recipes.id }).from(recipes)
      .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)));
    if (!recipe) return [];
    const results = await db.query.recipeIngredients.findMany({
      where: eq(recipeIngredients.recipeId, recipeId),
      with: {
        ingredient: true
      }
    });

    return results;
  }

  async addRecipeIngredient(recipeIngredient: InsertRecipeIngredient, userId: string): Promise<RecipeIngredient> {
    return db.transaction(async tx => {
      const [recipe] = await tx.select({ id: recipes.id }).from(recipes).where(and(eq(recipes.id, recipeIngredient.recipeId), eq(recipes.userId, userId)));
      const [ingredient] = await tx.select({ id: ingredients.id }).from(ingredients).where(and(eq(ingredients.id, recipeIngredient.ingredientId), eq(ingredients.userId, userId)));
      if (!recipe || !ingredient) throw new Error("Recipe or ingredient does not belong to user");
      const [created] = await tx.insert(recipeIngredients).values(recipeIngredient).returning();
      return created;
    });
  }

  async updateRecipeIngredient(id: string, recipeIngredient: Partial<InsertRecipeIngredient>, userId: string): Promise<RecipeIngredient | undefined> {
    return db.transaction(async tx => {
      const [existing] = await tx.select({ id: recipeIngredients.id, recipeId: recipeIngredients.recipeId }).from(recipeIngredients)
        .innerJoin(recipes, eq(recipeIngredients.recipeId, recipes.id)).where(and(eq(recipeIngredients.id, id), eq(recipes.userId, userId)));
      if (!existing) return undefined;
      const targetRecipeId = recipeIngredient.recipeId ?? existing.recipeId;
      const [recipe] = await tx.select({ id: recipes.id }).from(recipes).where(and(eq(recipes.id, targetRecipeId), eq(recipes.userId, userId)));
      if (!recipe) throw new Error("Recipe does not belong to user");
      if (recipeIngredient.ingredientId) {
        const [ingredient] = await tx.select({ id: ingredients.id }).from(ingredients).where(and(eq(ingredients.id, recipeIngredient.ingredientId), eq(ingredients.userId, userId)));
        if (!ingredient) throw new Error("Ingredient does not belong to user");
      }
      const [updated] = await tx.update(recipeIngredients).set(recipeIngredient).where(eq(recipeIngredients.id, id)).returning();
      return updated || undefined;
    });
  }

  async deleteRecipeIngredient(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(recipeIngredients).where(and(eq(recipeIngredients.id, id), sql`EXISTS (SELECT 1 FROM recipes WHERE recipes.id = ${recipeIngredients.recipeId} AND recipes.user_id = ${userId})`));
    return (result.rowCount ?? 0) > 0;
  }

  async replaceRecipeIngredients(recipeId: string, ingredientsList: InsertRecipeIngredient[], userId: string): Promise<RecipeIngredient[]> {
    return await db.transaction(async (tx) => {
      const [recipe] = await tx.select({ id: recipes.id }).from(recipes).where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)));
      if (!recipe) throw new Error("Recipe does not belong to user");
      for (const item of ingredientsList) {
        const [ingredient] = await tx.select({ id: ingredients.id }).from(ingredients).where(and(eq(ingredients.id, item.ingredientId), eq(ingredients.userId, userId)));
        if (!ingredient) throw new Error("Ingredient does not belong to user");
      }
      await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));
      
      if (ingredientsList.length === 0) {
        return [];
      }
      
      const newRecipeIngredients = await tx.insert(recipeIngredients)
        .values(ingredientsList.map(ingredient => ({
          ...ingredient,
          recipeId
        })))
        .returning();
      
      return newRecipeIngredients;
    });
  }

  async getLowStockIngredients(userId: string): Promise<IngredientWithStock[]> {
    const results = await db.query.ingredients.findMany({
      where: eq(ingredients.userId, userId),
      with: { category: true },
      orderBy: asc(ingredients.name)
    });
    
    return results
      .map(ingredient => ({
        ...this.normalizeIngredient(ingredient),
        stockStatus: this.determineStockStatus(ingredient)
      }))
      .filter(ingredient => ingredient.stockStatus === "low" || ingredient.stockStatus === "expired");
  }

  async getInventoryLogs(userId: string, ingredientId?: string): Promise<(InventoryLog & { ingredient: Ingredient })[]> {
    let whereCondition: any = eq(inventoryLogs.userId, userId);
    if (ingredientId) {
      whereCondition = and(eq(inventoryLogs.userId, userId), eq(inventoryLogs.ingredientId, ingredientId));
    }

    const results = await db.query.inventoryLogs.findMany({
      where: whereCondition,
      with: {
        ingredient: true
      },
      orderBy: desc(inventoryLogs.createdAt)
    });

    return results;
  }

  async addInventoryLog(log: InsertInventoryLog, userId: string): Promise<InventoryLog> {
    const ingredient = await this.getIngredient(log.ingredientId, userId);
    if (!ingredient) throw new Error("Ingredient does not belong to user");
    const [newLog] = await db.insert(inventoryLogs).values({ ...log, userId }).returning();
    return newLog;
  }

  async getProductionPlans(userId: string, includeArchived: boolean = false): Promise<ProductionPlanWithDetails[]> {
    const whereConditions: any[] = [eq(productionPlans.userId, userId)];
    if (!includeArchived) whereConditions.push(eq(productionPlans.archived, false));
    
    const results = await db.query.productionPlans.findMany({
      where: and(...whereConditions),
      with: {
        productionPlanRecipes: {
          with: {
            recipe: {
              with: {
                category: true,
                recipeIngredients: { with: { ingredient: true } }
              }
            }
          }
        }
      },
      orderBy: desc(productionPlans.createdAt)
    });

    return results.map(plan => this.normalizePlan(plan));
  }

  async getArchivedProductionPlans(userId: string): Promise<ProductionPlanWithDetails[]> {
    const results = await db.query.productionPlans.findMany({
      where: and(eq(productionPlans.userId, userId), eq(productionPlans.archived, true)),
      with: {
        productionPlanRecipes: {
          with: {
            recipe: {
              with: {
                category: true,
                recipeIngredients: { with: { ingredient: true } }
              }
            }
          }
        }
      },
      orderBy: desc(productionPlans.createdAt)
    });

    return results.map(plan => this.normalizePlan(plan));
  }

  async getProductionPlan(id: string, userId: string): Promise<ProductionPlanWithDetails | undefined> {
    const result = await db.query.productionPlans.findFirst({
      where: and(eq(productionPlans.id, id), eq(productionPlans.userId, userId)),
      with: {
        productionPlanRecipes: {
          with: {
            recipe: {
              with: {
                category: true,
                recipeIngredients: { with: { ingredient: true } }
              }
            }
          }
        }
      }
    });

    return result ? this.normalizePlan(result) : undefined;
  }

  private normalizePlan(plan: any): ProductionPlanWithDetails {
    return {
      ...plan,
      productionPlanRecipes: plan.productionPlanRecipes.map((pr: any) => ({
        ...this.normalizePlanRecipe(pr),
        recipe: {
          ...this.normalizeRecipe(pr.recipe),
          recipeIngredients: pr.recipe.recipeIngredients.map((ri: any) => ({
            ...ri,
            ingredient: this.normalizeIngredient(ri.ingredient)
          }))
        }
      }))
    };
  }

  async createProductionPlan(plan: InsertProductionPlan, userId: string): Promise<ProductionPlan> {
    const [newPlan] = await db.insert(productionPlans).values({ ...plan, userId }).returning();
    return newPlan;
  }

  async updateProductionPlan(id: string, plan: Partial<InsertProductionPlan>, userId: string): Promise<ProductionPlan | undefined> {
    const updateData: Partial<typeof productionPlans.$inferInsert> = { 
      ...plan, 
      updatedAt: new Date() 
    };
    const [updated] = await db.update(productionPlans).set(updateData).where(and(eq(productionPlans.id, id), eq(productionPlans.userId, userId))).returning();
    return updated || undefined;
  }

  async archiveProductionPlan(id: string, userId: string): Promise<ProductionPlan | undefined> {
    const [updated] = await db.update(productionPlans)
      .set({ archived: true, updatedAt: new Date() })
      .where(and(eq(productionPlans.id, id), eq(productionPlans.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async unarchiveProductionPlan(id: string, userId: string): Promise<ProductionPlan | undefined> {
    const [updated] = await db.update(productionPlans)
      .set({ archived: false, updatedAt: new Date() })
      .where(and(eq(productionPlans.id, id), eq(productionPlans.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteProductionPlan(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(productionPlans).where(and(eq(productionPlans.id, id), eq(productionPlans.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async addProductionPlanRecipe(planRecipe: InsertProductionPlanRecipe, userId: string): Promise<ProductionPlanRecipe> {
    return db.transaction(async tx => {
    const [plan] = await tx.select({ id: productionPlans.id }).from(productionPlans).where(and(eq(productionPlans.id, planRecipe.planId), eq(productionPlans.userId, userId)));
    const [recipe] = await tx.select({ id: recipes.id }).from(recipes).where(and(eq(recipes.id, planRecipe.recipeId), eq(recipes.userId, userId)));
    if (!plan || !recipe) throw new Error("Plan or recipe does not belong to user");
    const [newPlanRecipe] = await tx.insert(productionPlanRecipes).values({
      ...planRecipe,
      completedIngredients: planRecipe.completedIngredients ?? [],
      completedInstructions: planRecipe.completedInstructions ?? []
    }).returning();
    return newPlanRecipe;
    });
  }

  async updateProductionPlanRecipe(id: string, planRecipe: Partial<InsertProductionPlanRecipe>, userId: string): Promise<ProductionPlanRecipe | undefined> {
    const updateData: Partial<typeof productionPlanRecipes.$inferInsert> = { ...planRecipe };
    if (planRecipe.completedIngredients !== undefined) updateData.completedIngredients = planRecipe.completedIngredients;
    if (planRecipe.completedInstructions !== undefined) updateData.completedInstructions = planRecipe.completedInstructions;
    return db.transaction(async tx => {
      const [existing] = await tx.select({ id: productionPlanRecipes.id, planId: productionPlanRecipes.planId }).from(productionPlanRecipes).innerJoin(productionPlans, eq(productionPlanRecipes.planId, productionPlans.id)).where(and(eq(productionPlanRecipes.id, id), eq(productionPlans.userId, userId)));
      if (!existing) return undefined;
      const targetPlan = planRecipe.planId ?? existing.planId;
      const [plan] = await tx.select({ id: productionPlans.id }).from(productionPlans).where(and(eq(productionPlans.id, targetPlan), eq(productionPlans.userId, userId)));
      if (!plan) throw new Error("Plan does not belong to user");
      if (planRecipe.recipeId) { const [recipe] = await tx.select({ id: recipes.id }).from(recipes).where(and(eq(recipes.id, planRecipe.recipeId), eq(recipes.userId, userId))); if (!recipe) throw new Error("Recipe does not belong to user"); }
      const [updated] = await tx.update(productionPlanRecipes).set(updateData).where(eq(productionPlanRecipes.id, id)).returning();
      return updated || undefined;
    });
  }

  async deleteProductionPlanRecipe(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(productionPlanRecipes).where(and(eq(productionPlanRecipes.id, id), sql`EXISTS (SELECT 1 FROM production_plans WHERE production_plans.id = ${productionPlanRecipes.planId} AND production_plans.user_id = ${userId})`));
    return (result.rowCount ?? 0) > 0;
  }

  async getStats(userId: string): Promise<{
    totalRecipes: number;
    activeIngredients: number;
    lowStockItems: number;
    totalCategories: number;
  }> {
    const [recipesCount] = await db.select({ count: sql<number>`count(*)` })
      .from(recipes)
      .where(and(eq(recipes.isActive, true), eq(recipes.userId, userId)));
    const [ingredientsCount] = await db.select({ count: sql<number>`count(*)` })
      .from(ingredients).where(eq(ingredients.userId, userId));
    const [categoriesCount] = await db.select({ count: sql<number>`count(*)` })
      .from(categories)
      .where(eq(categories.userId, userId));
    
    const lowStockIngredients = await this.getLowStockIngredients(userId);

    return {
      totalRecipes: Number(recipesCount?.count || 0),
      activeIngredients: Number(ingredientsCount?.count || 0),
      lowStockItems: lowStockIngredients.length,
      totalCategories: Number(categoriesCount?.count || 0)
    };
  }
}

export const storage = new DatabaseStorage();
