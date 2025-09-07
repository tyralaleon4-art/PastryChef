import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import PortionCalculator from "@/components/portion-calculator";
import CostCalculator from "@/components/cost-calculator";
import UnitConverter from "@/components/unit-converter";
import YieldCalculator from "@/components/yield-calculator";

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
          </div>
        </div>
      </main>
    </div>
  );
}
