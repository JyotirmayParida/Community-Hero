'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, Shield, Award, Map, PenSquare, BarChart3, HelpCircle } from 'lucide-react';

export default function Header() {
  const { user, profile, signInWithGoogle, logout, loading } = useAuth();
  const pathname = usePathname();
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setFormattedDate(
        new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const navItems = [
    { name: 'Report Issue', href: '/report', icon: PenSquare },
    { name: 'Public Map', href: '/map', icon: Map },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  ];

  return (
    <header className="border-b border-[#1C1A17] bg-[#FAF9F6] text-[#1C1A17] font-sans">
      {/* Newspaper Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 border-b border-[#1C1A17]/10 flex justify-between items-center text-xs tracking-widest uppercase font-mono">
        <div className="text-[10px] text-stone-500 lowercase">v1.0</div>
        <div className="hidden sm:block text-center font-serif italic text-stone-500">
          &ldquo;Spot it. Report it. Get it fixed.&rdquo;
        </div>
        <div>{formattedDate}</div>
      </div>

      {/* Main Masthead */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <Link href="/" className="group flex flex-col items-center md:items-start">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#1C1A17] hover:opacity-90 transition-opacity">
            COMMUNITY HERO
          </h1>
          <span className="text-xs sm:text-sm font-serif italic tracking-wider text-stone-600 mt-1">
            You see it. You can fix it.
          </span>
        </Link>

        {/* Auth / Profile Area */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-8 h-8 rounded-full border border-stone-300 border-t-stone-800 animate-spin" />
          ) : user ? (
            <div className="flex items-center gap-3 bg-[#FAF9F6] border border-[#1C1A17] p-2 rounded-sm shadow-[2px_2px_0px_0px_#1C1A17]">
              {profile && (
                <div className="flex items-center gap-2 border-r border-[#1C1A17]/10 pr-3 mr-1 text-xs">
                  <div className="flex items-center gap-1 font-mono text-stone-700">
                    <Award className="w-3.5 h-3.5 text-stone-800" />
                    <span>{profile.points} pts</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono uppercase bg-[#1C1A17] text-[#FAF9F6] px-1.5 py-0.5 rounded-[2px] text-[10px]">
                    <Shield className="w-3 h-3" />
                    <span>{profile.role}</span>
                  </div>
                </div>
              )}
              <div className="text-right">
                <div className="text-xs font-serif font-bold text-[#1C1A17] leading-tight">
                  {user.displayName}
                </div>
                <div className="text-[10px] font-mono text-stone-500 lowercase leading-tight">
                  {user.email}
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1 text-stone-500 hover:text-[#1C1A17] hover:bg-stone-100 rounded-full transition-all"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="px-4 py-2 font-serif text-sm border border-[#1C1A17] bg-[#1C1A17] text-[#FAF9F6] rounded-sm hover:bg-[#1C1A17]/90 active:translate-y-px transition-all shadow-[3px_3px_0px_0px_#D6D3D1]"
            >
              Google Sign-In
            </button>
          )}
        </div>
      </div>

      {/* Editorial Navigation Bar */}
      <div className="border-t border-b border-[#1C1A17] bg-[#F4F3EF]">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center sm:justify-start items-center gap-6 py-2.5 overflow-x-auto scrollbar-none">
          <Link
            href="/"
            className={`text-xs uppercase tracking-widest font-mono border-b-2 pb-0.5 transition-all ${
              pathname === '/'
                ? 'border-[#1C1A17] text-[#1C1A17] font-bold'
                : 'border-transparent text-stone-600 hover:text-[#1C1A17]'
            }`}
          >
            Home
          </Link>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`text-xs uppercase tracking-widest font-mono border-b-2 pb-0.5 transition-all flex items-center gap-1.5 ${
                  active
                    ? 'border-[#1C1A17] text-[#1C1A17] font-bold'
                    : 'border-transparent text-stone-600 hover:text-[#1C1A17]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
