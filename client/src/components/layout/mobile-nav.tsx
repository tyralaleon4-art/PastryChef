import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  ChartLine,
  BookOpen,
  Sprout,
  Calculator,
  Warehouse,
  ChartBar,
  Factory,
  ClipboardList,
  Sparkles,
  Shield,
  LogOut,
  Settings,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: ChartLine },
  { name: "Przepisy", href: "/recipes", icon: BookOpen },
  { name: "Składniki", href: "/ingredients", icon: Sprout },
  { name: "Kalkulator", href: "/calculator", icon: Calculator },
  { name: "Produkcja", href: "/production", icon: Factory },
  { name: "Plan produkcji", href: "/production-plan", icon: ClipboardList },
  { name: "Magazyn", href: "/inventory", icon: Warehouse },
  { name: "Raporty", href: "/reports", icon: ChartBar },
  { name: "AI Asystent", href: "/ai-chat", icon: Sparkles },
];

export default function MobileNav() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();

  const initials = user?.displayName
    ? user.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() || "?";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" data-testid="mobile-menu-trigger">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Otwórz menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col" data-testid="mobile-nav">
        {/* Header */}
        <div className="p-5 border-b border-border flex-shrink-0">
          <h1 className="text-xl font-bold text-primary flex items-center" data-testid="mobile-app-title">
            <Utensils className="mr-2" size={20} />
            PastryPro
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">System zarządzania recepturami</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <li key={item.name}>
                  <SheetClose asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors w-full",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                      data-testid={`mobile-nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                      {item.name}
                    </Link>
                  </SheetClose>
                </li>
              );
            })}

            {isAdmin && (
              <li>
                <SheetClose asChild>
                  <Link
                    href="/admin"
                    className={cn(
                      "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors w-full",
                      location === "/admin"
                        ? "bg-primary text-primary-foreground"
                        : "text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                    )}
                    data-testid="mobile-nav-admin"
                  >
                    <Shield className="w-4 h-4 mr-3 flex-shrink-0" />
                    Użytkownicy
                  </Link>
                </SheetClose>
              </li>
            )}
          </ul>
        </nav>

        {/* User section at bottom */}
        {user && (
          <div className="p-3 border-t border-border flex-shrink-0">
            <SheetClose asChild>
              <Link href="/settings">
                <div className={cn(
                  "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors mb-1",
                  location === "/settings" ? "bg-primary/10" : "hover:bg-accent"
                )}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.displayName || user.username}</p>
                    <p className="text-xs text-muted-foreground">{isAdmin ? "Administrator" : "Pracownik"}</p>
                  </div>
                  <Settings size={14} className="text-muted-foreground flex-shrink-0" />
                </div>
              </Link>
            </SheetClose>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-destructive text-sm"
              onClick={() => { logout(); setOpen(false); }}
            >
              <LogOut size={15} className="mr-2" />
              Wyloguj się
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
