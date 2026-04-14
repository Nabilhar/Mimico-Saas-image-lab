import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Harbourline Studio
          </span>
          <span className="hidden text-sm text-slate-500 sm:inline">Mimico · Toronto</span>
        </Link>
        
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Show when="signed-in">
              <Link href="/" className="transition hover:text-cyan-800">
                Home
              </Link>
          
              <Link href="/profile" className="transition hover:text-cyan-800">
                Business Profile
              </Link>
              <Link href="/dashboard" className="transition hover:text-cyan-800">
                Dashboard
              </Link>
          </Show>
        </nav>

          {/* Logic for the User Avatar / Sign In button */}
          {/* --- CASE 1: USER IS LOGGED OUT --- */}
            <Show when="signed-out">
              <div className="flex items-center gap-4">
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-slate-600 hover:text-cyan-800">
                    Log In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="rounded-lg bg-cyan-800 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-900">
                    Get Started
                  </button>
                </SignUpButton>
              </div>
            </Show>

            {/* --- CASE 2: USER IS LOGGED IN --- */}
            <Show when="signed-in">
              <div className="flex items-center gap-4">
                <UserButton />
              </div>
            </Show>
      </div>
    </header>
  );
}