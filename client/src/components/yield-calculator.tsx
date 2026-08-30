import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { useI18n } from "@/i18n";

export default function YieldCalculator() {
  const { t } = useI18n();
  const [batchSize, setBatchSize] = useState<number>(24);
  const [portionSize, setPortionSize] = useState<number>(85);
  const [totalYield, setTotalYield] = useState<number>(2.04);

  const handleCalculate = () => {
    const yield_kg = (batchSize * portionSize) / 1000;
    setTotalYield(yield_kg);
  };

  return (
    <Card className="bg-card border border-border" data-testid="yield-calculator">
      <CardContent className="p-6">
        <h4 className="font-semibold text-foreground mb-4 flex items-center">
          <TrendingUp className="text-secondary mr-2" size={20} />
           {t("calculator.yield")}
        </h4>
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-muted-foreground mb-1">
               {t("calculator.batchSize")}
            </Label>
            <Input
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              data-testid="input-batch-size"
              style={{ fontSize: '16px' }}
            />
          </div>
          <div>
            <Label className="block text-sm font-medium text-muted-foreground mb-1">
               {t("calculator.portionWeight")}
            </Label>
            <Input
              type="number"
              value={portionSize}
              onChange={(e) => setPortionSize(Number(e.target.value))}
              data-testid="input-portion-size"
              style={{ fontSize: '16px' }}
            />
          </div>
          <div className="bg-muted p-3 rounded-md">
            <p className="text-xs text-muted-foreground">{t("calculator.totalYield")}</p>
            <p className="text-lg font-bold text-secondary" data-testid="total-yield">
              {totalYield.toFixed(2)} kg
            </p>
          </div>
          <Button 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleCalculate}
            data-testid="button-calculate-yield"
          >
            {t("calculator.calculateYield")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
