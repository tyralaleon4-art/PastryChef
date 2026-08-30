import { forwardRef } from "react";
import { BRANDING } from "@/config/branding";
import { useI18n } from "@/i18n";
import { enProduction, plProduction } from "@/i18n/production";

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
  const { language } = useI18n();
  const translations = language === "en" ? enProduction : plProduction;
  const t = (key: string, values: Record<string, string | number> = {}) => {
    const entry = translations[key] ?? key;
    return typeof entry === "function" ? entry(values) : entry;
  };
  const locale = language === "en" ? "en-US" : "pl-PL";
  const currentDate = new Date().toLocaleDateString(locale);
  const currentTime = new Date().toLocaleTimeString(locale, {hour: '2-digit', minute: '2-digit'});

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

        .brand-logo {
          display: block;
          width: 30mm;
          height: 30mm;
          object-fit: cover;
          margin: 0 auto 8px;
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
          <img className="brand-logo" src="/logo-art-de-sucre.png" alt="Art de Sucre" />
          <div className="plan-title">{planName}</div>
          {planDescription && (
            <div className="plan-description">{planDescription}</div>
          )}
          <div className="date-info">
            {t("generated", { date: currentDate, time: currentTime })}
          </div>
        </div>
        
        <div className="summary-box">
          <div className="summary-item">
            <div className="summary-value">{recipes.length}</div>
            <div className="summary-label">{t("recipesInPlan")}</div>
          </div>
          <div className="summary-item">
            <div className="summary-value">{ingredientList.length}</div>
            <div className="summary-label">{t("ingredients")}</div>
          </div>
          <div className="summary-item">
            <div className="summary-value">
              {Math.round(ingredientList.reduce((sum, ing) => sum + ing.totalQuantity, 0))} g
            </div>
            <div className="summary-label">{t("ingredientTotal")}</div>
          </div>
        </div>

        <div className="section-title">{t("recipesInPlan")} ({recipes.length})</div>
        
        {recipes.map((recipe, index) => (
          <div key={index} className="recipe-card">
            <div className="recipe-header">
              <div className="recipe-name">{index + 1}. {recipe.recipeName}</div>
              <div className="recipe-meta">
                {t("target")} {recipe.targetWeight} {recipe.targetUnit}<br/>
                {t("scaling")} {recipe.scaleFactor}x
              </div>
            </div>
            
            <table className="ingredients-table">
              <thead>
                <tr>
                  <th style={{width: '50%'}}>{t("ingredient")}</th>
                  <th style={{width: '25%'}}>{t("quantity")}</th>
                  <th style={{width: '25%'}}>{t("unit")}</th>
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
                <strong style={{fontSize: '11px'}}>{t("instructions")}:</strong>
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
          <div className="shopping-title">{t("shoppingList")}</div>
          <table className="shopping-table">
            <thead>
              <tr>
                <th style={{width: '40%'}}>{t("ingredient")}</th>
                <th style={{width: '20%'}}>{t("quantity")}</th>
                <th style={{width: '40%'}}>{t("usedInRecipes")}</th>
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
          {BRANDING.productName} - {t("printFooter")}
        </div>
      </div>
    </div>
  );
});

PrintableProductionPlan.displayName = "PrintableProductionPlan";

export default PrintableProductionPlan;
