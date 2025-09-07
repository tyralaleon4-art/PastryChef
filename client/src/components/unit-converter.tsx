import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft } from "lucide-react";
import { convertUnits } from "@/lib/calculations";

export default function UnitConverter() {
  const [fromValue, setFromValue] = useState<number>(500);
  const [fromUnit, setFromUnit] = useState<string>("grams");
  const [toUnit, setToUnit] = useState<string>("ounces");
  const [result, setResult] = useState<number>(17.64);

  const units = [
    { value: "grams", label: "grams" },
    { value: "ounces", label: "ounces" },
    { value: "pounds", label: "pounds" },
    { value: "kilograms", label: "kilograms" },
    { value: "cups", label: "cups" },
    { value: "tablespoons", label: "tablespoons" },
    { value: "teaspoons", label: "teaspoons" },
    { value: "milliliters", label: "milliliters" },
    { value: "liters", label: "liters" },
  ];

  const handleConvert = () => {
    const converted = convertUnits(fromValue, fromUnit, toUnit);
    setResult(converted);
  };

  return (
    <Card className="bg-background border border-border" data-testid="unit-converter">
      <CardContent className="p-6">
        <h4 className="font-semibold text-foreground mb-4 flex items-center">
          <ArrowRightLeft className="text-green-600 mr-2" size={20} />
          Unit Converter
        </h4>
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-muted-foreground mb-1">
              From
            </Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                value={fromValue}
                onChange={(e) => setFromValue(Number(e.target.value))}
                className="flex-1"
                data-testid="input-from-value"
              />
              <Select value={fromUnit} onValueChange={setFromUnit} data-testid="select-from-unit">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="block text-sm font-medium text-muted-foreground mb-1">
              To
            </Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                value={result.toFixed(2)}
                readOnly
                className="flex-1 bg-muted"
                data-testid="input-result"
              />
              <Select value={toUnit} onValueChange={setToUnit} data-testid="select-to-unit">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            className="w-full bg-green-600 text-white hover:bg-green-700"
            onClick={handleConvert}
            data-testid="button-convert"
          >
            Convert
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
