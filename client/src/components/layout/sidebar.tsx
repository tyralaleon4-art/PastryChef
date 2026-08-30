import { Link, useLocation } from "wouter";
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
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useI18n } from "@/i18n";
import { BRANDING } from "@/config/branding";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const { t } = useI18n();
  const navigation = [
    { name: t("nav.dashboard"), href: "/", icon: ChartLine }, { name: t("nav.recipes"), href: "/recipes", icon: BookOpen },
    { name: t("nav.ingredients"), href: "/ingredients", icon: Sprout }, { name: t("nav.calculator"), href: "/calculator", icon: Calculator },
    { name: t("nav.productionPlan"), href: "/production-plan", icon: ClipboardList }, { name: t("nav.inventory"), href: "/inventory", icon: Warehouse },
    { name: t("nav.reports"), href: "/reports", icon: ChartBar }, { name: t("nav.ai"), href: "/ai-chat", icon: Sparkles },
  ];

  const initials = user?.displayName
    ? user.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() || "?";

  return (
    <aside className="hidden md:flex flex-col sidebar-nav bg-sidebar border-r border-sidebar-border w-64 flex-shrink-0 overflow-y-auto" data-testid="sidebar">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3" data-testid="app-title">
          <img src="/logo-ads.png" alt={BRANDING.productName} className="w-10 h-10 object-contain rounded-lg bg-sidebar-accent p-0.5" />
          <div>
            <p className="ads-logo-text text-sm font-bold text-sidebar-foreground tracking-widest uppercase leading-tight">{BRANDING.productName}</p>
            <p className="text-[10px] text-sidebar-primary tracking-wider font-medium">by {BRANDING.creatorName}</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 flex-1">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link href={item.href} className={cn(
                  "flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )} data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                  {item.name}
                </Link>
              </li>
            );
          })}
          {isAdmin && (
            <li>
              <Link href="/admin" className={cn(
                "flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors",
                location === "/admin"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-primary/80 hover:bg-sidebar-accent hover:text-sidebar-primary"
              )} data-testid="nav-admin">
                <Shield className="w-4 h-4 mr-3" />
                {t("nav.users")}
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {user && (
        <div className="p-4 border-t border-sidebar-border">
          <Link href="/settings">
            <div className={cn(
              "flex items-center gap-3 mb-2 p-2 rounded-lg cursor-pointer transition-colors",
              location === "/settings"
                ? "bg-sidebar-primary/20"
                : "hover:bg-sidebar-accent"
            )}>
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-sidebar-foreground">{user.displayName || user.username}</p>
                <p className="text-xs text-sidebar-foreground/50 truncate">
                  {isAdmin ? t("role.admin") : t("role.employee")}
                </p>
              </div>
              <Settings size={14} className="text-sidebar-foreground/40 flex-shrink-0" />
            </div>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/50 hover:text-destructive hover:bg-sidebar-accent"
            onClick={logout}
          >
            <LogOut size={15} className="mr-2" />
            {t("auth.logout")}
          </Button>
        </div>
      )}
    </aside>
  );
}
