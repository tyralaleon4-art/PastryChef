import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border p-6" data-testid="page-header">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground" data-testid="page-title">{title}</h2>
          {subtitle && (
            <p className="text-muted-foreground mt-1" data-testid="page-subtitle">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {action}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold" data-testid="user-avatar">
              <span>JD</span>
            </div>
            <span className="text-sm font-medium" data-testid="user-name">John Doe</span>
          </div>
        </div>
      </div>
    </header>
  );
}
