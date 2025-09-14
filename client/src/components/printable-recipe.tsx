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
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'});
  
  // Calculate ingredient percentages
  const finalTotalWeight = totalWeight || scaledIngredients.reduce((sum, ing) => {
    const weight = ing.scaledUnit === 'kg' ? ing.scaledQuantity * 1000 : 
                   ing.scaledUnit === 'l' ? ing.scaledQuantity * 1000 : 
                   ing.scaledUnit === 'ml' ? ing.scaledQuantity : 
                   ing.scaledQuantity;
    return sum + weight;
  }, 0);
  
  const ingredientsWithPercentages = scaledIngredients.map(ing => {
    const weight = ing.scaledUnit === 'kg' ? ing.scaledQuantity * 1000 : 
                   ing.scaledUnit === 'l' ? ing.scaledQuantity * 1000 : 
                   ing.scaledUnit === 'ml' ? ing.scaledQuantity : 
                   ing.scaledQuantity;
    const percentage = finalTotalWeight > 0 ? (weight / finalTotalWeight * 100) : 0;
    return { ...ing, weightPercent: percentage, weight };
  });
  
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
        @page {
          margin: 20mm;
          size: A4;
        }
        
        @media print {
          .print-container {
            font-family: 'Arial', sans-serif !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            background: white !important;
          }
          
          .header {
            display: flex !important;
            justify-content: space-between !important;
            margin-bottom: 20px !important;
            font-size: 10px !important;
          }
          
          .company-info {
            text-align: center !important;
            margin-bottom: 30px !important;
          }
          
          .company-name {
            font-size: 14px !important;
            font-weight: bold !important;
          }
          
          .recipe-title {
            font-size: 16px !important;
            font-weight: bold !important;
            text-align: center !important;
            margin: 30px 0 !important;
            text-transform: uppercase !important;
          }
          
          .info-sections {
            display: flex !important;
            justify-content: space-between !important;
            margin-bottom: 20px !important;
          }
          
          .info-section {
            width: 48% !important;
          }
          
          .section-title {
            font-weight: bold !important;
            font-size: 13px !important;
            margin-bottom: 10px !important;
            text-transform: uppercase !important;
          }
          
          .info-row {
            display: flex !important;
            justify-content: space-between !important;
            margin-bottom: 5px !important;
            padding: 2px 0 !important;
          }
          
          .info-label {
            font-weight: bold !important;
          }
          
          .ingredients-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 20px 0 !important;
          }
          
          .ingredients-table th {
            background-color: #f0f0f0 !important;
            border: 1px solid #000 !important;
            padding: 8px !important;
            text-align: center !important;
            font-weight: bold !important;
            font-size: 11px !important;
          }
          
          .ingredients-table td {
            border: 1px solid #000 !important;
            padding: 6px 8px !important;
            text-align: center !important;
            font-size: 11px !important;
          }
          
          .ingredients-table td:first-child {
            text-align: left !important;
          }
          
          .total-row {
            background-color: #f0f0f0 !important;
            font-weight: bold !important;
          }
          
          .allergens-section,
          .instructions-section {
            margin: 20px 0 !important;
            border: 1px solid #000 !important;
            padding: 10px !important;
          }
          
          .tags-section {
            margin: 15px 0 !important;
            padding: 10px !important;
            background-color: #f9f9f9 !important;
            border: 1px solid #ddd !important;
          }
          
          .tag {
            display: inline-block !important;
            padding: 3px 8px !important;
            margin: 2px !important;
            background-color: #28a745 !important;
            color: white !important;
            border-radius: 3px !important;
            font-size: 10px !important;
            font-weight: bold !important;
          }
          
          .tag.gluten-free {
            background-color: #007bff !important;
          }
          
          .tag.vegan {
            background-color: #ffc107 !important;
            color: #000 !important;
          }
          
          .tag.lactose-free {
            background-color: #6f42c1 !important;
          }
          
          .instructions-section ol {
            margin: 10px 0 !important;
            padding-left: 20px !important;
          }
          
          .instructions-section li {
            margin-bottom: 5px !important;
          }
          
          .footer {
            text-align: center !important;
            font-size: 10px !important;
            border-top: 1px solid #000 !important;
            padding-top: 5px !important;
            margin-top: 30px !important;
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

      {/* Professional Header */}
      <div className="header">
        <div>{currentDate}, {currentTime}</div>
        <div>Karta Produktu - {recipe.category?.name || 'przepis'}</div>
      </div>
      
      <div className="company-info">
        <div className="company-name">PASTRERY PRO</div>
      </div>
      
      <div className="recipe-title">{recipe.name}</div>
      
      {/* Dietary Tags Section */}
      {(recipe.isVegan || recipe.isGlutenFree || recipe.isLactoseFree) && (
        <div className="tags-section">
          <div className="section-title">Właściwości dietetyczne</div>
          {recipe.isVegan && <span className="tag vegan">🌱 VEGE</span>}
          {recipe.isGlutenFree && <span className="tag gluten-free">🌾 BEZGLUTENOWE</span>}
          {recipe.isLactoseFree && <span className="tag lactose-free">🥛 BEZ LAKTOZY</span>}
        </div>
      )}
      
      {/* Information Sections */}
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
            <span className="info-label">Współczynnik skalowania:</span>
            <span>{scaleFactor.toFixed(3)}x</span>
          </div>
        </div>
        
        <div className="info-section">
          <div className="section-title">Kalkulacja kosztów</div>
          <div className="info-row">
            <span className="info-label">Koszt składników:</span>
            <span>{(totalCost || 0).toFixed(2)} zł</span>
          </div>
          <div className="info-row">
            <span className="info-label">Waga oryginalna:</span>
            <span>{Math.round(originalWeight)} g</span>
          </div>
          <div className="info-row">
            <span className="info-label">Waga skalowana:</span>
            <span>{targetWeight}{targetUnit}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Data:</span>
            <span>{currentDate}</span>
          </div>
        </div>
      </div>
      
      {/* Professional Ingredients Table with Percentages */}
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
            <tr key={ing.ingredientId}>
              <td>{ing.ingredientName}</td>
              <td>{formatQuantity(ing.scaledQuantity, ing.scaledUnit)}</td>
              <td>{ing.scaledUnit}</td>
              <td>{ing.weightPercent.toFixed(1)}%</td>
              <td>{(ing.cost || 0).toFixed(2)} zł</td>
            </tr>
          ))}
          <tr className="total-row">
            <td><strong>RAZEM</strong></td>
            <td><strong>{finalTotalWeight.toFixed(0)}</strong></td>
            <td><strong>g</strong></td>
            <td><strong>100.0%</strong></td>
            <td><strong>{(totalCost || 0).toFixed(2)} zł</strong></td>
          </tr>
        </tbody>
      </table>
      
      {/* Allergens Section */}
      <div className="allergens-section">
        <div className="section-title">Alergeny</div>
        <div className="info-row">
          <span className="info-label">Zawiera:</span>
          <span>{recipe.allergens && recipe.allergens.length > 0 ? recipe.allergens.join(', ') : 'brak'}</span>
        </div>
      </div>
      
      {/* Instructions Section */}
      {recipe.instructions && recipe.instructions.length > 0 && (
        <div className="instructions-section">
          <div className="section-title">Instrukcje produkcji</div>
          <ol>
            {recipe.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>
      )}
      
      {/* Professional Footer */}
      <div className="footer">
        <div>Karta odpowiedzialnego</div>
        <div>Wygenerowano: {currentDate}, {currentTime}</div>
      </div>
    </div>
  );
});

PrintableRecipe.displayName = "PrintableRecipe";

export default PrintableRecipe;