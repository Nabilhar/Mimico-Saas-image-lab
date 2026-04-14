"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UserCircle, LayoutDashboard } from "lucide-react"; // Or your preferred icon set

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[400px]">
      <nav className="flex items-center justify-around bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
        <Link href="/" className={`flex flex-col items-center gap-1 ${pathname === '/' ? 'text-cyan-400' : 'text-slate-400'}`}>
          <Home size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
        </Link>

        <Link href="/profile" className={`flex flex-col items-center gap-1 ${pathname === '/profile' ? 'text-cyan-400' : 'text-slate-400'}`}>
          <UserCircle size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Business profile</span>
        </Link>

        <Link href="/dashboard" className={`flex flex-col items-center gap-1 ${pathname === '/dashboard' ? 'text-cyan-400' : 'text-slate-400'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Studio</span>
        </Link>
      </nav>
    </div>
  );
}