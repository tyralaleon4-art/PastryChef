import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { storage } from "./storage";
import type { RecipeWithDetails, ProductionPlanWithDetails, RecipeIngredient, Ingredient } from "@shared/schema";

// Support both Replit AI integrations and standard OpenAI API key
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  ...(process.env.AI_INTEGRATIONS_OPENAI_BASE_URL && { baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL }),
});

export function registerAIRoutes(app: Express): void {
  // AI ingredient info - auto-fill with price, allergens, etc.
  app.post("/api/ai/ingredient-info", async (req: Request, res: Response) => {
    try {
      const { name } = req.body;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: "Ingredient name is required" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Jesteś ekspertem od składników cukierniczych i spożywczych w Polsce. 
Zwracasz informacje o składnikach w formacie JSON. Podaj realistyczne ceny hurtowe w PLN za kilogram.
Alergeny podawaj z listy: Gluten, Crustaceans, Eggs, Fish, Peanuts, Soybeans, Milk, Nuts, Celery, Mustard, Sesame, Sulfites, Lupin, Mollusks.
Odpowiadaj TYLKO w formacie JSON bez dodatkowego tekstu.`
          },
          {
            role: "user",
            content: `Podaj informacje o składniku: "${name}"

Zwróć JSON:
{
  "name": "pełna nazwa składnika po polsku",
  "pricePerKg": liczba (cena w PLN za kg),
  "allergens": ["lista alergenów"],
  "isVegan": boolean,
  "isGlutenFree": boolean,
  "isLactoseFree": boolean,
  "densityGPerMl": liczba lub null (gęstość g/ml dla płynów),
  "suggestedCategory": "sugerowana kategoria",
  "supplier": "przykładowy dostawca w Polsce",
  "caloriesPer100g": liczba (kcal na 100g),
  "proteinPer100g": liczba (g białka na 100g),
  "fatPer100g": liczba (g tłuszczu na 100g),
  "carbsPer100g": liczba (g węglowodanów na 100g),
  "fiberPer100g": liczba (g błonnika na 100g)
}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const ingredientInfo = JSON.parse(content);
      
      res.json(ingredientInfo);
    } catch (error) {
      console.error("Error getting AI ingredient info:", error);
      res.status(500).json({ error: "Failed to get ingredient info" });
    }
  });

  // AI bulk fill nutrition for all ingredients missing values
  app.post("/api/ai/fill-nutrition", async (req: Request, res: Response) => {
    try {
      const allIngredients = await storage.getIngredients();
      const missing = allIngredients.filter(
        i => !i.caloriesPer100g && !i.proteinPer100g && !i.fatPer100g && !i.carbsPer100g
      );

      if (missing.length === 0) {
        return res.json({ updated: 0, total: 0, message: "Wszystkie składniki mają już wartości odżywcze" });
      }

      let updated = 0;
      const errors: string[] = [];

      // Process in batches of 5 to avoid rate limits
      const BATCH = 5;
      for (let i = 0; i < missing.length; i += BATCH) {
        const batch = missing.slice(i, i + BATCH);
        await Promise.all(batch.map(async (ingredient) => {
          try {
            const response = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: `Jesteś ekspertem ds. żywienia. Zwracaj TYLKO JSON bez żadnego dodatkowego tekstu.`
                },
                {
                  role: "user",
                  content: `Podaj wartości odżywcze na 100g dla składnika: "${ingredient.name}"

Zwróć dokładnie ten JSON (liczby całkowite lub z jednym miejscem po przecinku):
{"caloriesPer100g": liczba, "proteinPer100g": liczba, "fatPer100g": liczba, "carbsPer100g": liczba, "fiberPer100g": liczba}`
                }
              ],
              response_format: { type: "json_object" },
              max_tokens: 150,
            });

            const content = response.choices[0]?.message?.content || "{}";
            const data = JSON.parse(content);

            if (data.caloriesPer100g !== undefined) {
              await storage.updateIngredient(ingredient.id, {
                caloriesPer100g: String(data.caloriesPer100g),
                proteinPer100g: data.proteinPer100g !== undefined ? String(data.proteinPer100g) : undefined,
                fatPer100g: data.fatPer100g !== undefined ? String(data.fatPer100g) : undefined,
                carbsPer100g: data.carbsPer100g !== undefined ? String(data.carbsPer100g) : undefined,
                fiberPer100g: data.fiberPer100g !== undefined ? String(data.fiberPer100g) : undefined,
              });
              updated++;
            }
          } catch (err) {
            errors.push(ingredient.name);
          }
        }));

        // Small delay between batches
        if (i + BATCH < missing.length) {
          await new Promise(r => setTimeout(r, 500));
        }
      }

      res.json({ updated, total: missing.length, errors });
    } catch (error) {
      console.error("Error filling nutrition:", error);
      res.status(500).json({ error: "Failed to fill nutrition values" });
    }
  });

  // AI recipe-aware chat - learns from user's recipes
  app.post("/api/ai/recipe-chat", async (req: Request, res: Response) => {
    try {
      const { message, conversationHistory = [] } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Get all recipes with their ingredients for context
      const recipes: RecipeWithDetails[] = await storage.getRecipes();
      const ingredients = await storage.getIngredients();
      
      // Build compact context from recipes (minimize tokens)
      const recipeContext = recipes.map((r: RecipeWithDetails) => {
        const ings = r.recipeIngredients.map((ri: RecipeIngredient & { ingredient: Ingredient }) => 
          `${ri.ingredient.name} ${ri.quantity}${ri.unit}`
        ).join(", ");
        return `${r.name} (${r.category?.name || "Bez kategorii"}): ${ings}`;
      }).join("\n");

      const ingredientNames = ingredients.map((i) => i.name).join(", ");

      // Build system message with compact recipe knowledge
      const systemMessage = `Jesteś ekspertem cukierniczym i piekarzem. Masz dostęp do bazy przepisów i składników użytkownika.

PRZEPISY (${recipes.length}):
${recipeContext}

DOSTĘPNE SKŁADNIKI: ${ingredientNames}

Używaj tej wiedzy do sugerowania przepisów, zamienników, kosztów i technik cukierniczych.
Odpowiadaj po polsku, konkretnie. Przy nowych przepisach podaj dokładne ilości.`;

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: systemMessage },
        ...conversationHistory.map((msg: { role: string; content: string }) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        { role: "user", content: message }
      ];

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        stream: true,
        max_tokens: 2048,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true, fullResponse })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error in AI recipe chat:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "AI chat failed" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process chat" });
      }
    }
  });

  // Generate production plan export data
  app.get("/api/production-plans/:id/export", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const plan: ProductionPlanWithDetails | undefined = await storage.getProductionPlan(id);
      
      if (!plan) {
        return res.status(404).json({ error: "Production plan not found" });
      }

      interface ScaledIngredient {
        name: string;
        originalQuantity: number;
        scaledQuantity: number;
        unit: string;
      }

      interface ScaledRecipe {
        recipeName: string;
        targetWeight: string;
        targetUnit: string;
        scaleFactor: number;
        ingredients: ScaledIngredient[];
        instructions: string[];
      }

      // Calculate scaled ingredients for each recipe
      const scaledRecipes: ScaledRecipe[] = plan.productionPlanRecipes.map((pr) => {
        const recipe = pr.recipe;
        const targetWeightG = pr.targetUnit === "kg" 
          ? parseFloat(pr.targetWeight) * 1000 
          : parseFloat(pr.targetWeight);
        
        // Calculate base recipe weight (sum of all ingredients)
        const baseWeight = recipe.recipeIngredients.reduce((sum: number, ri: RecipeIngredient & { ingredient: Ingredient }) => {
          let weightInG = parseFloat(ri.quantity);
          if (ri.unit === "kg") weightInG *= 1000;
          if (ri.unit === "ml" || ri.unit === "l") {
            const density = ri.ingredient.densityGPerMl ? parseFloat(ri.ingredient.densityGPerMl) : 1;
            if (ri.unit === "l") weightInG *= 1000;
            weightInG *= density;
          }
          return sum + weightInG;
        }, 0);

        const scaleFactor = baseWeight > 0 ? targetWeightG / baseWeight : 1;

        const scaledIngredients: ScaledIngredient[] = recipe.recipeIngredients.map((ri: RecipeIngredient & { ingredient: Ingredient }) => {
          const originalQty = parseFloat(ri.quantity);
          const scaledQty = originalQty * scaleFactor;
          
          return {
            name: ri.ingredient.name,
            originalQuantity: originalQty,
            scaledQuantity: Math.round(scaledQty * 100) / 100,
            unit: ri.unit,
          };
        });

        return {
          recipeName: recipe.name,
          targetWeight: pr.targetWeight,
          targetUnit: pr.targetUnit,
          scaleFactor: Math.round(scaleFactor * 100) / 100,
          ingredients: scaledIngredients,
          instructions: recipe.instructions || [],
        };
      });

      // Aggregate all ingredients
      const aggregatedIngredients: Record<string, { name: string; totalQuantity: number; unit: string; recipes: string[] }> = {};
      
      scaledRecipes.forEach((sr: ScaledRecipe) => {
        sr.ingredients.forEach((ing: ScaledIngredient) => {
          const key = `${ing.name}-${ing.unit}`;
          if (!aggregatedIngredients[key]) {
            aggregatedIngredients[key] = {
              name: ing.name,
              totalQuantity: 0,
              unit: ing.unit,
              recipes: []
            };
          }
          aggregatedIngredients[key].totalQuantity += ing.scaledQuantity;
          if (!aggregatedIngredients[key].recipes.includes(sr.recipeName)) {
            aggregatedIngredients[key].recipes.push(sr.recipeName);
          }
        });
      });

      const ingredientList = Object.values(aggregatedIngredients).sort((a, b) => 
        a.name.localeCompare(b.name)
      );

      res.json({
        planName: plan.name,
        planDescription: plan.description,
        createdAt: plan.createdAt,
        recipes: scaledRecipes,
        ingredientList
      });
    } catch (error) {
      console.error("Error exporting production plan:", error);
      res.status(500).json({ error: "Failed to export production plan" });
    }
  });

  // Calculate nutritional values for a recipe
  app.get("/api/recipes/:id/nutrition", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const recipes: RecipeWithDetails[] = await storage.getRecipes();
      const recipe = recipes.find(r => r.id === id);
      
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      const ingredients = await storage.getIngredients();
      
      let totalCalories = 0;
      let totalProtein = 0;
      let totalFat = 0;
      let totalCarbs = 0;
      let totalFiber = 0;
      let totalWeight = 0;

      recipe.recipeIngredients.forEach((ri: RecipeIngredient & { ingredient: Ingredient }) => {
        const ing = ingredients.find(i => i.id === ri.ingredientId);
        if (!ing) return;

        // Convert quantity to grams
        let weightInG = parseFloat(ri.quantity);
        if (ri.unit === "kg") weightInG *= 1000;
        else if (ri.unit === "ml" || ri.unit === "l") {
          const density = ing.densityGPerMl ? parseFloat(ing.densityGPerMl) : 1;
          if (ri.unit === "l") weightInG *= 1000;
          weightInG *= density;
        }

        totalWeight += weightInG;

        // Calculate nutrition based on weight
        const factor = weightInG / 100; // per 100g values
        if (ing.caloriesPer100g) totalCalories += parseFloat(ing.caloriesPer100g) * factor;
        if (ing.proteinPer100g) totalProtein += parseFloat(ing.proteinPer100g) * factor;
        if (ing.fatPer100g) totalFat += parseFloat(ing.fatPer100g) * factor;
        if (ing.carbsPer100g) totalCarbs += parseFloat(ing.carbsPer100g) * factor;
        if (ing.fiberPer100g) totalFiber += parseFloat(ing.fiberPer100g) * factor;
      });

      // Also calculate per 100g of final product
      const per100g = totalWeight > 0 ? {
        calories: Math.round((totalCalories / totalWeight) * 100 * 10) / 10,
        protein: Math.round((totalProtein / totalWeight) * 100 * 10) / 10,
        fat: Math.round((totalFat / totalWeight) * 100 * 10) / 10,
        carbs: Math.round((totalCarbs / totalWeight) * 100 * 10) / 10,
        fiber: Math.round((totalFiber / totalWeight) * 100 * 10) / 10,
      } : null;

      res.json({
        recipeName: recipe.name,
        totalWeight: Math.round(totalWeight),
        total: {
          calories: Math.round(totalCalories),
          protein: Math.round(totalProtein * 10) / 10,
          fat: Math.round(totalFat * 10) / 10,
          carbs: Math.round(totalCarbs * 10) / 10,
          fiber: Math.round(totalFiber * 10) / 10,
        },
        per100g,
        ingredientCount: recipe.recipeIngredients.length,
      });
    } catch (error) {
      console.error("Error calculating nutrition:", error);
      res.status(500).json({ error: "Failed to calculate nutrition" });
    }
  });
}
