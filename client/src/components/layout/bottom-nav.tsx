import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ChartLine, BookOpen, Sprout, ClipboardList, Sparkles } from "lucide-react";

const tabs = [
  { name: "Dashboard", href: "/", icon: ChartLine },
  { name: "Przepisy", href: "/recipes", icon: BookOpen },
  { name: "Składniki", href: "/ingredients", icon: Sprout },
  { name: "Plan", href: "/production-plan", icon: ClipboardList },
  { name: "AI", href: "/ai-chat", icon: Sparkles },
];

export default function BottomNav() {
  const [location] = useLocation();

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
                "flex-1 flex flex-col items-center justify-center py-2 px-1 text-xs font-medium transition-colors min-h-[56px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <tab.icon
                size={20}
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
