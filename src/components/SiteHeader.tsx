// components/SiteHeader.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function SiteHeader() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Close drawer when clicking a link
  const handleLinkClick = () => {
    setIsDrawerOpen(false);
  };

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

          {/* Right Side - Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/contact" className="text-sm font-medium text-slate-600 hover:text-cyan-800 transition">
              Contact
            </Link>

            <Show when="signed-out">
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
            </Show>

            <Show when="signed-in">
              <UserButton />
            </Show>

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 text-slate-600 hover:text-cyan-800 transition"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Right Side - Mobile */}
          <div className="flex md:hidden items-center gap-3">
            <Show when="signed-out">
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
            </Show>

            <Show when="signed-in">
              <UserButton />
            </Show>

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 text-slate-600 hover:text-cyan-800 transition"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 transition-opacity duration-300"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Side Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
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
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 text-slate-600 hover:text-cyan-800 transition rounded-lg hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Drawer Content */}
          <nav className="flex-1 overflow-y-auto p-6">
            <div className="space-y-1">
              {/* Public Links */}
              <Link 
                href="/#how-it-works" 
                className="block px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-cyan-800 rounded-lg transition"
                onClick={handleLinkClick}
              >
                Features
              </Link>
              <Link 
                href="/#pricing" 
                className="block px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-cyan-800 rounded-lg transition"
                onClick={handleLinkClick}
              >
                Pricing
              </Link>
              <Link 
                href="/contact" 
                className="block px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-cyan-800 rounded-lg transition"
                onClick={handleLinkClick}
              >
                Contact
              </Link>

              {/* Signed-in Links */}
              <Show when="signed-in">
                <div className="border-t border-slate-200 my-4"></div>
                <Link 
                  href="/" 
                  className="block px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-cyan-800 rounded-lg transition"
                  onClick={handleLinkClick}
                >
                  Home
                </Link>
                <Link 
                  href="/dashboard" 
                  className="block px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-cyan-800 rounded-lg transition"
                  onClick={handleLinkClick}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/profile" 
                  className="block px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-cyan-800 rounded-lg transition"
                  onClick={handleLinkClick}
                >
                  Business Profile
                </Link>
              </Show>
            </div>
          </nav>

          {/* Drawer Footer - Auth Buttons (Only when logged out) */}
          <Show when="signed-out">
            <div className="p-6 border-t border-slate-200 space-y-3">
              <SignInButton mode="modal">
                <button 
                  className="w-full py-3 px-4 text-sm font-semibold text-slate-700 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition"
                  onClick={handleLinkClick}
                >
                  Log In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button 
                  className="w-full py-3 px-4 text-sm font-semibold text-white bg-cyan-800 rounded-lg hover:bg-cyan-900 transition shadow-lg"
                  onClick={handleLinkClick}
                >
                  Get Started
                </button>
              </SignUpButton>
            </div>
          </Show>
        </div>
      </div>
    </>
  );
}