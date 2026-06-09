import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'Public project portfolio',
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-foreground/80 hover:text-foreground transition-colors">
            ← Back to App
          </Link>
          <span className="text-xs text-muted-foreground font-mono">PMBOK 8 · Project Portfolio</span>
        </div>
      </nav>
      {children}
    </div>
  );
}
