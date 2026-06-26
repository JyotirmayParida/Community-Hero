'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Map as MapIcon, Info, Check, RefreshCw } from 'lucide-react';
import { Report } from '@/lib/types';
import { SEVERITY_COLORS } from '@/lib/constants';

export default function MapPage() {
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Show a temporary toast message
  const showToast = React.useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Fetch reports from API
  const fetchReports = React.useCallback(async () => {
    // defer state update to avoid synchronous setState inside useEffect warnings
    await new Promise((resolve) => setTimeout(resolve, 0));
    setLoadingReports(true);
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data || []);
      } else {
        showToast('Failed to fetch public reports ledger.');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      showToast('Network error while fetching reports.');
    } finally {
      setLoadingReports(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchReports();
    }
  }, [user, fetchReports]);

  // Handle report confirmation
  const confirmReport = React.useCallback(async (reportId: string) => {
    if (!user) {
      showToast('You must be signed in to confirm an issue.');
      return;
    }
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/reports/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          reportId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Issue confirmation registered successfully.');
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? { ...r, confirmations: data.confirmations }
              : r
          )
        );
      } else {
        showToast(data.error || 'Failed to confirm report.');
      }
    } catch (err) {
      console.error('Error confirming report:', err);
      showToast('Error registering confirmation.');
    }
  }, [user, showToast]);

  // Bind the global click listener for the dynamically rendered Leaflet popup buttons
  useEffect(() => {
    const handlePopupClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.classList.contains('confirm-action-btn')) {
        const reportId = target.getAttribute('data-report-id');
        if (reportId) {
          confirmReport(reportId);
        }
      }
    };

    document.addEventListener('click', handlePopupClick);
    return () => {
      document.removeEventListener('click', handlePopupClick);
    };
  }, [confirmReport]);

  // Map Initialization and Marker management
  useEffect(() => {
    let activeMap: any = null;

    const initMap = async () => {
      if (!mapContainerRef.current || typeof window === 'undefined') return;

      // Import Leaflet dynamically to avoid server-side build issues
      const L = await import('leaflet');

      // If map is already initialized, reuse it, otherwise construct it
      if (!mapRef.current) {
        // Center of San Francisco as default viewport anchor
        activeMap = L.map(mapContainerRef.current, {
          center: [37.7749, -122.4194],
          zoom: 12,
          zoomControl: false,
        });

        // Add minimalist CartoDB Positron tiles for an elegant Editorial Aesthetic theme
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20,
        }).addTo(activeMap);

        // Add custom clean zoom control at bottom right
        L.control.zoom({
          position: 'bottomright',
        }).addTo(activeMap);

        mapRef.current = activeMap;
      } else {
        activeMap = mapRef.current;
      }

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Add pins for all reports
      if (reports.length > 0) {
        const bounds: any[] = [];

        reports.forEach((report) => {
          if (!report.geo || typeof report.geo.lat !== 'number' || typeof report.geo.lng !== 'number') {
            return;
          }

          const color = SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS] || '#10B981';
          const confirmCount = report.confirmations?.length || 0;

          // Beautiful, custom CSS-styled editorial marker pin
          const customIcon = L.divIcon({
            className: 'custom-map-pin',
            html: `
              <div class="relative group">
                <div class="w-6 h-6 rounded-full border border-[#1C1A17] flex items-center justify-center shadow-[2px_2px_0px_0px_#1C1A17] transition-transform duration-200 hover:scale-110 cursor-pointer" style="background-color: ${color};">
                  <div class="w-2 h-2 bg-[#FAF9F6] rounded-full"></div>
                </div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          // Popup HTML Content
          const isReporter = user?.uid === report.citizenId;
          const hasAlreadyConfirmed = report.confirmations?.includes(user?.uid || '');

          let actionHtml = '';
          if (!user) {
            actionHtml = `<span class="text-[10px] font-mono text-stone-500 uppercase tracking-wider block text-center py-1">Sign in to verify this issue</span>`;
          } else if (isReporter) {
            actionHtml = `<span class="text-[10px] font-mono text-stone-500 uppercase tracking-wider block text-center py-1 bg-stone-100 border border-stone-200 rounded-sm">Your Submitted Issue</span>`;
          } else if (hasAlreadyConfirmed) {
            actionHtml = `<span class="text-[10px] font-mono text-emerald-700 uppercase tracking-wider block text-center py-1 bg-emerald-50 border border-emerald-200 rounded-sm font-bold">✓ You Confirmed This</span>`;
          } else {
            actionHtml = `
              <button 
                data-report-id="${report.id}" 
                class="confirm-action-btn w-full py-1.5 font-mono text-[10px] uppercase tracking-wider bg-[#1C1A17] text-[#FAF9F6] hover:bg-[#1C1A17]/90 active:translate-y-px transition-all border border-[#1C1A17] rounded-sm cursor-pointer"
              >
                I've seen this too
              </button>
            `;
          }

          const popupContent = `
            <div class="p-2 space-y-2 text-[#1C1A17] font-sans min-w-[220px]">
              <div class="border-b border-[#1C1A17] pb-1">
                <h4 class="font-serif font-black uppercase text-sm tracking-tight m-0 leading-tight">${report.category}</h4>
              </div>
              <div class="flex flex-wrap gap-1.5 text-[9px] font-mono uppercase">
                <span class="px-1.5 py-0.5 rounded-[2px]" style="background-color: ${color}22; color: ${color}; border: 1px solid ${color}44;">
                  ${report.severity}
                </span>
                <span class="px-1.5 py-0.5 rounded-[2px] bg-stone-100 text-stone-700 border border-stone-200">
                  ${report.status}
                </span>
                ${confirmCount > 0 ? `
                  <span class="px-1.5 py-0.5 rounded-[2px] bg-stone-800 text-[#FAF9F6] border border-stone-800">
                    ✓ ${confirmCount} Confirms
                  </span>
                ` : ''}
              </div>
              ${report.description ? `<p class="text-xs text-stone-600 leading-relaxed font-serif italic my-1">${report.description}</p>` : ''}
              ${report.mediaUrl ? `
                <div class="relative w-full h-28 border border-[#1C1A17] rounded-sm overflow-hidden bg-stone-100 my-1">
                  <img src="${report.mediaUrl}" alt="${report.category}" class="w-full h-full object-cover" />
                </div>
              ` : ''}
              <div class="pt-1 border-t border-[#1C1A17]/10 space-y-1.5">
                ${actionHtml}
                <p class="text-[9px] text-stone-500 leading-normal font-sans">
                  Reports are reviewed and routed automatically &mdash; confirmations from neighbors help show how many people are affected by the same issue.
                </p>
              </div>
            </div>
          `;

          const marker = L.marker([report.geo.lat, report.geo.lng], { icon: customIcon })
            .bindPopup(popupContent, {
              maxWidth: 260,
              className: 'editorial-popup',
            })
            .addTo(activeMap);

          markersRef.current.push(marker);
          bounds.push([report.geo.lat, report.geo.lng]);
        });

        // Fit map bounds to encompass all pins if there are any
        if (bounds.length > 0 && activeMap) {
          activeMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
      }
    };

    initMap();

    // Clean up map reference on unmount
    return () => {
      // We don't destroy the map on re-render to avoid flashing,
      // but if the component is fully destroyed we can clear.
    };
  }, [reports, user]);

  if (authLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-2 bg-[#FAF9F6]">
        <div className="w-8 h-8 rounded-full border-2 border-stone-400 border-t-stone-800 animate-spin" />
        <span className="text-xs font-mono tracking-wider text-stone-500 uppercase">Loading Cartography Deck...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 border border-[#1C1A17] p-8 bg-[#F4F3EF] text-center rounded-sm shadow-[4px_4px_0px_0px_#1C1A17]">
        <h3 className="font-serif text-2xl font-black uppercase tracking-wide mb-4">Access Denied</h3>
        <p className="text-sm text-stone-600 mb-6 font-serif italic">
          &ldquo;Cartographical databases are restricted to registered citizens.&rdquo;
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      {/* Page Title Plaque */}
      <div className="border-b border-[#1C1A17] pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-stone-600">
            <MapIcon className="w-5 h-5 text-[#1C1A17]" />
            <span className="font-mono text-xs uppercase tracking-widest">Public Cartography</span>
          </div>
          <h2 className="font-serif text-3xl font-black uppercase tracking-tight">
            Spatially Resolved Issues Map
          </h2>
        </div>
        <button
          onClick={fetchReports}
          disabled={loadingReports}
          className="px-4 py-2 font-mono text-xs border border-[#1C1A17] bg-[#FAF9F6] text-[#1C1A17] hover:bg-stone-100 rounded-sm active:translate-y-px transition-all shadow-[2px_2px_0px_0px_#1C1A17] flex items-center gap-1.5 uppercase cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingReports ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Map Board */}
      <div className="border border-[#1C1A17] bg-[#F4F3EF] rounded-sm p-4 shadow-[4px_4px_0px_0px_#1C1A17] space-y-4">
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider border-b border-[#1C1A17]/10 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Spatial Resolution Console</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[11px] text-stone-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-stone-800" style={{ backgroundColor: SEVERITY_COLORS.LOW }} /> Low
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-stone-800" style={{ backgroundColor: SEVERITY_COLORS.MODERATE }} /> Moderate
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-stone-800" style={{ backgroundColor: SEVERITY_COLORS.HIGH }} /> High
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-stone-800" style={{ backgroundColor: SEVERITY_COLORS.SEVERE }} /> Severe
            </span>
          </div>
        </div>

        {/* Map View Frame */}
        <div className="relative w-full h-[550px] border border-[#1C1A17] rounded-sm overflow-hidden bg-stone-150">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {loadingReports && (
            <div className="absolute inset-0 bg-[#FAF9F6]/80 flex flex-col items-center justify-center gap-2 z-10 transition-all">
              <div className="w-8 h-8 rounded-full border-2 border-stone-400 border-t-stone-800 animate-spin" />
              <span className="text-xs font-mono tracking-wider text-stone-500 uppercase">Parsing Geographical Coordinates...</span>
            </div>
          )}

          {reports.length === 0 && !loadingReports && (
            <div className="absolute inset-0 bg-[#FAF9F6]/90 flex flex-col items-center justify-center text-center p-8 z-10">
              <p className="font-serif italic text-stone-600 mb-2">
                &ldquo;No municipal dispatches currently plotted on the grid.&rdquo;
              </p>
              <p className="text-xs font-mono text-stone-500 uppercase">Be the first to document a neighborhood hazard.</p>
            </div>
          )}
        </div>
      </div>

      {/* Premium Toast notification banner */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="bg-[#1C1A17] text-[#FAF9F6] border border-[#FAF9F6]/20 px-5 py-3 rounded-sm shadow-xl flex items-center gap-2.5 max-w-sm">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-mono text-xs uppercase tracking-wider leading-snug">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
