import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { AlertTriangle, Clock, Package, Plus, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { IngredientWithStock, InventoryLog } from "@shared/schema";

export default function Inventory() {
  const { toast } = useToast();
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [logForm, setLogForm] = useState({ ingredientId: "", quantity: "", type: "restock", notes: "" });

  const { data: lowStockIngredients = [] } = useQuery<IngredientWithStock[]>({
    queryKey: ["/api/inventory/low-stock"],
  });

  const { data: inventoryLogs = [] } = useQuery<(InventoryLog & { ingredient: any })[]>({
    queryKey: ["/api/inventory/logs"],
  });

  const { data: ingredients = [] } = useQuery<any[]>({
    queryKey: ["/api/ingredients"],
  });

  const logMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/inventory/logs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      setIsLogDialogOpen(false);
      setLogForm({ ingredientId: "", quantity: "", type: "restock", notes: "" });
      toast({ title: "Transakcja zapisana" });
    },
    onError: () => {
      toast({ title: "Błąd", description: "Nie udało się zapisać transakcji.", variant: "destructive" });
    }
  });

  const handleLogSubmit = () => {
    if (!logForm.ingredientId || !logForm.quantity) {
      toast({ title: "Wypełnij wymagane pola", variant: "destructive" });
      return;
    }
    logMutation.mutate({
      ingredientId: logForm.ingredientId,
      quantity: logForm.quantity,
      type: logForm.type,
      notes: logForm.notes || undefined,
    });
  };

  const getAlertIcon = (stockStatus: string) => {
    if (stockStatus === "expired") return <Clock className="text-red-600 flex-shrink-0" size={20} />;
    return <AlertTriangle className="text-orange-600 flex-shrink-0" size={20} />;
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case "restock": return "bg-green-100 text-green-800";
      case "usage": return "bg-blue-100 text-blue-800";
      case "adjustment": return "bg-yellow-100 text-yellow-800";
      case "expired": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getLogTypeLabel = (type: string) => {
    switch (type) {
      case "restock": return "Uzupełnienie";
      case "usage": return "Użycie";
      case "adjustment": return "Korekta";
      case "expired": return "Przeterminowane";
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen md:h-screen flex-col md:flex-row md:overflow-hidden">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <Header
            title="Magazyn"
            subtitle="Poziomy zapasów, alerty i historia transakcji"
            action={
              <ResponsiveDialog
                open={isLogDialogOpen}
                onOpenChange={setIsLogDialogOpen}
                title="Nowa transakcja"
                trigger={
                  <Button data-testid="button-add-inventory-log">
                    <Plus size={16} className="mr-2" />
                    Transakcja
                  </Button>
                }
                footer={
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsLogDialogOpen(false)}>Anuluj</Button>
                    <Button onClick={handleLogSubmit} disabled={logMutation.isPending}>
                      {logMutation.isPending ? "Zapisywanie..." : "Zapisz"}
                    </Button>
                  </div>
                }
                className="max-w-md"
              >
                <div className="space-y-4">
                  <div>
                    <Label>Składnik</Label>
                    <Select value={logForm.ingredientId} onValueChange={v => setLogForm(f => ({ ...f, ingredientId: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz składnik..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map((ing: any) => (
                          <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ilość</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={logForm.quantity}
                      onChange={e => setLogForm(f => ({ ...f, quantity: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Typ transakcji</Label>
                    <Select value={logForm.type} onValueChange={v => setLogForm(f => ({ ...f, type: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restock">Uzupełnienie</SelectItem>
                        <SelectItem value="usage">Użycie</SelectItem>
                        <SelectItem value="adjustment">Korekta</SelectItem>
                        <SelectItem value="expired">Przeterminowane</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Notatka (opcjonalnie)</Label>
                    <Textarea
                      placeholder="Dodatkowe informacje..."
                      value={logForm.notes}
                      onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))}
                    />
                  </div>
                </div>
              </ResponsiveDialog>
            }
          />

          <main className="flex-1 overflow-y-auto px-4 md:px-6 pb-16 md:pb-0">
            <div className="max-w-4xl mx-auto py-4 md:py-6 space-y-6">

              {/* Alerty magazynowe */}
              <Card data-testid="low-stock-alerts">
                <div className="p-4 md:p-6 border-b border-border">
                  <h3 className="text-base md:text-lg font-semibold flex items-center">
                    <AlertTriangle className="text-orange-600 mr-2 flex-shrink-0" size={20} />
                    Alerty ({lowStockIngredients.length})
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Składniki wymagające uwagi</p>
                </div>
                <CardContent className="p-4 md:p-6">
                  {lowStockIngredients.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground text-sm">Wszystkie składniki mają odpowiedni poziom zapasów</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lowStockIngredients.map((ingredient) => (
                        <div key={ingredient.id} className="p-3 md:p-4 border border-border rounded-lg" data-testid={`alert-item-${ingredient.id}`}>
                          <div className="flex items-start gap-3">
                            {getAlertIcon(ingredient.stockStatus)}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <h4 className="font-medium text-sm md:text-base">{ingredient.name}</h4>
                                <div className="flex items-center gap-2">
                                  <Badge variant="destructive" className="text-xs">
                                    {ingredient.stockStatus === "expired" ? "Przeterminowane" : "Mały zapas"}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                Aktualnie: <strong>{Number(ingredient.currentStock).toFixed(1)} {ingredient.unit}</strong>
                                {" · "}
                                Minimum: {Number(ingredient.minimumStock).toFixed(1)} {ingredient.unit}
                              </p>
                              {ingredient.expiryDate && ingredient.stockStatus === "expired" && (
                                <p className="text-xs text-red-600 mt-1">
                                  Termin minął: {new Date(ingredient.expiryDate).toLocaleDateString('pl-PL')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Historia transakcji */}
              <Card data-testid="inventory-logs">
                <div className="p-4 md:p-6 border-b border-border">
                  <h3 className="text-base md:text-lg font-semibold">Ostatnie transakcje</h3>
                  <p className="text-sm text-muted-foreground mt-1">Historia ruchów magazynowych</p>
                </div>
                <CardContent className="p-4 md:p-6">
                  {inventoryLogs.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground text-sm">Brak historii transakcji</p>
                      <Button
                        className="mt-4"
                        onClick={() => setIsLogDialogOpen(true)}
                        data-testid="button-log-first-transaction"
                      >
                        <Plus size={16} className="mr-2" />
                        Pierwsza transakcja
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {inventoryLogs.slice(0, 15).map((log) => (
                        <div key={log.id} className="p-3 md:p-4 border border-border rounded-lg" data-testid={`log-item-${log.id}`}>
                          <div className="flex items-start gap-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${getLogTypeColor(log.type)}`}>
                              {getLogTypeLabel(log.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                <h4 className="font-medium text-sm">{log.ingredient.name}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {log.createdAt ? new Date(log.createdAt).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {log.type === "usage" ? "Użyto" : "Dodano"}{" "}
                                <strong>{Number(log.quantity).toFixed(1)} {log.ingredient.unit}</strong>
                              </p>
                              {log.notes && (
                                <p className="text-xs text-muted-foreground italic mt-1">{log.notes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
