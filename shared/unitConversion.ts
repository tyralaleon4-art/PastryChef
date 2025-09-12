import type { Ingredient } from "./schema";

/**
 * Unit conversion utilities for recipe scaling calculations
 */

export interface ConversionResult {
  grams: number;
  success: boolean;
  missingData?: string; // What data is needed for conversion
}

/**
 * Convert any unit to grams using ingredient metadata
 * @param quantity - The quantity to convert
 * @param unit - The unit of measurement
 * @param ingredient - The ingredient with metadata for conversion
 * @returns ConversionResult with grams and success status
 */
export function convertToGrams(
  quantity: number, 
  unit: string, 
  ingredient: Ingredient
): ConversionResult {
  switch (unit.toLowerCase()) {
    case 'g':
      return { grams: quantity, success: true };
    
    case 'kg':
      return { grams: quantity * 1000, success: true };
    
    case 'ml':
      if (ingredient.densityGPerMl) {
        return { grams: quantity * parseFloat(ingredient.densityGPerMl), success: true };
      }
      return { 
        grams: quantity, // Fallback: assume 1ml ≈ 1g
        success: false, 
        missingData: `density (g/ml) for ${ingredient.name}`
      };
    
    case 'l':
      if (ingredient.densityGPerMl) {
        return { grams: quantity * 1000 * parseFloat(ingredient.densityGPerMl), success: true };
      }
      return { 
        grams: quantity * 1000, // Fallback: assume 1l ≈ 1kg
        success: false, 
        missingData: `density (g/ml) for ${ingredient.name}`
      };
    
    case 'pcs':
    case 'piece':
    case 'pieces':
      if (ingredient.weightPerPieceG) {
        return { grams: quantity * parseFloat(ingredient.weightPerPieceG), success: true };
      }
      return { 
        grams: quantity * 50, // Fallback: assume 50g per piece
        success: false, 
        missingData: `weight per piece (g) for ${ingredient.name}`
      };
    
    default:
      return { 
        grams: quantity, // Unknown unit - treat as grams
        success: false, 
        missingData: `conversion factor for unit "${unit}"`
      };
  }
}

/**
 * Calculate the total weight of a recipe from its ingredients
 * @param recipeIngredients - Array of recipe ingredients with quantities and units
 * @param ingredients - Array of ingredients with metadata
 * @param fallbackYieldGrams - Optional fallback yield if calculations fail
 * @returns Object with total weight and missing data info
 */
export function calculateRecipeWeight(
  recipeIngredients: Array<{ 
    ingredientId: string; 
    quantity: string | number; 
    unit: string; 
  }>,
  ingredients: Ingredient[],
  fallbackYieldGrams?: string | number
): {
  totalGrams: number;
  success: boolean;
  missingData: string[];
  conversions: Array<{ ingredientName: string; result: ConversionResult }>;
} {
  const ingredientMap = new Map(ingredients.map(ing => [ing.id, ing]));
  const missingData: string[] = [];
  const conversions: Array<{ ingredientName: string; result: ConversionResult }> = [];
  let totalGrams = 0;
  let allSuccessful = true;

  for (const recipeIngredient of recipeIngredients) {
    const ingredient = ingredientMap.get(recipeIngredient.ingredientId);
    if (!ingredient) {
      missingData.push(`ingredient data for ID: ${recipeIngredient.ingredientId}`);
      allSuccessful = false;
      continue;
    }

    const quantity = typeof recipeIngredient.quantity === 'string' 
      ? parseFloat(recipeIngredient.quantity)
      : recipeIngredient.quantity;

    if (isNaN(quantity)) {
      missingData.push(`valid quantity for ${ingredient.name}`);
      allSuccessful = false;
      continue;
    }

    const result = convertToGrams(quantity, recipeIngredient.unit, ingredient);
    conversions.push({ ingredientName: ingredient.name, result });
    
    totalGrams += result.grams;

    if (!result.success) {
      allSuccessful = false;
      if (result.missingData) {
        missingData.push(result.missingData);
      }
    }
  }

  // If conversions failed and we have a fallback, use it
  if (!allSuccessful && fallbackYieldGrams) {
    const fallbackValue = typeof fallbackYieldGrams === 'string' 
      ? parseFloat(fallbackYieldGrams)
      : fallbackYieldGrams;
    
    if (!isNaN(fallbackValue) && fallbackValue > 0) {
      return {
        totalGrams: fallbackValue,
        success: false, // Mark as false to indicate fallback was used
        missingData,
        conversions
      };
    }
  }

  return {
    totalGrams,
    success: allSuccessful,
    missingData,
    conversions
  };
}

/**
 * Scale ingredient quantities proportionally
 * @param originalQuantity - Original ingredient quantity  
 * @param originalUnit - Original unit
 * @param scaleFactor - Factor to scale by (targetWeight / originalWeight)
 * @returns Scaled quantity rounded appropriately for the unit
 */
export function scaleQuantity(
  originalQuantity: number,
  originalUnit: string,
  scaleFactor: number
): number {
  const scaledQuantity = originalQuantity * scaleFactor;
  
  // Round appropriately based on unit type
  switch (originalUnit.toLowerCase()) {
    case 'g':
      return Math.round(scaledQuantity * 10) / 10; // Round to 1 decimal place
    case 'kg':
    case 'l':
      return Math.round(scaledQuantity * 1000) / 1000; // Round to 3 decimal places
    case 'ml':
      return Math.round(scaledQuantity); // Round to whole numbers
    case 'pcs':
    case 'piece':
    case 'pieces':
      return Math.round(scaledQuantity * 100) / 100; // Round to 2 decimal places
    default:
      return Math.round(scaledQuantity * 10) / 10; // Default to 1 decimal place
  }
}

/**
 * Format quantity with appropriate precision for display
 * @param quantity - The quantity to format
 * @param unit - The unit type
 * @returns Formatted string
 */
export function formatQuantity(quantity: number, unit: string): string {
  const formattedQuantity = scaleQuantity(quantity, unit, 1); // Use scale function for consistency
  
  // Remove unnecessary decimal zeros
  if (formattedQuantity === Math.floor(formattedQuantity)) {
    return formattedQuantity.toString();
  }
  
  return formattedQuantity.toString();
}