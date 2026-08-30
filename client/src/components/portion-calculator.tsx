import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";
import { calculateScalingFactor } from "@/lib/calculations";
import { useI18n } from "@/i18n";

export default function PortionCalculator() {
  const { t } = useI18n();
  const [originalServings, setOriginalServings] = useState<number>(12);
  const [targetServings, setTargetServings] = useState<number>(24);
  const [scalingFactor, setScalingFactor] = useState<number>(2.0);

  const handleCalculate = () => {
    const factor = calculateScalingFactor(originalServings, targetServings);
    setScalingFactor(factor);
  };

  return (
    <Card className="bg-card border border-border" data-testid="portion-calculator">
      <CardContent className="p-6">
        <h4 className="font-semibold text-foreground mb-4 flex items-center">
          <Calculator className="text-secondary mr-2" size={20} />
          {t("calculator.portions")}
        </h4>
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-muted-foreground mb-1">
              {t("calculator.originalYield")}
            </Label>
            <Input
              type="number"
              value={originalServings}
              onChange={(e) => setOriginalServings(Number(e.target.value))}
              data-testid="input-original-servings"
              style={{ fontSize: '16px' }}
            />
          </div>
          <div>
            <Label className="block text-sm font-medium text-muted-foreground mb-1">
              {t("calculator.targetYield")}
            </Label>
            <Input
              type="number"
              value={targetServings}
              onChange={(e) => setTargetServings(Number(e.target.value))}
              data-testid="input-target-servings"
              style={{ fontSize: '16px' }}
            />
          </div>
          <div className="bg-muted p-3 rounded-md">
            <p className="text-xs text-muted-foreground">{t("calculator.scalingFactor")}</p>
            <p className="text-lg font-bold text-secondary" data-testid="scaling-factor">
              {scalingFactor.toFixed(2)}x
            </p>
          </div>
          <Button 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90" 
            onClick={handleCalculate}
            data-testid="button-calculate-portions"
          >
            {t("calculator.calculatePortions")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
