import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            Harbourline Studio
          </span>
          <span className="hidden text-sm text-slate-500 sm:inline">Mimico · Toronto</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/" className="transition hover:text-cyan-800">
            Home
          </Link>
          <Link href="/dashboard" className="transition hover:text-cyan-800">
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
