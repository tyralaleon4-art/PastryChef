import { forwardRef } from "react";
import { Badge } from "@/components/ui/badge";
import { formatQuantity } from "@shared/unitConversion";
import type { RecipeWithDetails } from "@shared/schema";

interface ScaledIngredient {
  ingredientId: string;
  ingredientName: string;
  originalQuantity: number;
  originalUnit: string;
  scaledQuantity: number;
  scaledUnit: string;
}

interface PrintableRecipeProps {
  recipe: RecipeWithDetails;
  targetWeight: string;
  targetUnit: string;
  originalWeight: number;
  scaledIngredients: ScaledIngredient[];
  scaleFactor: number;
  totalCost?: number;
}

const PrintableRecipe = forwardRef<HTMLDivElement, PrintableRecipeProps>(({
  recipe,
  targetWeight,
  targetUnit,
  originalWeight,
  scaledIngredients,
  scaleFactor,
  totalCost
}, ref) => {
  const currentDate = new Date().toLocaleDateString();
  
  return (
    <div 
      ref={ref} 
      className="print-container font-sans text-sm leading-relaxed text-black bg-white"
      style={{
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        lineHeight: '1.4',
        color: '#000',
        margin: '0',
        padding: '20px',
        maxWidth: '100%'
      }}
    >
      {/* Print-specific styles */}
      <style>{`
        @media print {
          .print-container {
            font-family: 'Arial', sans-serif !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 20px !important;
            max-width: 100% !important;
            background: white !important;
          }
          .print-header {
            border-bottom: 2px solid #333 !important;
            padding-bottom: 10px !important;
            margin-bottom: 20px !important;
          }
          .print-title {
            font-size: 20px !important;
            font-weight: bold !important;
            margin: 0 0 5px 0 !important;
          }
          .print-subtitle {
            font-size: 14px !important;
            color: #666 !important;
            margin: 0 !important;
          }
          .recipe-info {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 20px !important;
            margin-bottom: 20px !important;
          }
          .info-section {
            background: #f9f9f9 !important;
            padding: 10px !important;
            border-radius: 5px !important;
          }
          .info-title {
            font-weight: bold !important;
            margin-bottom: 5px !important;
            font-size: 13px !important;
          }
          .ingredients-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-bottom: 20px !important;
          }
          .ingredients-table th {
            background: #333 !important;
            color: white !important;
            padding: 8px !important;
            text-align: left !important;
            font-weight: bold !important;
            border: 1px solid #333 !important;
          }
          .ingredients-table td {
            padding: 6px 8px !important;
            border: 1px solid #ddd !important;
          }
          .ingredients-table tr:nth-child(even) {
            background: #f9f9f9 !important;
          }
          .badges {
            display: flex !important;
            gap: 5px !important;
            margin-top: 5px !important;
          }
          .badge {
            display: inline-block !important;
            padding: 2px 6px !important;
            background: #e0e0e0 !important;
            border-radius: 3px !important;
            font-size: 10px !important;
            font-weight: bold !important;
          }
          .footer {
            margin-top: 20px !important;
            padding-top: 10px !important;
            border-top: 1px solid #ddd !important;
            font-size: 10px !important;
            color: #666 !important;
          }
          .quantity-column {
            text-align: right !important;
            font-weight: bold !important;
          }
        }
        @media screen {
          .print-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      {/* Header */}
      <div className="print-header">
        <h1 className="print-title">{recipe.name}</h1>
        <p className="print-subtitle">Scaled Recipe - Professional Kitchen Calculator</p>
      </div>

      {/* Recipe Information Grid */}
      <div className="recipe-info">
        <div className="info-section">
          <div className="info-title">Recipe Details</div>
          <p><strong>Original Yield:</strong> {Math.round(originalWeight)}g</p>
          <p><strong>Target Yield:</strong> {targetWeight}{targetUnit}</p>
          <p><strong>Scale Factor:</strong> {scaleFactor.toFixed(3)}x</p>
          <p><strong>Date Calculated:</strong> {currentDate}</p>
          {recipe.description && (
            <p><strong>Description:</strong> {recipe.description}</p>
          )}
        </div>

        <div className="info-section">
          <div className="info-title">Properties</div>
          <div className="badges">
            {recipe.isVegan && <span className="badge">VEGAN</span>}
            {recipe.isGlutenFree && <span className="badge">GLUTEN FREE</span>}
            {recipe.isLactoseFree && <span className="badge">LACTOSE FREE</span>}
          </div>
          {recipe.category && (
            <p><strong>Category:</strong> {recipe.category.name}</p>
          )}
          {totalCost && totalCost > 0 && (
            <p><strong>Estimated Cost:</strong> {totalCost.toFixed(2)} PLN</p>
          )}
        </div>
      </div>

      {/* Scaled Ingredients Table */}
      <div>
        <h2 style={{ fontSize: '16px', marginBottom: '10px', fontWeight: 'bold' }}>
          Scaled Ingredients
        </h2>
        <table className="ingredients-table">
          <thead>
            <tr>
              <th style={{ width: '50%' }}>Ingredient</th>
              <th style={{ width: '25%', textAlign: 'right' }}>Original</th>
              <th style={{ width: '25%', textAlign: 'right' }}>Scaled</th>
            </tr>
          </thead>
          <tbody>
            {scaledIngredients.map((ingredient, index) => (
              <tr key={ingredient.ingredientId}>
                <td>{ingredient.ingredientName}</td>
                <td className="quantity-column">
                  {formatQuantity(ingredient.originalQuantity, ingredient.originalUnit)} {ingredient.originalUnit}
                </td>
                <td className="quantity-column">
                  {formatQuantity(ingredient.scaledQuantity, ingredient.scaledUnit)} {ingredient.scaledUnit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Instructions (if available) */}
      {recipe.instructions && recipe.instructions.length > 0 && (
        <div>
          <h2 style={{ fontSize: '16px', marginBottom: '10px', fontWeight: 'bold' }}>
            Instructions
          </h2>
          <ol style={{ paddingLeft: '20px' }}>
            {recipe.instructions.map((instruction, index) => (
              <li key={index} style={{ marginBottom: '5px' }}>
                {instruction}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Footer */}
      <div className="footer">
        <p>Generated by PastryPro Recipe Management System</p>
        <p>Professional Kitchen Calculator - {currentDate}</p>
        <p>Note: Quantities have been professionally scaled using ingredient density and conversion factors.</p>
      </div>
    </div>
  );
});

PrintableRecipe.displayName = "PrintableRecipe";

export default PrintableRecipe;