import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';

export function AuthCenteredShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 overflow-hidden">
      {/* Aurora blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/4 blur-3xl" />
      </div>

      {/* Brand mark */}
      <div className="absolute top-6 left-6 flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg overflow-hidden">
          <Image src="/logo2.png" width={32} height={32} alt="Project Tracker" />
        </div>
        <div className="leading-none">
          <p className="text-sm font-semibold font-heading tracking-[-0.01em]">Project Tracker</p>
          <p className="text-[10px] uppercase tracking-[0.10em] text-muted-foreground font-mono">PMBOK 8</p>
        </div>
      </div>

      {/* Theme toggle */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
