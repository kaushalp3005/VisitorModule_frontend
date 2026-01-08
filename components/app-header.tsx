import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AppHeaderProps {
  title?: string;
  rightContent?: React.ReactNode;
  className?: string;
}

export function AppHeader({ title = 'Smart Visitor Pass', rightContent, className }: AppHeaderProps) {
  return (
    <header className={`border-b border-border bg-background ${className || ''}`}>
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs sm:text-sm flex-shrink-0">
              S
            </div>
            <h1 className="text-base sm:text-lg md:text-xl font-semibold text-foreground truncate">{title}</h1>
          </Link>
          {rightContent && <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">{rightContent}</div>}
        </div>
      </div>
    </header>
  );
}
