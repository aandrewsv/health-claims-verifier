'use client';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const { theme, setTheme } = useTheme();
  return (
    <nav className="border-b dark:border-border">
      <div className="flex h-16 items-center px-4 dark:bg-background">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost">Research</Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="ghost">Leaderboard</Button>
          </Link>
        </div>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
