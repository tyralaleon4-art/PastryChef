import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ChartLine, BookOpen, Sprout, ClipboardList, Sparkles, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const baseTabs = [
  { name: "Pulpit", href: "/", icon: ChartLine },
  { name: "Przepisy", href: "/recipes", icon: BookOpen },
  { name: "Składniki", href: "/ingredients", icon: Sprout },
  { name: "Plan", href: "/production-plan", icon: ClipboardList },
  { name: "AI", href: "/ai-chat", icon: Sparkles },
];

const adminTab = { name: "Admin", href: "/admin", icon: Shield };

export default function BottomNav() {
  const [location] = useLocation();
  const { isAdmin } = useAuth();

  const tabs = isAdmin ? [...baseTabs, adminTab] : baseTabs;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb">
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = location === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 px-0.5 font-medium transition-colors min-h-[56px]",
                tabs.length > 5 ? "text-[10px]" : "text-xs",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <tab.icon
                size={isAdmin ? 18 : 20}
                className={cn(
                  "mb-0.5",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span className="leading-tight text-center">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
