import { forwardRef } from "react";

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

interface AggregatedIngredient {
  name: string;
  totalQuantity: number;
  unit: string;
  recipes: string[];
}

interface PrintableProductionPlanProps {
  planName: string;
  planDescription?: string;
  recipes: ScaledRecipe[];
  ingredientList: AggregatedIngredient[];
}

const PrintableProductionPlan = forwardRef<HTMLDivElement, PrintableProductionPlanProps>(({
  planName,
  planDescription,
  recipes,
  ingredientList
}, ref) => {
  const currentDate = new Date().toLocaleDateString('pl-PL');
  const currentTime = new Date().toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'});

  return (
    <div ref={ref}>
      <style>{`
        @page {
          margin: 15mm;
          size: A4;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 11px;
          line-height: 1.4;
          color: #000;
          margin: 0;
          padding: 0;
        }
        
        .print-container {
          max-width: 210mm;
          padding: 10mm;
          background: white;
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #1a1a1a;
          padding-bottom: 15px;
        }
        
        .plan-title {
          font-size: 24px;
          font-weight: bold;
          color: #1a1a1a;
          margin-bottom: 5px;
        }
        
        .plan-description {
          font-size: 12px;
          color: #666;
          margin-bottom: 10px;
        }
        
        .date-info {
          font-size: 10px;
          color: #888;
        }
        
        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #1a1a1a;
          margin: 25px 0 15px 0;
          padding-bottom: 5px;
          border-bottom: 1px solid #ddd;
        }
        
        .recipe-card {
          background: #f8f8f8;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 15px;
          page-break-inside: avoid;
        }
        
        .recipe-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 8px;
        }
        
        .recipe-name {
          font-size: 14px;
          font-weight: bold;
          color: #1a1a1a;
        }
        
        .recipe-meta {
          font-size: 10px;
          color: #666;
          text-align: right;
        }
        
        .ingredients-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 10px;
        }
        
        .ingredients-table th {
          background: #e8e8e8;
          padding: 6px 8px;
          text-align: left;
          font-weight: bold;
          border: 1px solid #ddd;
        }
        
        .ingredients-table td {
          padding: 5px 8px;
          border: 1px solid #ddd;
          background: white;
        }
        
        .instructions-list {
          margin: 0;
          padding-left: 20px;
          font-size: 10px;
        }
        
        .instructions-list li {
          margin-bottom: 4px;
        }
        
        .shopping-list {
          background: #f0f7f0;
          border: 2px solid #4a7c4a;
          border-radius: 8px;
          padding: 20px;
          margin-top: 25px;
        }
        
        .shopping-title {
          font-size: 18px;
          font-weight: bold;
          color: #2d5a2d;
          margin-bottom: 15px;
          text-align: center;
        }
        
        .shopping-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        
        .shopping-table th {
          background: #4a7c4a;
          color: white;
          padding: 8px;
          text-align: left;
          font-weight: bold;
        }
        
        .shopping-table td {
          padding: 6px 8px;
          border-bottom: 1px solid #ccc;
          background: white;
        }
        
        .shopping-table tr:nth-child(even) td {
          background: #f5f5f5;
        }
        
        .quantity-cell {
          font-weight: bold;
          text-align: right;
          white-space: nowrap;
        }
        
        .recipes-used {
          font-size: 9px;
          color: #666;
          font-style: italic;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 9px;
          color: #888;
        }
        
        .summary-box {
          display: flex;
          justify-content: space-around;
          background: #f0f0f0;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        
        .summary-item {
          text-align: center;
        }
        
        .summary-value {
          font-size: 20px;
          font-weight: bold;
          color: #1a1a1a;
        }
        
        .summary-label {
          font-size: 10px;
          color: #666;
        }
      `}</style>
      
      <div className="print-container">
        <div className="header">
          <div className="plan-title">{planName}</div>
          {planDescription && (
            <div className="plan-description">{planDescription}</div>
          )}
          <div className="date-info">
            Wygenerowano: {currentDate} o {currentTime}
          </div>
        </div>
        
        <div className="summary-box">
          <div className="summary-item">
            <div className="summary-value">{recipes.length}</div>
            <div className="summary-label">Przepisy</div>
          </div>
          <div className="summary-item">
            <div className="summary-value">{ingredientList.length}</div>
            <div className="summary-label">Składniki</div>
          </div>
          <div className="summary-item">
            <div className="summary-value">
              {Math.round(ingredientList.reduce((sum, ing) => sum + ing.totalQuantity, 0))} g
            </div>
            <div className="summary-label">Suma składników</div>
          </div>
        </div>

        <div className="section-title">Przepisy ({recipes.length})</div>
        
        {recipes.map((recipe, index) => (
          <div key={index} className="recipe-card">
            <div className="recipe-header">
              <div className="recipe-name">{index + 1}. {recipe.recipeName}</div>
              <div className="recipe-meta">
                Docelowo: {recipe.targetWeight} {recipe.targetUnit}<br/>
                Skalowanie: {recipe.scaleFactor}x
              </div>
            </div>
            
            <table className="ingredients-table">
              <thead>
                <tr>
                  <th style={{width: '50%'}}>Składnik</th>
                  <th style={{width: '25%'}}>Ilość</th>
                  <th style={{width: '25%'}}>Jednostka</th>
                </tr>
              </thead>
              <tbody>
                {recipe.ingredients.map((ing, i) => (
                  <tr key={i}>
                    <td>{ing.name}</td>
                    <td style={{textAlign: 'right', fontWeight: 'bold'}}>
                      {ing.scaledQuantity.toFixed(1)}
                    </td>
                    <td>{ing.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {recipe.instructions && recipe.instructions.length > 0 && (
              <div>
                <strong style={{fontSize: '11px'}}>Instrukcje:</strong>
                <ol className="instructions-list">
                  {recipe.instructions.map((instr, i) => (
                    <li key={i}>{instr}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ))}

        <div className="shopping-list">
          <div className="shopping-title">📦 Lista zakupów - suma składników</div>
          <table className="shopping-table">
            <thead>
              <tr>
                <th style={{width: '40%'}}>Składnik</th>
                <th style={{width: '20%'}}>Ilość</th>
                <th style={{width: '40%'}}>Używane w przepisach</th>
              </tr>
            </thead>
            <tbody>
              {ingredientList.map((ing, index) => (
                <tr key={index}>
                  <td>{ing.name}</td>
                  <td className="quantity-cell">
                    {ing.totalQuantity.toFixed(1)} {ing.unit}
                  </td>
                  <td className="recipes-used">{ing.recipes.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="footer">
          PastryPro - System zarządzania recepturami | Plan produkcji wygenerowany automatycznie
        </div>
      </div>
    </div>
  );
});

PrintableProductionPlan.displayName = "PrintableProductionPlan";

export default PrintableProductionPlan;
