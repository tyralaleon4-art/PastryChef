export function calculateScalingFactor(originalServings: number, targetServings: number): number {
  if (originalServings === 0) return 1;
  return targetServings / originalServings;
}

export function convertUnits(value: number, fromUnit: string, toUnit: string): number {
  // Basic unit conversion logic - expand as needed
  const conversions: Record<string, Record<string, number>> = {
    grams: {
      ounces: 0.035274,
      pounds: 0.00220462,
      kilograms: 0.001,
    },
    ounces: {
      grams: 28.3495,
      pounds: 0.0625,
      kilograms: 0.0283495,
    },
    pounds: {
      grams: 453.592,
      ounces: 16,
      kilograms: 0.453592,
    },
    kilograms: {
      grams: 1000,
      ounces: 35.274,
      pounds: 2.20462,
    },
    cups: {
      tablespoons: 16,
      teaspoons: 48,
      milliliters: 236.588,
      liters: 0.236588,
    },
    tablespoons: {
      cups: 0.0625,
      teaspoons: 3,
      milliliters: 14.7868,
    },
    teaspoons: {
      cups: 0.0208333,
      tablespoons: 0.333333,
      milliliters: 4.92892,
    },
    milliliters: {
      cups: 0.00422675,
      tablespoons: 0.067628,
      teaspoons: 0.202884,
      liters: 0.001,
    },
    liters: {
      cups: 4.22675,
      milliliters: 1000,
    },
  };

  if (fromUnit === toUnit) return value;
  
  const conversionFactor = conversions[fromUnit]?.[toUnit];
  return conversionFactor ? value * conversionFactor : value;
}

export function calculateRecipeCost(ingredients: Array<{ quantity: number; costPerUnit: number }>, servings: number): { totalCost: number; costPerServing: number } {
  const totalCost = ingredients.reduce((sum, ingredient) => {
    return sum + (ingredient.quantity * ingredient.costPerUnit);
  }, 0);

  const costPerServing = servings > 0 ? totalCost / servings : 0;

  return {
    totalCost,
    costPerServing,
  };
}

export function scaleIngredientQuantity(originalQuantity: number, scalingFactor: number): number {
  return originalQuantity * scalingFactor;
}
