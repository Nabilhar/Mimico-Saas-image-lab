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
    <>
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
      </header>

      {/* Overlay - darkens background when menu is open */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Right-Side Panel Menu */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel Header with Logo and Close Button */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Image 
              src="/icon_stacked_logo.png" 
              alt="Shoreline Studio" 
              width={100} 
              height={25}
              className="h-10 w-auto"
            />
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 text-slate-600 hover:text-cyan-800 transition rounded-lg hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-6 space-y-1">
          <Link 
            href="/#how-it-works" 
            className="block py-3 px-4 text-base font-medium text-slate-700 hover:text-cyan-800 hover:bg-slate-50 rounded-lg transition"
            onClick={() => setIsMenuOpen(false)}
          >
            Features
          </Link>
          <Link 
            href="/#pricing" 
            className="block py-3 px-4 text-base font-medium text-slate-700 hover:text-cyan-800 hover:bg-slate-50 rounded-lg transition"
            onClick={() => setIsMenuOpen(false)}
          >
            Pricing
          </Link>
          <Link 
            href="/post-types" 
            className="block py-3 px-4 text-base font-medium text-slate-700 hover:text-cyan-800 hover:bg-slate-50 rounded-lg transition"
            onClick={() => setIsMenuOpen(false)}
          >
            Post Types
          </Link>
          <Link 
            href="/contact" 
            className="block py-3 px-4 text-base font-medium text-slate-700 hover:text-cyan-800 hover:bg-slate-50 rounded-lg transition"
            onClick={() => setIsMenuOpen(false)}
          >
            Contact
          </Link>

          {/* Signed-in links */}
          <Show when="signed-in">
            <div className="border-t border-slate-200 my-4 pt-4"></div>
            <Link 
              href="/" 
              className="block py-3 px-4 text-base font-medium text-slate-700 hover:text-cyan-800 hover:bg-slate-50 rounded-lg transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/dashboard" 
              className="block py-3 px-4 text-base font-medium text-slate-700 hover:text-cyan-800 hover:bg-slate-50 rounded-lg transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              href="/profile" 
              className="block py-3 px-4 text-base font-medium text-slate-700 hover:text-cyan-800 hover:bg-slate-50 rounded-lg transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Business Profile
            </Link>
          </Show>
        </nav>
      </div>
    </>
  );
}