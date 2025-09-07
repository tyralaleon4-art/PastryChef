import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";
import { calculateScalingFactor } from "@/lib/calculations";

export default function PortionCalculator() {
  const [originalServings, setOriginalServings] = useState<number>(12);
  const [targetServings, setTargetServings] = useState<number>(24);
  const [scalingFactor, setScalingFactor] = useState<number>(2.0);

  const handleCalculate = () => {
    const factor = calculateScalingFactor(originalServings, targetServings);
    setScalingFactor(factor);
  };

  return (
    <Card className="bg-background border border-border" data-testid="portion-calculator">
      <CardContent className="p-6">
        <h4 className="font-semibold text-foreground mb-4 flex items-center">
          <Calculator className="text-primary mr-2" size={20} />
          Portion Calculator
        </h4>
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-muted-foreground mb-1">
              Original Yield
            </Label>
            <Input
              type="number"
              value={originalServings}
              onChange={(e) => setOriginalServings(Number(e.target.value))}
              data-testid="input-original-servings"
            />
          </div>
          <div>
            <Label className="block text-sm font-medium text-muted-foreground mb-1">
              Target Yield
            </Label>
            <Input
              type="number"
              value={targetServings}
              onChange={(e) => setTargetServings(Number(e.target.value))}
              data-testid="input-target-servings"
            />
          </div>
          <div className="bg-muted p-3 rounded-md">
            <p className="text-xs text-muted-foreground">Scaling Factor</p>
            <p className="text-lg font-bold text-primary" data-testid="scaling-factor">
              {scalingFactor.toFixed(1)}x
            </p>
          </div>
          <Button 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90" 
            onClick={handleCalculate}
            data-testid="button-calculate-portions"
          >
            Calculate Portions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
