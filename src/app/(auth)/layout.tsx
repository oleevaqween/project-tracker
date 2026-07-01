export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1">{children}</div>
      <footer className="py-4 text-center text-xs text-muted-foreground">
        <a
          href="https://github.com/oleevaqween"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
        >
          github.com/oleevaqween
        </a>
      </footer>
    </div>
  );
}
