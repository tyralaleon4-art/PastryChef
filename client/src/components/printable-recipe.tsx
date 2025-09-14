import { forwardRef } from "react";
import type { RecipeWithDetails } from "@shared/schema";

interface ScaledIngredient {
  ingredientId: string;
  ingredientName: string;
  originalQuantity: number;
  originalUnit: string;
  scaledQuantity: number;
  scaledUnit: string;
  cost?: number;
  pricePerKg?: number;
}

interface PrintableRecipeProps {
  recipe: RecipeWithDetails;
  targetWeight: string;
  targetUnit: string;
  originalWeight: number;
  scaledIngredients: ScaledIngredient[];
  scaleFactor: number;
  totalCost?: number;
  totalWeight?: number;
}

const PrintableRecipe = forwardRef<HTMLDivElement, PrintableRecipeProps>(({
  recipe,
  targetWeight,
  targetUnit,
  originalWeight,
  scaledIngredients,
  scaleFactor,
  totalCost,
  totalWeight
}, ref) => {
  const currentDate = new Date().toLocaleDateString('pl-PL');
  const currentTime = new Date().toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'});
  
  // Calculate ingredient percentages and costs
  const finalTotalWeight = totalWeight || scaledIngredients.reduce((sum, ing) => {
    const weight = ing.scaledUnit === 'kg' ? ing.scaledQuantity * 1000 : 
                   ing.scaledUnit === 'l' ? ing.scaledQuantity * 1000 : 
                   ing.scaledUnit === 'ml' ? ing.scaledQuantity : 
                   ing.scaledQuantity;
    return sum + weight;
  }, 0);
  
  let calculatedTotalCost = 0;
  const ingredientsWithPercentages = scaledIngredients.map(ing => {
    const weight = ing.scaledUnit === 'kg' ? ing.scaledQuantity * 1000 : 
                   ing.scaledUnit === 'l' ? ing.scaledQuantity * 1000 : 
                   ing.scaledUnit === 'ml' ? ing.scaledQuantity : 
                   ing.scaledQuantity;
    const percentage = finalTotalWeight > 0 ? (weight / finalTotalWeight * 100) : 0;
    const cost = (weight / 1000) * (ing.pricePerKg || 5); // Default cost 5 zł/kg
    calculatedTotalCost += cost;
    return { ...ing, weightPercent: percentage, weight, cost };
  });
  
  const finalTotalCost = totalCost || calculatedTotalCost;
  
  // Check dietary properties
  const hasVege = recipe.isVegan;
  const hasGlutenFree = recipe.isGlutenFree;
  const hasVegan = recipe.isVegan;
  const hasLactoseFree = recipe.isLactoseFree;
  
  // Get allergens from recipe data (already aggregated from ingredients)
  const allergens = recipe.allergens || [];

  return (
    <div ref={ref}>
      <style>{`
        @page {
          margin: 20mm;
          size: A4;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          margin: 0;
          padding: 0;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 10px;
        }
        
        .company-info {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .company-name {
          font-size: 14px;
          font-weight: bold;
        }
        
        .recipe-title {
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          margin: 30px 0;
          text-transform: uppercase;
        }
        
        .info-sections {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .info-section {
          width: 48%;
        }
        
        .section-title {
          font-weight: bold;
          font-size: 13px;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          padding: 2px 0;
        }
        
        .info-label {
          font-weight: bold;
        }
        
        .ingredients-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        .ingredients-table th {
          background-color: #f0f0f0;
          border: 1px solid #000;
          padding: 8px;
          text-align: center;
          font-weight: bold;
          font-size: 11px;
        }
        
        .ingredients-table td {
          border: 1px solid #000;
          padding: 6px 8px;
          text-align: center;
          font-size: 11px;
        }
        
        .ingredients-table td:first-child {
          text-align: left;
        }
        
        .total-row {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        
        .allergens-section,
        .instructions-section {
          margin: 20px 0;
          border: 1px solid #000;
          padding: 10px;
        }
        
        .instructions-section ol {
          margin: 10px 0;
          padding-left: 20px;
        }
        
        .instructions-section li {
          margin-bottom: 5px;
        }
        
        .footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 10px;
          border-top: 1px solid #000;
          padding-top: 5px;
        }
        
        .tags-section {
          margin: 15px 0;
          padding: 10px;
          background-color: #f9f9f9;
          border: 1px solid #ddd;
        }
        
        .tag {
          display: inline-block;
          padding: 3px 8px;
          margin: 2px;
          background-color: #28a745;
          color: white;
          border-radius: 3px;
          font-size: 10px;
          font-weight: bold;
        }
        
        .tag.gluten-free {
          background-color: #007bff;
        }
        
        .tag.vegan {
          background-color: #ffc107;
          color: #000;
        }
        
        .tag.lactose-free {
          background-color: #6f42c1;
        }
        
        @media print {
          .no-print {
            display: none;
          }
        }
      `}</style>

      <div className="header">
        <div>{currentDate}, {currentTime}</div>
        <div>Karta Produktu - {recipe.category?.name || 'przepis'}</div>
      </div>
      
      <div className="company-info">
        <div className="company-name">Recipe by Leon Tyrała</div>
      </div>
      
      <div className="recipe-title">{recipe.name}</div>
      
      {(hasVege || hasGlutenFree || hasVegan || hasLactoseFree) && (
        <div className="tags-section">
          <div className="section-title">Właściwości dietetyczne</div>
          {hasVege && <span className="tag">🌱 VEGE</span>}
          {hasGlutenFree && <span className="tag gluten-free">🌾 BEZGLUTENOWE</span>}
          {hasVegan && <span className="tag vegan">🌿 WEGAŃSKIE</span>}
          {hasLactoseFree && <span className="tag lactose-free">🥛 BEZ LAKTOZY</span>}
        </div>
      )}
      
      <div className="info-sections">
        <div className="info-section">
          <div className="section-title">Informacje podstawowe</div>
          <div className="info-row">
            <span className="info-label">Nazwa:</span>
            <span>{recipe.name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Kategoria:</span>
            <span>{recipe.category?.name || 'nie określono'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Całkowita waga składników:</span>
            <span>{finalTotalWeight.toFixed(0)} g</span>
          </div>
          <div className="info-row">
            <span className="info-label">Wydajność:</span>
            <span>{recipe.totalYieldGrams ? `${recipe.totalYieldGrams} g` : 'nie określono'}</span>
          </div>
        </div>
        
        <div className="info-section">
          <div className="section-title">Kalkulacja kosztów</div>
          <div className="info-row">
            <span className="info-label">Koszt składników:</span>
            <span>{finalTotalCost.toFixed(2)} zł</span>
          </div>
          <div className="info-row">
            <span className="info-label">Koszt po uwzględnieniu wydajności:</span>
            <span>{finalTotalCost.toFixed(2)} zł</span>
          </div>
          <div className="info-row">
            <span className="info-label">Data:</span>
            <span>{currentDate}</span>
          </div>
        </div>
      </div>
      
      <table className="ingredients-table">
        <thead>
          <tr>
            <th>SKŁADNIK</th>
            <th>ILOŚĆ</th>
            <th>JEDNOSTKA</th>
            <th>UDZIAŁ WAGOWY</th>
            <th>KOSZT</th>
          </tr>
        </thead>
        <tbody>
          {ingredientsWithPercentages.map((ing, index) => (
            <tr key={index}>
              <td>{ing.ingredientName}</td>
              <td>{ing.scaledQuantity.toFixed(ing.scaledQuantity < 10 ? 1 : 0)}</td>
              <td>{ing.scaledUnit}</td>
              <td>{ing.weightPercent.toFixed(1)}%</td>
              <td>{ing.cost.toFixed(2)} zł</td>
            </tr>
          ))}
          <tr className="total-row">
            <td><strong>SUMA</strong></td>
            <td><strong>{finalTotalWeight.toFixed(0)}</strong></td>
            <td><strong>g</strong></td>
            <td><strong>100.0%</strong></td>
            <td><strong>{finalTotalCost.toFixed(2)} zł</strong></td>
          </tr>
        </tbody>
      </table>
      
      {recipe.instructions && recipe.instructions.length > 0 && (
        <div className="instructions-section">
          <div className="section-title">Instrukcja wykonania</div>
          <ol>
            {recipe.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>
      )}
      
      {allergens.length > 0 && (
        <div className="allergens-section">
          <div className="section-title">Alergeny</div>
          <div>{allergens.join(', ')}</div>
        </div>
      )}
      
      <div className="footer">
        Generated by Recipe by Leon Tyrała • {currentDate} {currentTime} • Strona 1 z 1
      </div>
    </div>
  );
});

PrintableRecipe.displayName = "PrintableRecipe";

export default PrintableRecipe;