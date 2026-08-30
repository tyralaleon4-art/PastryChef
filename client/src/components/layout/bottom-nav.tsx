import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ChartLine, BookOpen, Sprout, ClipboardList, Sparkles, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/i18n";

export default function BottomNav() {
  const [location] = useLocation();
  const { isAdmin } = useAuth();
  const { t } = useI18n();
  const baseTabs = [
    { name: t("nav.dashboard"), href: "/", icon: ChartLine }, { name: t("nav.recipes"), href: "/recipes", icon: BookOpen },
    { name: t("nav.ingredients"), href: "/ingredients", icon: Sprout }, { name: t("nav.productionPlan"), href: "/production-plan", icon: ClipboardList },
    { name: t("nav.ai"), href: "/ai-chat", icon: Sparkles },
  ];
  const tabs = isAdmin ? [...baseTabs, { name: t("nav.admin"), href: "/admin", icon: Shield }] : baseTabs;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t-2 border-sidebar-border safe-area-pb" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = location === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 px-1 transition-all min-h-[60px] relative",
                tabs.length > 5 ? "text-[9px]" : "text-[11px]",
              )}
            >
              {/* Active background pill */}
              {isActive && (
                <span className="absolute inset-x-1 top-1.5 bottom-1.5 rounded-xl bg-sidebar-primary/15" />
              )}
              <tab.icon
                size={isAdmin ? 19 : 21}
                className={cn(
                  "mb-1 relative z-10 transition-colors",
                  isActive ? "text-sidebar-primary" : "text-sidebar-foreground/40"
                )}
              />
              <span className={cn(
                "leading-tight text-center relative z-10 font-medium tracking-tight",
                isActive ? "text-sidebar-primary" : "text-sidebar-foreground/40"
              )}>
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
