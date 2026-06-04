"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Menu, X, FileText, LayoutDashboard, ShieldCheck } from "lucide-react";
import WalletButton from "./WalletButton";
import { useWallet } from "./WalletProvider";

export default function Navbar() {
  const pathname = usePathname();
  const { isConnected } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { name: "Verify", href: "/verify/locked-demo", icon: ShieldCheck },
    { name: "Publish", href: "/publish", icon: FileText },
    ...(isConnected ? [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] : []),
  ];

  return (
    <nav className="sticky top-0 z-40 bg-background-primary/80 backdrop-blur-md border-b border-white/5 py-4 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-1.5 bg-accent-primary/10 rounded-lg text-accent-primary group-hover:bg-accent-primary/20 transition-all duration-300">
            <Lock size={20} className="stroke-[2.5]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-accent-primary transition-colors">
            Dead<span className="text-accent-primary">Drop</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-accent-primary ${
                isActive(link.href) ? "text-accent-primary" : "text-text-secondary"
              }`}
            >
              {link.name === "Verify" ? "Verify a Document" : link.name}
            </Link>
          ))}
          <div className="h-4 w-px bg-white/10"></div>
          <WalletButton />
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background-secondary border-b border-white/10 py-6 px-4 space-y-4 shadow-2xl animate-fadeIn">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 py-2 text-base font-medium border-b border-white/5 pb-2 transition-colors ${
                    isActive(link.href) ? "text-accent-primary" : "text-text-secondary"
                  }`}
                >
                  <Icon size={18} />
                  <span>{link.name === "Verify" ? "Verify a Document" : link.name}</span>
                </Link>
              );
            })}
            
            <div className="pt-2 flex justify-center">
              <WalletButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
