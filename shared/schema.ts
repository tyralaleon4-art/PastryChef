import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ingredientCategories = pgTable("ingredient_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ingredients = pgTable("ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  categoryId: varchar("category_id").references(() => ingredientCategories.id),
  unit: text("unit").notNull(), // g, ml, cups, etc.
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 4 }).notNull(),
  supplier: text("supplier"),
  currentStock: decimal("current_stock", { precision: 10, scale: 3 }).default("0"),
  minimumStock: decimal("minimum_stock", { precision: 10, scale: 3 }).default("0"),
  allergens: json("allergens").$type<string[]>().default([]), // gluten, dairy, nuts, eggs, etc.
  isVegan: boolean("is_vegan").default(false),
  isGlutenFree: boolean("is_gluten_free").default(false),
  isLactoseFree: boolean("is_lactose_free").default(false),
  // Recipe scaling metadata
  densityGPerMl: decimal("density_g_per_ml", { precision: 6, scale: 3 }), // For ml/l conversions (optional)
  weightPerPieceG: decimal("weight_per_piece_g", { precision: 10, scale: 3 }), // For pcs conversions (optional)
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: varchar("category_id").references(() => categories.id),
  instructions: json("instructions").$type<string[]>().default([]),
  imageUrl: text("image_url"),
  allergens: json("allergens").$type<string[]>().default([]), // automatically populated from ingredients
  isVegan: boolean("is_vegan").default(false),
  isGlutenFree: boolean("is_gluten_free").default(false),
  isLactoseFree: boolean("is_lactose_free").default(false),
  isActive: boolean("is_active").default(true),
  // Recipe scaling metadata
  totalYieldGrams: decimal("total_yield_grams", { precision: 10, scale: 2 }), // Fallback for scaling when ingredient metadata is missing (optional)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipeId: varchar("recipe_id").references(() => recipes.id, { onDelete: "cascade" }).notNull(),
  ingredientId: varchar("ingredient_id").references(() => ingredients.id).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: text("unit").notNull(),
  notes: text("notes"),
});

export const inventoryLogs = pgTable("inventory_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ingredientId: varchar("ingredient_id").references(() => ingredients.id).notNull(),
  type: text("type").notNull(), // restock, usage, adjustment, expired
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productionPlans = pgTable("production_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"), // active, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productionPlanRecipes = pgTable("production_plan_recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id").references(() => productionPlans.id, { onDelete: "cascade" }).notNull(),
  recipeId: varchar("recipe_id").references(() => recipes.id).notNull(),
  targetWeight: decimal("target_weight", { precision: 10, scale: 2 }).notNull(),
  targetUnit: text("target_unit").notNull().default("g"), // g, kg
  completed: boolean("completed").default(false),
  completedIngredients: json("completed_ingredients").$type<string[]>().default([]), // array of ingredient IDs that are completed
  completedInstructions: json("completed_instructions").$type<number[]>().default([]), // array of instruction indices that are completed
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  recipes: many(recipes),
}));

export const ingredientCategoriesRelations = relations(ingredientCategories, ({ many }) => ({
  ingredients: many(ingredients),
}));

export const ingredientsRelations = relations(ingredients, ({ one, many }) => ({
  category: one(ingredientCategories, {
    fields: [ingredients.categoryId],
    references: [ingredientCategories.id],
  }),
  recipeIngredients: many(recipeIngredients),
  inventoryLogs: many(inventoryLogs),
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  category: one(categories, {
    fields: [recipes.categoryId],
    references: [categories.id],
  }),
  recipeIngredients: many(recipeIngredients),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeIngredients.recipeId],
    references: [recipes.id],
  }),
  ingredient: one(ingredients, {
    fields: [recipeIngredients.ingredientId],
    references: [ingredients.id],
  }),
}));

export const inventoryLogsRelations = relations(inventoryLogs, ({ one }) => ({
  ingredient: one(ingredients, {
    fields: [inventoryLogs.ingredientId],
    references: [ingredients.id],
  }),
}));

export const productionPlansRelations = relations(productionPlans, ({ many }) => ({
  productionPlanRecipes: many(productionPlanRecipes),
}));

export const productionPlanRecipesRelations = relations(productionPlanRecipes, ({ one }) => ({
  plan: one(productionPlans, {
    fields: [productionPlanRecipes.planId],
    references: [productionPlans.id],
  }),
  recipe: one(recipes, {
    fields: [productionPlanRecipes.recipeId],
    references: [recipes.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertIngredientCategorySchema = createInsertSchema(ingredientCategories).omit({
  id: true,
  createdAt: true,
});

export const insertIngredientSchema = createInsertSchema(ingredients, {
  allergens: z.array(z.string()).default([])
}).omit({
  id: true,
  createdAt: true,
});

export const insertRecipeSchema = createInsertSchema(recipes, {
  instructions: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([])
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredients).omit({
  id: true,
});

export const insertInventoryLogSchema = createInsertSchema(inventoryLogs).omit({
  id: true,
  createdAt: true,
});

export const insertProductionPlanSchema = createInsertSchema(productionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductionPlanRecipeSchema = createInsertSchema(productionPlanRecipes, {
  completedIngredients: z.array(z.string()).default([]),
  completedInstructions: z.array(z.number()).default([])
}).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type IngredientCategory = typeof ingredientCategories.$inferSelect;
export type InsertIngredientCategory = z.infer<typeof insertIngredientCategorySchema>;

export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;

export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type InsertRecipeIngredient = z.infer<typeof insertRecipeIngredientSchema>;

export type InventoryLog = typeof inventoryLogs.$inferSelect;
export type InsertInventoryLog = z.infer<typeof insertInventoryLogSchema>;

export type ProductionPlan = typeof productionPlans.$inferSelect;
export type InsertProductionPlan = z.infer<typeof insertProductionPlanSchema>;

export type ProductionPlanRecipe = typeof productionPlanRecipes.$inferSelect;
export type InsertProductionPlanRecipe = z.infer<typeof insertProductionPlanRecipeSchema>;

// Complex types for API responses
export type RecipeWithDetails = Recipe & {
  category: Category | null;
  recipeIngredients: (RecipeIngredient & { ingredient: Ingredient })[];
};

export type IngredientWithStock = Ingredient & {
  category: IngredientCategory | null;
  stockStatus: "low" | "normal" | "expired";
};

export type ProductionPlanWithDetails = ProductionPlan & {
  productionPlanRecipes: (ProductionPlanRecipe & { 
    recipe: RecipeWithDetails;
  })[];
};
