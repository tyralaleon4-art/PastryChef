import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

export default function ProductionPlan() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title="Plan produkcji" 
            subtitle="Planowanie wielu przepisów i obliczanie zapotrzebowania na surowce"
          />
          
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6">
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <ClipboardList className="mr-3" size={32} />
                  <div>
                    <h1 className="text-3xl font-bold text-foreground" data-testid="page-title">
                      Plan produkcji
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      Planowanie wielu przepisów i obliczanie zapotrzebowania na surowce
                    </p>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Plan produkcji</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Funkcjonalność będzie dostępna wkrótce. Tutaj będziesz mógł planować wiele przepisów jednocześnie i obliczać łączne zapotrzebowanie na surowce.
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}