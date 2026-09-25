import { Outlet, Link } from 'react-router-dom';

export function AuthCenteredLayout() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-cream font-body text-ink flex flex-col justify-between p-4 sm:p-6">
      <header className="w-full max-w-[440px] mx-auto py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-white p-1 flex items-center justify-center border border-border/80 shadow-2xs group-hover:scale-105 transition-transform">
            <img
              src="/hacsa-logo.png"
              alt="HACSA Foundation Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <span className="font-heading font-bold text-navy text-sm block leading-tight">
              HACSA Sankofa
            </span>
            <span className="text-[10px] text-gray block">Insights Portal</span>
          </div>
        </Link>
      </header>

      <main className="w-full max-w-[440px] mx-auto my-auto py-6">
        <Outlet />
      </main>

      <footer className="w-full max-w-[440px] mx-auto py-4 text-center text-xs text-gray">
        <p>© {new Date().getFullYear()} Heritage & Cultural Society of Africa</p>
      </footer>
    </div>
  );
}
