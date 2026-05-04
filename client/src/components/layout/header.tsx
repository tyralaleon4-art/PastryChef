import { useAuth } from "@/hooks/use-auth";
import MobileNav from "./mobile-nav";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function Header({ title, subtitle, action }: HeaderProps) {
  const { user } = useAuth();

  const initials = user?.displayName
    ? user.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() || "?";

  const displayName = user?.displayName || user?.username || "";

  return (
    <header className="bg-card border-b border-border p-6 flex-shrink-0" data-testid="page-header">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <MobileNav />
          <div className="ml-4 md:ml-0">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="page-title">{title}</h2>
            {subtitle && (
              <p className="text-muted-foreground mt-1" data-testid="page-subtitle">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {action}
          <div className="hidden sm:flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm" data-testid="user-avatar">
              <span>{initials}</span>
            </div>
            <span className="text-sm font-medium" data-testid="user-name">{displayName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
