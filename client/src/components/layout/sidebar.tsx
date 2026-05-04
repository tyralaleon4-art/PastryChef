import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  ChartLine, 
  BookOpen, 
  Sprout, 
  Calculator, 
  Warehouse, 
  DollarSign, 
  ChartBar,
  Utensils,
  Factory,
  ClipboardList,
  Sparkles,
  Shield,
  LogOut,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navigation = [
  { name: "Dashboard", href: "/", icon: ChartLine },
  { name: "Recipes", href: "/recipes", icon: BookOpen },
  { name: "Ingredients", href: "/ingredients", icon: Sprout },
  { name: "Calculator", href: "/calculator", icon: Calculator },
  { name: "Production", href: "/production", icon: Factory },
  { name: "Plan produkcji", href: "/production-plan", icon: ClipboardList },
  { name: "Inventory", href: "/inventory", icon: Warehouse },
  { name: "Reports", href: "/reports", icon: ChartBar },
  { name: "AI Assistant", href: "/ai-chat", icon: Sparkles },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, isAdmin, logout } = useAuth();

  const initials = user?.displayName
    ? user.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() || "?";

  return (
    <aside className="hidden md:flex flex-col sidebar-nav bg-card border-r border-border w-64 flex-shrink-0 overflow-y-auto" data-testid="sidebar">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary flex items-center" data-testid="app-title">
          <Utensils className="mr-3" size={24} />
          PastryPro
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Professional Recipe Management</p>
      </div>
      
      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link href={item.href} className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )} data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              </li>
            );
          })}
          {isAdmin && (
            <li>
              <Link href="/admin" className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                location === "/admin"
                  ? "bg-primary text-primary-foreground"
                  : "text-amber-600 hover:bg-amber-50 hover:text-amber-700"
              )} data-testid="nav-admin">
                <Shield className="w-5 h-5 mr-3" />
                User Management
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* User info at bottom */}
      {user && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.displayName || user.username}</p>
              <p className="text-xs text-muted-foreground truncate">
                {isAdmin ? "Admin" : "Employee"} · @{user.username}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={logout}
          >
            <LogOut size={16} className="mr-2" />
            Sign out
          </Button>
        </div>
      )}
    </aside>
  );
}
