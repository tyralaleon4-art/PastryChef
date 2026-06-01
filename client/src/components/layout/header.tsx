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
    <header className="bg-white border-b border-border flex-shrink-0 shadow-sm" data-testid="page-header">
      {/* Gold accent line at very top */}
      <div className="h-0.5 bg-gradient-to-r from-secondary/40 via-secondary to-secondary/40" />
      <div className="px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <MobileNav />
          <div className="ml-3 md:ml-0">
            <h2
              className="text-xl md:text-2xl font-bold text-foreground tracking-tight leading-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
              data-testid="page-title"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5" data-testid="page-subtitle">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {action}
          <div className="hidden sm:flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(25,18%,20%), hsl(25,18%,14%))' }}
              data-testid="user-avatar"
            >
              {initials}
            </div>
            <span className="text-sm font-medium text-foreground/80" data-testid="user-name">{displayName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
