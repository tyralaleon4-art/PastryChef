import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

export default function YieldCalculator() {
  const [batchSize, setBatchSize] = useState<number>(24);
  const [portionSize, setPortionSize] = useState<number>(85);
  const [totalYield, setTotalYield] = useState<number>(2.04);

  const handleCalculate = () => {
    const yield_kg = (batchSize * portionSize) / 1000;
    setTotalYield(yield_kg);
  };

  return (
    <Card className="bg-background border border-border" data-testid="yield-calculator">
      <CardContent className="p-6">
        <h4 className="font-semibold text-foreground mb-4 flex items-center">
          <TrendingUp className="text-purple-600 mr-2" size={20} />
          Yield Calculator
        </h4>
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-muted-foreground mb-1">
              Batch Size
            </Label>
            <Input
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              data-testid="input-batch-size"
            />
          </div>
          <div>
            <Label className="block text-sm font-medium text-muted-foreground mb-1">
              Portion Size (g)
            </Label>
            <Input
              type="number"
              value={portionSize}
              onChange={(e) => setPortionSize(Number(e.target.value))}
              data-testid="input-portion-size"
            />
          </div>
          <div className="bg-muted p-3 rounded-md">
            <p className="text-xs text-muted-foreground">Total Yield</p>
            <p className="text-lg font-bold text-purple-600" data-testid="total-yield">
              {totalYield.toFixed(2)} kg
            </p>
          </div>
          <Button 
            className="w-full bg-purple-600 text-white hover:bg-purple-700"
            onClick={handleCalculate}
            data-testid="button-calculate-yield"
          >
            Calculate Yield
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
