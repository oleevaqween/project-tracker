export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 overflow-hidden">
      {/* Subtle aurora blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/4 blur-3xl" />
      </div>

      {/* Brand mark in corner */}
      <div className="absolute top-6 left-6 flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z" fill="currentColor" opacity=".8" />
          </svg>
        </div>
        <div className="leading-none">
          <p className="text-sm font-semibold font-heading tracking-[-0.01em]">Project Tracker</p>
          <p className="text-[10px] uppercase tracking-[0.10em] text-muted-foreground font-mono">PMBOK 8</p>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
