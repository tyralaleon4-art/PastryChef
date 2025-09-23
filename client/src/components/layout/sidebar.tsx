import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
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
  ClipboardList
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: ChartLine },
  { name: "Recipes", href: "/recipes", icon: BookOpen },
  { name: "Ingredients", href: "/ingredients", icon: Sprout },
  { name: "Calculator", href: "/calculator", icon: Calculator },
  { name: "Production", href: "/production", icon: Factory },
  { name: "Plan produkcji", href: "/production-plan", icon: ClipboardList },
  { name: "Inventory", href: "/inventory", icon: Warehouse },
  { name: "Cost Analysis", href: "/costing", icon: DollarSign },
  { name: "Reports", href: "/reports", icon: ChartBar },
];

const categories = [
  { name: "Cakes", href: "/recipes?category=cakes" },
  { name: "Pastries", href: "/recipes?category=pastries" },
  { name: "Breads", href: "/recipes?category=breads" },
  { name: "Desserts", href: "/recipes?category=desserts" },
  { name: "Cookies", href: "/recipes?category=cookies" },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="hidden md:flex flex-col sidebar-nav bg-card border-r border-border w-64 flex-shrink-0 overflow-y-auto" data-testid="sidebar">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary flex items-center" data-testid="app-title">
          <Utensils className="mr-3" size={24} />
          PastryPro
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Professional Recipe Management</p>
      </div>
      
      <nav className="p-4">
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
        </ul>
        
        <div className="mt-8 pt-4 border-t border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Categories
          </h3>
          <ul className="space-y-1">
            {categories.map((category) => (
              <li key={category.name}>
                <Link href={category.href} className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid={`category-${category.name.toLowerCase()}`}>
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
