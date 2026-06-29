'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { SEVERITY_COLORS } from '@/lib/constants';
import { 
  PenSquare, 
  Map, 
  BarChart3, 
  Compass, 
  Award, 
  ShieldCheck, 
  Clock, 
  Activity 
} from 'lucide-react';

export default function Home() {
  const { user, profile, signInWithGoogle, loading } = useAuth();

  return (
    <div className="space-y-12">
      {/* Editorial Headline Section */}
      <section className="text-center max-w-3xl mx-auto space-y-4 py-8">
        <div className="inline-block border border-[#1C1A17] px-3 py-1 text-xs font-mono uppercase tracking-widest bg-[#FAF9F6] shadow-[2px_2px_0px_0px_#1C1A17]">
          Community Bulletin
        </div>
        <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
          Restoring Order to Our Shared Spaces
        </h2>
        <p className="font-serif text-lg sm:text-xl italic text-stone-600 max-w-2xl mx-auto">
          &ldquo;A unified, autonomous pipeline connecting civil reports directly to municipal action departments.&rdquo;
        </p>
      </section>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Platform Manifesto & Explanation */}
        <div className="lg:col-span-2 space-y-8 border-r border-[#1C1A17]/10 pr-0 lg:pr-8">
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-bold border-b border-[#1C1A17] pb-2 uppercase tracking-wide">
              The Sovereign System
            </h3>
            <p className="font-sans text-stone-800 leading-relaxed text-sm">
              Community Hero bridges the gap between civic vigilance and prompt governance. Using a 
              state-of-the-art multi-agent backend, every issue submitted by a citizen is immediately processed, 
              categorized, checked for spatial duplication, routed to correct municipal divisions, and monitored 
              for priority escalation.
            </p>
          </div>

          {/* Core Pipeline Demonstration */}
          <div className="bg-[#F4F3EF] border border-[#1C1A17] p-6 rounded-sm shadow-[3px_3px_0px_0px_#1C1A17]">
            <h4 className="font-serif text-lg font-bold uppercase tracking-wide mb-4 flex items-center gap-2 border-b border-stone-300 pb-2">
              <Activity className="w-5 h-5" />
              The Multi-Agent Lifecycle
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
              {[
                { step: '1', title: 'Submitted', desc: 'Intake validation & geolocation schema checks.' },
                { step: '2', title: 'Categorized', desc: 'Deduplication against active local reports.' },
                { step: '3', title: 'Routed', desc: 'Department mapping & SLA allocation.' },
                { step: '4', title: 'In Progress', desc: 'Municipal resolution and dispatch tracking.' },
                { step: '5', title: 'Resolved', desc: 'Verifier inspection & points reward.' }
              ].map((lifecycle, index) => (
                <div key={lifecycle.title} className="space-y-2 relative">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-[#1C1A17] text-[#FAF9F6] px-1.5 py-0.5 rounded-full font-bold">
                      {lifecycle.step}
                    </span>
                    <h5 className="font-serif font-bold text-sm">{lifecycle.title}</h5>
                  </div>
                  <p className="text-[11px] font-sans text-stone-600 leading-normal">
                    {lifecycle.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Precise Severity Color Keys */}
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-bold uppercase tracking-wide">
              Priority Classification Spectrum
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: 'LOW', color: SEVERITY_COLORS.LOW, desc: 'Within 72 Hours' },
                { name: 'MODERATE', color: SEVERITY_COLORS.MODERATE, desc: 'Within 48 Hours' },
                { name: 'HIGH', color: SEVERITY_COLORS.HIGH, desc: 'Within 24 Hours' },
                { name: 'SEVERE', color: SEVERITY_COLORS.SEVERE, desc: 'Immediate (8 Hrs)' }
              ].map((lvl) => (
                <div 
                  key={lvl.name} 
                  className="p-3 border border-[#1C1A17]/10 bg-[#FAF9F6] rounded-sm flex flex-col justify-between"
                  style={{ borderLeft: `4px solid ${lvl.color}` }}
                >
                  <span className="font-mono text-xs font-bold tracking-wider">{lvl.name}</span>
                  <span className="text-[11px] text-stone-500 font-sans mt-1">{lvl.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Console */}
        <div className="space-y-6">
          <div className="border border-[#1C1A17] p-6 bg-[#F4F3EF] rounded-sm shadow-[4px_4px_0px_0px_#1C1A17]">
            <h3 className="font-serif text-xl font-bold border-b border-[#1C1A17] pb-2 uppercase tracking-wide mb-4">
              Citizen Access Panel
            </h3>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-stone-400 border-t-stone-800 animate-spin" />
                <span className="text-xs font-mono tracking-wider text-stone-500 uppercase">Synchronizing...</span>
              </div>
            ) : user ? (
              <div className="space-y-6">
                <div className="bg-[#FAF9F6] border border-[#1C1A17]/20 p-4 rounded-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#1C1A17] text-[#FAF9F6] rounded-sm">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wider text-stone-500">Authenticated Citizen</div>
                      <div className="font-serif font-bold text-sm text-[#1C1A17]">{user.displayName}</div>
                    </div>
                  </div>
                  {profile && (
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#1C1A17]/10 font-mono text-xs">
                      <div className="bg-[#F4F3EF] p-2 rounded-sm border border-stone-200">
                        <span className="text-stone-500 block">POINT BALANCE</span>
                        <span className="text-sm font-bold text-[#1C1A17] flex items-center gap-1 mt-1">
                          <Award className="w-4 h-4 text-amber-600" />
                          {profile.points}
                        </span>
                      </div>
                      <div className="bg-[#F4F3EF] p-2 rounded-sm border border-stone-200">
                        <span className="text-stone-500 block">SECURITY ROLE</span>
                        <span className="text-sm font-bold text-[#1C1A17] block uppercase mt-1">
                          {profile.role}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Authenticated Actions */}
                <div className="space-y-3">
                  <Link 
                    href="/report"
                    className="flex items-center justify-between p-3 border border-[#1C1A17] bg-[#1C1A17] text-[#FAF9F6] rounded-sm hover:bg-[#1C1A17]/95 active:translate-y-px transition-all shadow-[3px_3px_0px_0px_#D6D3D1]"
                  >
                    <div className="flex items-center gap-2">
                      <PenSquare className="w-4 h-4" />
                      <span className="font-serif font-bold text-sm uppercase tracking-wide">Report New Issue</span>
                    </div>
                    <Compass className="w-4 h-4 text-stone-400" />
                  </Link>

                  <Link 
                    href="/map"
                    className="flex items-center justify-between p-3 border border-[#1C1A17] bg-[#FAF9F6] text-[#1C1A17] rounded-sm hover:bg-stone-100 active:translate-y-px transition-all shadow-[3px_3px_0px_0px_#1C1A17]"
                  >
                    <div className="flex items-center gap-2">
                      <Map className="w-4 h-4" />
                      <span className="font-serif font-bold text-sm uppercase tracking-wide">View Public Map</span>
                    </div>
                    <Compass className="w-4 h-4 text-stone-500" />
                  </Link>

                  <Link 
                    href="/dashboard"
                    className="flex items-center justify-between p-3 border border-[#1C1A17] bg-[#FAF9F6] text-[#1C1A17] rounded-sm hover:bg-stone-100 active:translate-y-px transition-all shadow-[3px_3px_0px_0px_#1C1A17]"
                  >
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span className="font-serif font-bold text-sm uppercase tracking-wide">Live Dashboard</span>
                    </div>
                    <Compass className="w-4 h-4 text-stone-500" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6 text-center py-6">
                <p className="text-xs text-stone-600 font-sans">
                  Sign in with your Google Account to access the issue reporting engine, view real-time incident reports, and participate in verifying municipal rectifications.
                </p>
                <button
                  onClick={signInWithGoogle}
                  className="w-full py-3 font-serif text-sm border border-[#1C1A17] bg-[#1C1A17] text-[#FAF9F6] rounded-sm hover:bg-[#1C1A17]/90 active:translate-y-px transition-all shadow-[4px_4px_0px_0px_#D6D3D1] uppercase tracking-wider font-bold"
                >
                  Join the Commonwealth
                </button>
              </div>
            )}
          </div>

          {/* Quick Statistics Block */}
          <div className="border border-stone-200 p-4 bg-[#FAF9F6] rounded-sm space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center text-stone-500 border-b border-stone-200 pb-1">
              <span>SYSTEM LOGS</span>
              <span className="flex items-center gap-1 text-[#10B981] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                ONLINE
              </span>
            </div>
            <div className="space-y-1.5 text-stone-600">
              <div className="flex justify-between">
                <span>Active Core Pipelines:</span>
                <span className="text-[#1C1A17] font-bold">4/4</span>
              </div>
              <div className="flex justify-between">
                <span>Verification Quorum:</span>
                <span className="text-[#1C1A17] font-bold">99.8%</span>
              </div>
              <div className="flex justify-between">
                <span>Avg SLA Resolution:</span>
                <span className="text-[#1C1A17] font-bold">24.2 Hrs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
