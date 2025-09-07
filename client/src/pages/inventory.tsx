import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Package, Plus } from "lucide-react";
import type { IngredientWithStock, InventoryLog } from "@shared/schema";

export default function Inventory() {
  const { data: lowStockIngredients = [] } = useQuery<IngredientWithStock[]>({
    queryKey: ["/api/inventory/low-stock"],
  });

  const { data: inventoryLogs = [] } = useQuery<(InventoryLog & { ingredient: any })[]>({
    queryKey: ["/api/inventory/logs"],
  });

  const getAlertIcon = (stockStatus: string) => {
    if (stockStatus === "expired") return <Clock className="text-red-600" size={20} />;
    return <AlertTriangle className="text-orange-600" size={20} />;
  };

  const getAlertSeverity = (stockStatus: string) => {
    if (stockStatus === "expired") return "destructive";
    return "destructive";
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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <Header 
          title="Inventory Management" 
          subtitle="Monitor stock levels, track usage, and manage restocking"
          action={
            <Button data-testid="button-add-inventory-log">
              <Plus size={16} className="mr-2" />
              Log Transaction
            </Button>
          }
        />
        
        <div className="p-6 space-y-6">
          {/* Low Stock Alerts */}
          <Card data-testid="low-stock-alerts">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <AlertTriangle className="text-orange-600 mr-2" size={20} />
                Stock Alerts ({lowStockIngredients.length})
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Items requiring attention</p>
            </div>
            <CardContent className="p-6">
              {lowStockIngredients.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">All ingredients are properly stocked</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lowStockIngredients.map((ingredient) => (
                    <div key={ingredient.id} className="flex items-center justify-between p-4 border border-border rounded-lg" data-testid={`alert-item-${ingredient.id}`}>
                      <div className="flex items-center space-x-4">
                        {getAlertIcon(ingredient.stockStatus)}
                        <div>
                          <h4 className="font-medium text-foreground">{ingredient.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Current: {Number(ingredient.currentStock).toFixed(1)} {ingredient.unit} | 
                            Minimum: {Number(ingredient.minimumStock).toFixed(1)} {ingredient.unit}
                          </p>
                          {ingredient.expiryDate && ingredient.stockStatus === "expired" && (
                            <p className="text-sm text-red-600">
                              Expired on {new Date(ingredient.expiryDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getAlertSeverity(ingredient.stockStatus)}>
                          {ingredient.stockStatus === "expired" ? "Expired" : "Low Stock"}
                        </Badge>
                        <Button size="sm" data-testid={`button-restock-${ingredient.id}`}>
                          Restock
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Inventory Activity */}
          <Card data-testid="inventory-logs">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
              <p className="text-sm text-muted-foreground mt-1">Latest inventory transactions and adjustments</p>
            </div>
            <CardContent className="p-6">
              {inventoryLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No inventory activity yet</p>
                  <Button className="mt-4" data-testid="button-log-first-transaction">
                    <Plus size={16} className="mr-2" />
                    Log First Transaction
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {inventoryLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border border-border rounded-lg" data-testid={`log-item-${log.id}`}>
                      <div className="flex items-center space-x-4">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getLogTypeColor(log.type)}`}>
                          {log.type.charAt(0).toUpperCase() + log.type.slice(1)}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{log.ingredient.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {log.type === "usage" ? "Used" : "Added"} {Number(log.quantity).toFixed(1)} {log.ingredient.unit}
                          </p>
                          {log.notes && (
                            <p className="text-sm text-muted-foreground italic">{log.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : 'Recently'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : ''}
                        </p>
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
  );
}
