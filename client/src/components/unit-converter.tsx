import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft } from "lucide-react";
import { convertUnits } from "@/lib/calculations";
import { useI18n } from "@/i18n";

export default function UnitConverter() {
  const { t } = useI18n();
  const [fromValue, setFromValue] = useState<number>(500);
  const [fromUnit, setFromUnit] = useState<string>("grams");
  const [toUnit, setToUnit] = useState<string>("ounces");
  const [result, setResult] = useState<number>(17.64);

  const units = [
    { value: "grams", label: "gramy (g)" },
    { value: "ounces", label: "uncje (oz)" },
    { value: "pounds", label: "funty (lb)" },
    { value: "kilograms", label: "kilogramy (kg)" },
    { value: "cups", label: "szklanki" },
    { value: "tablespoons", label: "łyżki stołowe" },
    { value: "teaspoons", label: "łyżeczki" },
    { value: "milliliters", label: "mililitry (ml)" },
    { value: "liters", label: "litry (l)" },
  ];

  const handleConvert = () => {
    const converted = convertUnits(fromValue, fromUnit, toUnit);
    setResult(converted);
  };

  return (
    <Card className="bg-card border border-border" data-testid="unit-converter">
      <CardContent className="p-6">
        <h4 className="font-semibold text-foreground mb-4 flex items-center">
          <ArrowRightLeft className="text-secondary mr-2" size={20} />
           {t("calculator.converter")}
        </h4>
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-muted-foreground mb-1">
               {t("calculator.from")}
            </Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                value={fromValue}
                onChange={(e) => setFromValue(Number(e.target.value))}
                className="flex-1"
                data-testid="input-from-value"
                style={{ fontSize: '16px' }}
              />
              <Select value={fromUnit} onValueChange={setFromUnit} data-testid="select-from-unit">
                <SelectTrigger className="w-36">
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
               {t("calculator.to")}
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
                <SelectTrigger className="w-36">
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
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleConvert}
            data-testid="button-convert"
          >
            {t("calculator.convert")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
