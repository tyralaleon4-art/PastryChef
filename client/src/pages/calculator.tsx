import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import PortionCalculator from "@/components/portion-calculator";
import CostCalculator from "@/components/cost-calculator";
import UnitConverter from "@/components/unit-converter";
import YieldCalculator from "@/components/yield-calculator";
import RecipeScaleDialog from "@/components/recipe-scale-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator as CalculatorIcon } from "lucide-react";

export default function Calculator() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <Header 
          title="Recipe Calculators" 
          subtitle="Professional calculation tools for scaling, costing, and unit conversions"
        />
        
        <div className="p-6">
          <div className="calculator-grid">
            <PortionCalculator />
            <CostCalculator />
            <UnitConverter />
            <YieldCalculator />
            
            {/* Recipe Scale Calculator Card */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CalculatorIcon size={20} />
                  <span>Recipe Scale Calculator</span>
                </CardTitle>
                <CardDescription>
                  Scale any recipe to your desired weight with precise ingredient calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a recipe and target weight to automatically calculate scaled ingredient quantities using professional conversion factors.
                </p>
                <RecipeScaleDialog data-testid="button-open-recipe-scale-calculator" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
