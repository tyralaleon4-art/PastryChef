import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import PortionCalculator from "@/components/portion-calculator";
import CostCalculator from "@/components/cost-calculator";
import UnitConverter from "@/components/unit-converter";
import YieldCalculator from "@/components/yield-calculator";
import RecipeScaleDialog from "@/components/recipe-scale-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator as CalculatorIcon } from "lucide-react";
import { useI18n } from "@/i18n";

export default function Calculator() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen md:h-screen flex-col md:flex-row md:overflow-hidden">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <Header
            title={t("calculator.title")}
            subtitle={t("calculator.subtitle")}
          />

          <main className="flex-1 overflow-y-auto px-4 md:px-6 pb-16 md:pb-0">
            <div className="max-w-7xl mx-auto py-4 md:py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <PortionCalculator />
                <CostCalculator />
                <UnitConverter />
                <YieldCalculator />

                <Card className="order-first p-4 md:order-none md:p-6">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
                      <CalculatorIcon size={20} />
                      <span>{t("calculator.recipeScale")}</span>
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {t("calculator.recipeScaleDescription")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("calculator.recipeScaleHelp")}
                    </p>
                    <RecipeScaleDialog data-testid="button-open-recipe-scale-calculator" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
