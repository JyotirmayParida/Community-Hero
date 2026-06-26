'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  BarChart3,
  Info,
  Clock,
  Calendar,
  Shield,
  Award,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  FileText,
  User,
  Users,
  Image as ImageIcon,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { Report } from '@/lib/types';
import { SEVERITY_COLORS } from '@/lib/constants';

export default function DashboardPage() {
  const { user, profile, signInWithGoogle, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [globalReports, setGlobalReports] = useState<Report[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'my-reports' | 'platform-overview'>('my-reports');

  const fetchData = React.useCallback(async () => {
    if (!user) return;
    // defer state change to prevent synchronous setState inside useEffect warnings
    await new Promise((resolve) => setTimeout(resolve, 0));
    setLoadingData(true);
    try {
      // Fetch both my reports specifically and all platform reports for context
      const [myRes, globalRes] = await Promise.all([
        fetch(`/api/reports?citizenId=${user.uid}`),
        fetch('/api/reports')
      ]);

      if (myRes.ok) {
        const myData = await myRes.json();
        setReports(myData || []);
      }

      if (globalRes.ok) {
        const globalData = await globalRes.json();
        setGlobalReports(globalData || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();
    }
  }, [user, fetchData]);

  if (authLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-2 bg-[#FAF9F6]">
        <div className="w-8 h-8 rounded-full border-2 border-stone-400 border-t-stone-800 animate-spin" />
        <span className="text-xs font-mono tracking-wider text-stone-500 uppercase">Synchronizing Live Logs...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 border border-[#1C1A17] p-8 bg-[#F4F3EF] text-center rounded-sm shadow-[4px_4px_0px_0px_#1C1A17]">
        <h3 className="font-serif text-2xl font-black uppercase tracking-wide mb-4">Access Denied</h3>
        <p className="text-sm text-stone-600 mb-6 font-serif italic">
          &ldquo;The state board metrics require a validated citizen profile.&rdquo;
        </p>
        <button
          onClick={signInWithGoogle}
          className="w-full py-3 font-serif text-sm border border-[#1C1A17] bg-[#1C1A17] text-[#FAF9F6] rounded-sm hover:bg-[#1C1A17]/90 active:translate-y-px transition-all shadow-[4px_4px_0px_0px_#D6D3D1] uppercase tracking-wider font-bold cursor-pointer"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  // Derived statistics
  const totalUserReports = reports.length;
  const highSeverityUserReports = reports.filter((r) => r.severity === 'HIGH' || r.severity === 'SEVERE').length;
  const resolvedUserReports = reports.filter((r) => r.status === 'resolved').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Title Plaque */}
      <div className="border-b border-[#1C1A17] pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-stone-600">
            <BarChart3 className="w-5 h-5 text-[#1C1A17]" />
            <span className="font-mono text-xs uppercase tracking-widest">Live Ledger</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-black uppercase tracking-tight">
            Municipal Status Board
          </h2>
        </div>
        <button
          onClick={fetchData}
          disabled={loadingData}
          className="px-4 py-2 font-mono text-xs border border-[#1C1A17] bg-[#FAF9F6] text-[#1C1A17] hover:bg-stone-100 rounded-sm active:translate-y-px transition-all shadow-[2px_2px_0px_0px_#1C1A17] flex items-center gap-1.5 uppercase cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Editorial Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-[#1C1A17] p-4 bg-[#FAF9F6] rounded-sm shadow-[3px_3px_0px_0px_#1C1A17] flex items-center justify-between">
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase text-stone-500 tracking-wider block">My Total Reports</span>
            <span className="font-serif text-3xl font-black">{totalUserReports}</span>
          </div>
          <div className="p-2.5 bg-stone-100 border border-stone-200 rounded-sm">
            <FileText className="w-5 h-5 text-stone-800" />
          </div>
        </div>

        <div className="border border-[#1C1A17] p-4 bg-[#FAF9F6] rounded-sm shadow-[3px_3px_0px_0px_#1C1A17] flex items-center justify-between">
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase text-stone-500 tracking-wider block">Honorary Points</span>
            <span className="font-serif text-3xl font-black text-amber-600">{profile?.points || 0}</span>
          </div>
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-sm">
            <Award className="w-5 h-5 text-amber-600" />
          </div>
        </div>

        <div className="border border-[#1C1A17] p-4 bg-[#FAF9F6] rounded-sm shadow-[3px_3px_0px_0px_#1C1A17] flex items-center justify-between">
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase text-stone-500 tracking-wider block">Critical Dispatches</span>
            <span className="font-serif text-3xl font-black text-rose-600">{highSeverityUserReports}</span>
          </div>
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
        </div>

        <div className="border border-[#1C1A17] p-4 bg-[#FAF9F6] rounded-sm shadow-[3px_3px_0px_0px_#1C1A17] flex items-center justify-between">
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase text-stone-500 tracking-wider block">Resolved Issues</span>
            <span className="font-serif text-3xl font-black text-emerald-600">{resolvedUserReports}</span>
          </div>
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#1C1A17] flex gap-2">
        <button
          onClick={() => setActiveTab('my-reports')}
          className={`px-4 py-2 font-mono text-xs uppercase tracking-wider border border-[#1C1A17] border-b-0 rounded-t-sm transition-all cursor-pointer ${
            activeTab === 'my-reports'
              ? 'bg-[#FAF9F6] font-bold text-[#1C1A17] translate-y-px z-10'
              : 'bg-stone-200/60 text-stone-500 hover:bg-stone-100 hover:text-stone-800'
          }`}
        >
          My Reports Timeline ({totalUserReports})
        </button>
        <button
          onClick={() => setActiveTab('platform-overview')}
          className={`px-4 py-2 font-mono text-xs uppercase tracking-wider border border-[#1C1A17] border-b-0 rounded-t-sm transition-all cursor-pointer ${
            activeTab === 'platform-overview'
              ? 'bg-[#FAF9F6] font-bold text-[#1C1A17] translate-y-px z-10'
              : 'bg-stone-200/60 text-stone-500 hover:bg-stone-100 hover:text-stone-800'
          }`}
        >
          Platform Overview
        </button>
      </div>

      {activeTab === 'my-reports' ? (
        <div className="space-y-6">
          {loadingData ? (
            <div className="border border-[#1C1A17] p-12 bg-[#FAF9F6] text-center rounded-sm">
              <div className="w-8 h-8 rounded-full border-2 border-stone-400 border-t-stone-800 animate-spin mx-auto mb-4" />
              <span className="text-xs font-mono tracking-wider text-stone-500 uppercase">Collating Personal Records...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="border border-[#1C1A17] p-12 bg-[#FAF9F6] text-center rounded-sm space-y-4">
              <p className="font-serif italic text-stone-600 text-lg">
                &ldquo;Your portfolio does not currently contain any logged municipal reports.&rdquo;
              </p>
              <p className="text-xs font-mono text-stone-500 uppercase max-w-md mx-auto">
                Once you file local hazards, trash piles, or public safety issues via the reporter, their live processing and auditing details will populate here.
              </p>
              <Link
                href="/report"
                className="inline-block px-5 py-2.5 font-serif text-xs uppercase tracking-wider bg-[#1C1A17] text-[#FAF9F6] hover:bg-[#1C1A17]/90 active:translate-y-px transition-all rounded-sm shadow-[3px_3px_0px_0px_#D6D3D1]"
              >
                Submit Your First Report
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {reports.map((report) => {
                const color = SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS] || '#10B981';
                const confirmCount = report.confirmations?.length || 0;

                return (
                  <div
                    key={report.id}
                    className="border border-[#1C1A17] bg-[#FAF9F6] rounded-sm p-6 shadow-[4px_4px_0px_0px_#1C1A17] space-y-6 transition-all hover:-translate-y-0.5 duration-200"
                  >
                    {/* Report Header Block */}
                    <div className="border-b border-[#1C1A17]/10 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-mono text-[10px] text-stone-500 uppercase tracking-widest">
                            ID: {report.id.substring(0, 8)}...
                          </span>
                          <span className="font-mono text-[10px] text-stone-400">•</span>
                          <span className="font-mono text-[10px] text-stone-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(report.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <h3 className="font-serif text-2xl font-black uppercase tracking-tight leading-tight">
                          {report.category}
                        </h3>
                      </div>

                      {/* Status and Severity Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="px-2.5 py-1 text-xs font-mono uppercase font-bold tracking-wider rounded-sm border"
                          style={{
                            backgroundColor: `${color}15`,
                            color: color,
                            borderColor: `${color}40`,
                          }}
                        >
                          Severity: {report.severity}
                        </span>
                        <span className="px-2.5 py-1 text-xs font-mono uppercase bg-stone-100 text-stone-800 border border-stone-200 rounded-sm">
                          {report.status}
                        </span>
                        {confirmCount > 0 && (
                          <span className="px-2.5 py-1 text-xs font-mono uppercase bg-stone-800 text-[#FAF9F6] border border-stone-800 rounded-sm">
                            ✓ {confirmCount} Confirmations
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Report Details Body */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Photo Container */}
                      <div className="lg:col-span-4 space-y-2">
                        <div className="border border-[#1C1A17] bg-stone-100 rounded-sm overflow-hidden aspect-video sm:aspect-[4/3] relative shadow-[2px_2px_0px_0px_#1C1A17]">
                          {report.mediaUrl ? (
                            <img
                              src={report.mediaUrl}
                              alt={report.category}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
                              <ImageIcon className="w-8 h-8 mb-1" />
                              <span className="text-xs font-mono uppercase">No image file</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-stone-500 uppercase">
                          <MapPin className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                          <span>
                            {report.geo?.lat?.toFixed(5)}, {report.geo?.lng?.toFixed(5)}
                          </span>
                        </div>
                      </div>

                      {/* Description & Metadata */}
                      <div className="lg:col-span-8 space-y-4">
                        {report.description && (
                          <div className="space-y-1">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 block">
                              Citizen Notes:
                            </span>
                            <p className="text-stone-800 font-serif italic text-sm leading-relaxed border-l-2 border-stone-300 pl-3">
                              &ldquo;{report.description}&rdquo;
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F4F3EF] p-4 border border-[#1C1A17]/10 rounded-sm font-mono text-xs">
                          <div>
                            <span className="text-stone-500 uppercase block text-[9px] tracking-wider">Assigned Department</span>
                            <span className="font-serif font-bold text-stone-800 uppercase text-sm">
                              {report.department || 'AWAITING DISPATCH'}
                            </span>
                          </div>
                          <div>
                            <span className="text-stone-500 uppercase block text-[9px] tracking-wider">SLA Urgency Level</span>
                            <span className="font-bold text-stone-800 uppercase">
                              {report.priority || 'EVALUATING'}
                            </span>
                          </div>
                        </div>

                        {/* Status History Timeline */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-1.5 border-b border-[#1C1A17]/10 pb-1.5">
                            <Clock className="w-3.5 h-3.5 text-stone-800" />
                            <span className="font-mono text-[10px] uppercase tracking-wider text-stone-800 font-bold">
                              Status Audit Timeline
                            </span>
                          </div>

                          <div className="relative pl-4 space-y-4 border-l border-[#1C1A17]/20">
                            {report.history && report.history.length > 0 ? (
                              report.history.map((log, index) => (
                                <div key={index} className="relative space-y-1">
                                  {/* Timeline Node dot */}
                                  <div className="absolute -left-[20.5px] top-1 w-2 h-2 rounded-full border border-stone-800 bg-[#FAF9F6]" />
                                  
                                  <div className="flex items-baseline justify-between gap-4">
                                    <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-stone-700">
                                      {log.status}
                                    </span>
                                    <span className="font-mono text-[9px] text-stone-400">
                                      {new Date(log.timestamp).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-stone-600 font-sans leading-relaxed">
                                    {log.note}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="relative">
                                <div className="absolute -left-[20.5px] top-1 w-2 h-2 rounded-full border border-stone-800 bg-[#FAF9F6]" />
                                <span className="font-mono text-[10px] text-stone-400 uppercase">No logs indexed yet.</span>
                              </div>
                            )}
                          </div>

                          <p className="font-mono text-[10px] text-stone-500 uppercase tracking-wide leading-relaxed pt-2 border-t border-[#1C1A17]/5">
                            Reports are reviewed and routed automatically &mdash; confirmations from neighbors help show how many people are affected by the same issue.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Platform Overview Tab Content */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            {/* Platform Metrics Card */}
            <div className="border border-[#1C1A17] p-6 bg-[#FAF9F6] rounded-sm shadow-[3px_3px_0px_0px_#1C1A17] space-y-4">
              <h3 className="font-serif text-xl font-bold uppercase tracking-tight border-b border-[#1C1A17]/10 pb-2">
                Municipal Records
              </h3>
              
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500 uppercase">Platform Wide Reports</span>
                  <span className="font-bold text-stone-800">{globalReports.length}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500 uppercase">Total active verifiers</span>
                  <span className="font-bold text-stone-800">14 active citizens</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500 uppercase">Average Resolution Time</span>
                  <span className="font-bold text-stone-800">4.2 hours</span>
                </div>
              </div>
            </div>

            {/* Verification Incentive Callout */}
            <div className="border border-[#1C1A17] p-6 bg-[#FAF9F6] rounded-sm shadow-[3px_3px_0px_0px_#1C1A17] space-y-4">
              <h3 className="font-serif text-lg font-bold italic text-stone-800">
                Community Verification Initiative
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                A robust municipal network relies on crowdsourced verification. Visit the Public Map to cross-reference neighborhood hazard locations and confirm active incidents to help prioritize dispatch routes!
              </p>
              <Link
                href="/map"
                className="inline-flex items-center gap-1 font-mono text-xs text-stone-800 font-bold hover:underline uppercase"
              >
                <span>Navigate to Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-8 border border-[#1C1A17] bg-[#FAF9F6] rounded-sm p-6 shadow-[4px_4px_0px_0px_#1C1A17] space-y-4">
            <h3 className="font-serif text-xl font-black uppercase tracking-tight border-b border-[#1C1A17]/10 pb-3">
              Active Municipal Dispatches
            </h3>

            {loadingData ? (
              <div className="py-12 text-center font-mono text-xs text-stone-400">Loading platforms logs...</div>
            ) : globalReports.length === 0 ? (
              <p className="text-center py-12 text-stone-400 font-serif italic text-sm">No active municipal dispatches registered.</p>
            ) : (
              <div className="divide-y divide-stone-100 font-sans">
                {globalReports.slice(0, 8).map((report) => {
                  const color = SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS] || '#10B981';
                  return (
                    <div key={report.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-mono text-[9px] uppercase text-stone-400">
                          {report.category} • ID {report.id.substring(0, 5)}...
                        </span>
                        <p className="font-bold text-[#1C1A17] uppercase">{report.description || 'No descriptive notes'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="px-1.5 py-0.5 text-[9px] font-mono rounded-[2px]"
                          style={{
                            backgroundColor: `${color}15`,
                            color,
                            border: `1px solid ${color}40`,
                          }}
                        >
                          {report.severity}
                        </span>
                        <span className="px-1.5 py-0.5 text-[9px] font-mono bg-stone-100 border border-stone-200 rounded-[2px] uppercase">
                          {report.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
