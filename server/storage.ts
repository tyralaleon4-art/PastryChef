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

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Ingredient Categories
  getIngredientCategories(): Promise<IngredientCategory[]>;
  createIngredientCategory(category: InsertIngredientCategory): Promise<IngredientCategory>;
  updateIngredientCategory(id: string, category: Partial<InsertIngredientCategory>): Promise<IngredientCategory | undefined>;
  deleteIngredientCategory(id: string): Promise<boolean>;

  // Ingredients
  getIngredients(search?: string): Promise<IngredientWithStock[]>;
  getIngredient(id: string): Promise<Ingredient | undefined>;
  createIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  updateIngredient(id: string, ingredient: Partial<InsertIngredient>): Promise<Ingredient | undefined>;
  deleteIngredient(id: string): Promise<boolean>;

  // Recipes
  getRecipes(search?: string, categoryId?: string): Promise<RecipeWithDetails[]>;
  getRecipe(id: string): Promise<RecipeWithDetails | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: string, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: string): Promise<boolean>;

  // Recipe Ingredients
  getRecipeIngredients(recipeId: string): Promise<(RecipeIngredient & { ingredient: Ingredient })[]>;
  addRecipeIngredient(recipeIngredient: InsertRecipeIngredient): Promise<RecipeIngredient>;
  updateRecipeIngredient(id: string, recipeIngredient: Partial<InsertRecipeIngredient>): Promise<RecipeIngredient | undefined>;
  deleteRecipeIngredient(id: string): Promise<boolean>;
  replaceRecipeIngredients(recipeId: string, ingredients: InsertRecipeIngredient[]): Promise<RecipeIngredient[]>;

  // Inventory
  getLowStockIngredients(): Promise<IngredientWithStock[]>;
  getInventoryLogs(ingredientId?: string): Promise<(InventoryLog & { ingredient: Ingredient })[]>;
  addInventoryLog(log: InsertInventoryLog): Promise<InventoryLog>;

  // Production Plans
  getProductionPlans(includeArchived?: boolean): Promise<ProductionPlanWithDetails[]>;
  getArchivedProductionPlans(): Promise<ProductionPlanWithDetails[]>;
  getProductionPlan(id: string): Promise<ProductionPlanWithDetails | undefined>;
  createProductionPlan(plan: InsertProductionPlan): Promise<ProductionPlan>;
  updateProductionPlan(id: string, plan: Partial<InsertProductionPlan>): Promise<ProductionPlan | undefined>;
  archiveProductionPlan(id: string): Promise<ProductionPlan | undefined>;
  unarchiveProductionPlan(id: string): Promise<ProductionPlan | undefined>;
  deleteProductionPlan(id: string): Promise<boolean>;

  // Production Plan Recipes
  addProductionPlanRecipe(planRecipe: InsertProductionPlanRecipe): Promise<ProductionPlanRecipe>;
  updateProductionPlanRecipe(id: string, planRecipe: Partial<InsertProductionPlanRecipe>): Promise<ProductionPlanRecipe | undefined>;
  deleteProductionPlanRecipe(id: string): Promise<boolean>;

  // Statistics
  getStats(): Promise<{
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
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return updated || undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getIngredientCategories(): Promise<IngredientCategory[]> {
    return await db.select().from(ingredientCategories).orderBy(asc(ingredientCategories.name));
  }

  async createIngredientCategory(category: InsertIngredientCategory): Promise<IngredientCategory> {
    const [newCategory] = await db.insert(ingredientCategories).values(category).returning();
    return newCategory;
  }

  async updateIngredientCategory(id: string, category: Partial<InsertIngredientCategory>): Promise<IngredientCategory | undefined> {
    const [updated] = await db.update(ingredientCategories).set(category).where(eq(ingredientCategories.id, id)).returning();
    return updated || undefined;
  }

  async deleteIngredientCategory(id: string): Promise<boolean> {
    const result = await db.delete(ingredientCategories).where(eq(ingredientCategories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getIngredients(search?: string): Promise<IngredientWithStock[]> {
    let whereCondition = undefined;
    
    if (search) {
      whereCondition = ilike(ingredients.name, `%${search}%`);
    }
    
    const results = await db.query.ingredients.findMany({
      where: whereCondition,
      with: {
        category: true
      },
      orderBy: asc(ingredients.name)
    });
    
    return results.map(ingredient => ({
      ...ingredient,
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

  async getIngredient(id: string): Promise<Ingredient | undefined> {
    const [ingredient] = await db.select().from(ingredients).where(eq(ingredients.id, id));
    return ingredient || undefined;
  }

  async createIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    const [newIngredient] = await db.insert(ingredients).values({
      ...ingredient,
      allergens: ingredient.allergens ?? []
    }).returning();
    return newIngredient;
  }

  async updateIngredient(id: string, ingredient: Partial<InsertIngredient>): Promise<Ingredient | undefined> {
    const updateData: Partial<typeof ingredients.$inferInsert> = { ...ingredient };
    if (ingredient.allergens !== undefined) updateData.allergens = ingredient.allergens;
    const [updated] = await db.update(ingredients).set(updateData).where(eq(ingredients.id, id)).returning();
    return updated || undefined;
  }

  async deleteIngredient(id: string): Promise<boolean> {
    const result = await db.delete(ingredients).where(eq(ingredients.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getRecipes(search?: string, categoryId?: string): Promise<RecipeWithDetails[]> {
    let whereConditions = [eq(recipes.isActive, true)];
    
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

    return results;
  }

  async getRecipe(id: string): Promise<RecipeWithDetails | undefined> {
    const result = await db.query.recipes.findFirst({
      where: eq(recipes.id, id),
      with: {
        category: true,
        recipeIngredients: {
          with: {
            ingredient: true
          }
        }
      }
    });

    return result || undefined;
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [newRecipe] = await db.insert(recipes).values({
      ...recipe,
      allergens: recipe.allergens ?? [],
      instructions: recipe.instructions ?? []
    }).returning();
    return newRecipe;
  }

  async updateRecipe(id: string, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const updateData: Partial<typeof recipes.$inferInsert> = { ...recipe, updatedAt: new Date() };
    if (recipe.allergens !== undefined) updateData.allergens = recipe.allergens;
    if (recipe.instructions !== undefined) updateData.instructions = recipe.instructions;
    const [updated] = await db.update(recipes).set(updateData).where(eq(recipes.id, id)).returning();
    return updated || undefined;
  }

  async deleteRecipe(id: string): Promise<boolean> {
    const [updated] = await db.update(recipes).set({ isActive: false }).where(eq(recipes.id, id)).returning();
    return !!updated;
  }

  async getRecipeIngredients(recipeId: string): Promise<(RecipeIngredient & { ingredient: Ingredient })[]> {
    const results = await db.query.recipeIngredients.findMany({
      where: eq(recipeIngredients.recipeId, recipeId),
      with: {
        ingredient: true
      }
    });

    return results;
  }

  async addRecipeIngredient(recipeIngredient: InsertRecipeIngredient): Promise<RecipeIngredient> {
    const [newRecipeIngredient] = await db.insert(recipeIngredients).values(recipeIngredient).returning();
    return newRecipeIngredient;
  }

  async updateRecipeIngredient(id: string, recipeIngredient: Partial<InsertRecipeIngredient>): Promise<RecipeIngredient | undefined> {
    const [updated] = await db.update(recipeIngredients).set(recipeIngredient).where(eq(recipeIngredients.id, id)).returning();
    return updated || undefined;
  }

  async deleteRecipeIngredient(id: string): Promise<boolean> {
    const result = await db.delete(recipeIngredients).where(eq(recipeIngredients.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async replaceRecipeIngredients(recipeId: string, ingredients: InsertRecipeIngredient[]): Promise<RecipeIngredient[]> {
    // Use transaction to ensure atomicity of delete + insert operations
    return await db.transaction(async (tx) => {
      // Delete all existing recipe ingredients for this recipe
      await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));
      
      // If no new ingredients, return empty array
      if (ingredients.length === 0) {
        return [];
      }
      
      // Insert all new recipe ingredients
      const newRecipeIngredients = await tx.insert(recipeIngredients)
        .values(ingredients.map(ingredient => ({
          ...ingredient,
          recipeId // Ensure the recipeId is set correctly
        })))
        .returning();
      
      return newRecipeIngredients;
    });
  }

  async getLowStockIngredients(): Promise<IngredientWithStock[]> {
    const results = await db.query.ingredients.findMany({
      with: {
        category: true
      },
      orderBy: asc(ingredients.name)
    });
    
    return results
      .map(ingredient => ({
        ...ingredient,
        stockStatus: this.determineStockStatus(ingredient)
      }))
      .filter(ingredient => ingredient.stockStatus === "low" || ingredient.stockStatus === "expired");
  }

  async getInventoryLogs(ingredientId?: string): Promise<(InventoryLog & { ingredient: Ingredient })[]> {
    let whereCondition = undefined;
    if (ingredientId) {
      whereCondition = eq(inventoryLogs.ingredientId, ingredientId);
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

  async addInventoryLog(log: InsertInventoryLog): Promise<InventoryLog> {
    const [newLog] = await db.insert(inventoryLogs).values(log).returning();
    return newLog;
  }

  async getProductionPlans(includeArchived: boolean = false): Promise<ProductionPlanWithDetails[]> {
    const whereCondition = includeArchived ? undefined : eq(productionPlans.archived, false);
    
    const results = await db.query.productionPlans.findMany({
      where: whereCondition,
      with: {
        productionPlanRecipes: {
          with: {
            recipe: {
              with: {
                category: true,
                recipeIngredients: {
                  with: {
                    ingredient: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: desc(productionPlans.createdAt)
    });

    return results;
  }

  async getArchivedProductionPlans(): Promise<ProductionPlanWithDetails[]> {
    const results = await db.query.productionPlans.findMany({
      where: eq(productionPlans.archived, true),
      with: {
        productionPlanRecipes: {
          with: {
            recipe: {
              with: {
                category: true,
                recipeIngredients: {
                  with: {
                    ingredient: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: desc(productionPlans.createdAt)
    });

    return results;
  }

  async getProductionPlan(id: string): Promise<ProductionPlanWithDetails | undefined> {
    const result = await db.query.productionPlans.findFirst({
      where: eq(productionPlans.id, id),
      with: {
        productionPlanRecipes: {
          with: {
            recipe: {
              with: {
                category: true,
                recipeIngredients: {
                  with: {
                    ingredient: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return result || undefined;
  }

  async createProductionPlan(plan: InsertProductionPlan): Promise<ProductionPlan> {
    const [newPlan] = await db.insert(productionPlans).values(plan).returning();
    return newPlan;
  }

  async updateProductionPlan(id: string, plan: Partial<InsertProductionPlan>): Promise<ProductionPlan | undefined> {
    const updateData: Partial<typeof productionPlans.$inferInsert> = { 
      ...plan, 
      updatedAt: new Date() 
    };
    const [updated] = await db.update(productionPlans).set(updateData).where(eq(productionPlans.id, id)).returning();
    return updated || undefined;
  }

  async archiveProductionPlan(id: string): Promise<ProductionPlan | undefined> {
    const [updated] = await db.update(productionPlans)
      .set({ archived: true, updatedAt: new Date() })
      .where(eq(productionPlans.id, id))
      .returning();
    return updated || undefined;
  }

  async unarchiveProductionPlan(id: string): Promise<ProductionPlan | undefined> {
    const [updated] = await db.update(productionPlans)
      .set({ archived: false, updatedAt: new Date() })
      .where(eq(productionPlans.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProductionPlan(id: string): Promise<boolean> {
    const result = await db.delete(productionPlans).where(eq(productionPlans.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async addProductionPlanRecipe(planRecipe: InsertProductionPlanRecipe): Promise<ProductionPlanRecipe> {
    const [newPlanRecipe] = await db.insert(productionPlanRecipes).values({
      ...planRecipe,
      completedIngredients: planRecipe.completedIngredients ?? [],
      completedInstructions: planRecipe.completedInstructions ?? []
    }).returning();
    return newPlanRecipe;
  }

  async updateProductionPlanRecipe(id: string, planRecipe: Partial<InsertProductionPlanRecipe>): Promise<ProductionPlanRecipe | undefined> {
    const updateData: Partial<typeof productionPlanRecipes.$inferInsert> = { ...planRecipe };
    if (planRecipe.completedIngredients !== undefined) updateData.completedIngredients = planRecipe.completedIngredients;
    if (planRecipe.completedInstructions !== undefined) updateData.completedInstructions = planRecipe.completedInstructions;
    const [updated] = await db.update(productionPlanRecipes).set(updateData).where(eq(productionPlanRecipes.id, id)).returning();
    return updated || undefined;
  }

  async deleteProductionPlanRecipe(id: string): Promise<boolean> {
    const result = await db.delete(productionPlanRecipes).where(eq(productionPlanRecipes.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getStats(): Promise<{
    totalRecipes: number;
    activeIngredients: number;
    lowStockItems: number;
    totalCategories: number;
  }> {
    const [recipesCount] = await db.select({ count: sql<number>`count(*)` }).from(recipes).where(eq(recipes.isActive, true));
    const [ingredientsCount] = await db.select({ count: sql<number>`count(*)` }).from(ingredients);
    const [categoriesCount] = await db.select({ count: sql<number>`count(*)` }).from(categories);
    
    const lowStockIngredients = await this.getLowStockIngredients();

    return {
      totalRecipes: Number(recipesCount?.count || 0),
      activeIngredients: Number(ingredientsCount?.count || 0),
      lowStockItems: lowStockIngredients.length,
      totalCategories: Number(categoriesCount?.count || 0)
    };
  }
}

export const storage = new DatabaseStorage();
