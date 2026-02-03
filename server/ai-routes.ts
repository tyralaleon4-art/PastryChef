import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { storage } from "./storage";
import type { RecipeWithDetails, ProductionPlanWithDetails, RecipeIngredient, Ingredient } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
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
  "supplier": "przykładowy dostawca w Polsce"
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
      
      // Build context from recipes
      const recipeContext = recipes.map((r: RecipeWithDetails) => ({
        name: r.name,
        category: r.category?.name || "Bez kategorii",
        ingredients: r.recipeIngredients.map((ri: RecipeIngredient & { ingredient: Ingredient }) => ({
          name: ri.ingredient.name,
          quantity: ri.quantity,
          unit: ri.unit
        })),
        instructions: r.instructions || []
      }));

      const ingredientContext = ingredients.map((i) => ({
        name: i.name,
        pricePerKg: i.costPerUnit,
        allergens: i.allergens || [],
        isVegan: i.isVegan,
        isGlutenFree: i.isGlutenFree
      }));

      // Build system message with recipe knowledge
      const systemMessage = `Jesteś ekspertem cukierniczym i piekarzem. Masz dostęp do bazy przepisów i składników użytkownika.

BAZA PRZEPISÓW (${recipes.length} przepisów):
${JSON.stringify(recipeContext, null, 2)}

BAZA SKŁADNIKÓW (${ingredients.length} składników):
${JSON.stringify(ingredientContext, null, 2)}

Używaj tej wiedzy do:
1. Sugerowania nowych przepisów na podstawie istniejących wzorców
2. Proponowania zamienników składników
3. Obliczania kosztów i proporcji
4. Tworzenia wariantów istniejących przepisów
5. Odpowiadania na pytania o techniki cukiernicze

Odpowiadaj po polsku, konkretnie i pomocnie. Jeśli tworzysz nowy przepis, podaj dokładne ilości składników.`;

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
        model: "gpt-4o",
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
}
