import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  ChartLine,
  BookOpen,
  Sprout,
  Calculator,
  Warehouse,
  ChartBar,
  ClipboardList,
  Sparkles,
  Shield,
  LogOut,
  Settings,
} from "lucide-react";

const navigation = [
  { name: "Pulpit", href: "/", icon: ChartLine },
  { name: "Przepisy", href: "/recipes", icon: BookOpen },
  { name: "Składniki", href: "/ingredients", icon: Sprout },
  { name: "Kalkulator", href: "/calculator", icon: Calculator },
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
      <SheetContent side="left" className="w-72 p-0 flex flex-col bg-sidebar border-sidebar-border" data-testid="mobile-nav">
        <div className="p-5 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-3" data-testid="mobile-app-title">
            <img src="/logo-ads.png" alt="Art de Sucre" className="w-9 h-9 object-contain rounded-lg bg-sidebar-accent p-0.5" />
            <div>
              <p className="ads-logo-text text-sm font-bold text-sidebar-foreground tracking-widest uppercase leading-tight">Art de Sucre</p>
              <p className="text-[10px] text-sidebar-primary tracking-wider font-medium">by Leon Tyrała</p>
            </div>
          </div>
        </div>

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
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-primary/80 hover:bg-sidebar-accent hover:text-sidebar-primary"
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

        {user && (
          <div className="p-3 border-t border-sidebar-border flex-shrink-0">
            <SheetClose asChild>
              <Link href="/settings">
                <div className={cn(
                  "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors mb-1",
                  location === "/settings" ? "bg-sidebar-primary/20" : "hover:bg-sidebar-accent"
                )}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-sidebar-foreground">{user.displayName || user.username}</p>
                    <p className="text-xs text-sidebar-foreground/50">{isAdmin ? "Administrator" : "Pracownik"}</p>
                  </div>
                  <Settings size={14} className="text-sidebar-foreground/40 flex-shrink-0" />
                </div>
              </Link>
            </SheetClose>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground/50 hover:text-destructive hover:bg-sidebar-accent text-sm"
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
