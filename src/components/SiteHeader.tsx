// components/SiteHeader.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image 
            src="/icon_stacked_logo.png" 
            alt="Shoreline Studio" 
            width={120} 
            height={30}
            className="h-12 w-auto sm:h-14"
          />
          <span className="hidden lg:inline text-sm text-slate-500 ml-2">Toronto, ON</span>
        </Link>

        {/* Right Side Navigation */}
        <div className="flex items-center gap-4 sm:gap-6">
          
          {/* Contact Link */}
          <Link href="/contact" className="text-sm font-medium text-slate-600 hover:text-cyan-800 transition">
            Contact
          </Link>

          {/* Auth Buttons - Desktop Only */}
          <Show when="signed-out">
            <div className="hidden sm:flex items-center gap-3">
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

          {/* User Button - Desktop */}
          <Show when="signed-in">
            <div className="hidden sm:block">
              <UserButton />
            </div>
          </Show>

          {/* Auth Buttons - Mobile Only */}
          <Show when="signed-out">
            <div className="flex sm:hidden items-center gap-2">
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-slate-600 hover:text-cyan-800">
                  Log In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-lg bg-cyan-800 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-900">
                  Start
                </button>
              </SignUpButton>
            </div>
          </Show>

          {/* User Button - Mobile */}
          <Show when="signed-in">
            <div className="block sm:hidden">
              <UserButton />
            </div>
          </Show>

          {/* Menu Icon - Both Desktop and Mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-slate-600 hover:text-cyan-800 transition"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Dropdown Menu - Both Desktop and Mobile */}
      {isMenuOpen && (
        <div className="border-t border-slate-200 bg-white shadow-lg">
          <nav className="mx-auto max-w-6xl px-4 py-4 space-y-3 sm:px-6">
            <Link 
              href="/#how-it-works" 
              className="block py-2 text-sm font-medium text-slate-700 hover:text-cyan-800 transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="/#pricing" 
              className="block py-2 text-sm font-medium text-slate-700 hover:text-cyan-800 transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Show when="signed-in">
              <div className="border-t border-slate-200 my-2"></div>
              <Link 
                href="/" 
                className="block py-2 text-sm font-medium text-slate-700 hover:text-cyan-800 transition"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/profile" 
                className="block py-2 text-sm font-medium text-slate-700 hover:text-cyan-800 transition"
                onClick={() => setIsMenuOpen(false)}
              >
                Business Profile
              </Link>
              <Link 
                href="/dashboard" 
                className="block py-2 text-sm font-medium text-slate-700 hover:text-cyan-800 transition"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
            </Show>
          </nav>
        </div>
      )}
    </header>
  );
}