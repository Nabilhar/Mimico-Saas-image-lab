import Link from "next/link";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
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

          {/* Logic for the User Avatar / Sign In button */}
          <div className="flex items-center border-l border-slate-200 pl-6">
            <SignedIn>
              {/* This shows the user's avatar and the Sign Out menu */}
              <UserButton />
            </SignedIn>
            
            <SignedOut>
              {/* Fallback if they somehow reach the header while logged out */}
              <SignInButton mode="modal">
                <button className="text-cyan-800 hover:text-cyan-900">Sign In</button>
              </SignInButton>
            </SignedOut>
          </div>
        </nav>
      </div>
    </header>
  );
}