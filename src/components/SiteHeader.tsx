// components/SiteHeader.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function SiteHeader() {
  const [isProductOpen, setIsProductOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image 
            src="/icon_stacked_logo.png" 
            alt="Shoreline Studio" 
            width={160} 
            height={40}
            className="h-20 w-auto"
          />
          <span className="hidden text-sm text-slate-500 sm:inline ml-2">Toronto, ON</span>
        </Link>

        <div className="flex items-center gap-6"> 

          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-600">
            
            {/* Product Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setIsProductOpen(true)}
              onMouseLeave={() => setIsProductOpen(false)}
            >
              <button 
                className="flex items-center gap-1 transition hover:text-cyan-800"
                onClick={() => setIsProductOpen(!isProductOpen)}
              >
                Product
                <ChevronDown className={`w-4 h-4 transition-transform ${isProductOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isProductOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                  <Link 
                    href="/#how-it-works" 
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-cyan-800 transition"
                    onClick={() => setIsProductOpen(false)}
                  >
                    Features
                  </Link>
                  <Link 
                    href="/#pricing" 
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-cyan-800 transition"
                    onClick={() => setIsProductOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Show when="signed-in">
                    <div className="border-t border-slate-200 my-2"></div>
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-cyan-800 transition"
                      onClick={() => setIsProductOpen(false)}
                    >
                      Business Profile
                    </Link>
                    <Link 
                      href="/dashboard" 
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-cyan-800 transition"
                      onClick={() => setIsProductOpen(false)}
                    >
                      Dashboard
                    </Link>
                  </Show>
                </div>
              )}
            </div>

            {/* Home Link - Only show when signed in */}
            <Show when="signed-in">
              <Link href="/" className="transition hover:text-cyan-800">
                Home
              </Link>
            </Show>
          </nav>

          {/* Contact Button */}
          <Link href="/contact" className="text-sm font-medium text-slate-600 hover:text-cyan-800 transition">
            Contact
          </Link>

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
      </div>
    </header>
  );
}