'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { SEVERITY_COLORS } from '@/lib/constants';
import { Report } from '@/lib/types';
import { 
  PenSquare, 
  Upload, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  CornerDownRight,
  RefreshCw,
  Clock,
  Briefcase,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function ReportPage() {
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
  
  // Form states
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [compressedBase64, setCompressedBase64] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  
  // Geolocation states
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [geoStatus, setGeoStatus] = useState<'idle' | 'fetching' | 'success' | 'failed'>('idle');
  const [geoError, setGeoError] = useState<string>('');

  // Submission/Agent Processing states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [processedReport, setProcessedReport] = useState<Report | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerGeolocation = () => {
    setGeoStatus('fetching');
    setGeoError('');
    
    if (!navigator.geolocation) {
      setGeoStatus('failed');
      setGeoError('Geolocation is not supported by your browser.');
      setLat('');
      setLng('');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
        setGeoStatus('success');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGeoStatus('failed');
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError('Location permission denied by user. Enter coordinates manually below.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError('Location information is unavailable. Enter coordinates manually.');
            break;
          case error.TIMEOUT:
            setGeoError('Location request timed out. Enter coordinates manually.');
            break;
          default:
            setGeoError('An unknown error occurred during geolocation.');
        }
        setLat('');
        setLng('');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Trigger geolocation on mount or when requested
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        triggerGeolocation();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Compress & resize image to max 1024px width, JPEG 70% quality, under 500KB
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG) only.');
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setErrorMsg('');

    // Resize & Compress client-side
    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resize to max 1024px width
        const MAX_WIDTH = 1024;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('Failed to get 2D canvas context.');
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 70% quality
        let quality = 0.7;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Ensure under 500KB (512,000 bytes)
        let base64Length = dataUrl.length - 'data:image/jpeg;base64,'.length;
        let approxSizeInBytes = base64Length * 0.75;
        
        while (approxSizeInBytes > 500000 && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          base64Length = dataUrl.length - 'data:image/jpeg;base64,'.length;
          approxSizeInBytes = base64Length * 0.75;
        }
        
        setCompressedBase64(dataUrl);
        console.log(`Image compressed. Width: ${width}px, Height: ${height}px, Approx Size: ${(approxSizeInBytes / 1024).toFixed(1)} KB`);
      };
    };
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.type.startsWith('image/')) {
        alert('Please drop an image file only.');
        return;
      }
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
      
      // Compress
      const reader = new FileReader();
      reader.readAsDataURL(droppedFile);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 1024;
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            let quality = 0.7;
            let dataUrl = canvas.toDataURL('image/jpeg', quality);
            let base64Length = dataUrl.length - 'data:image/jpeg;base64,'.length;
            let approxSizeInBytes = base64Length * 0.75;
            
            while (approxSizeInBytes > 500000 && quality > 0.1) {
              quality -= 0.1;
              dataUrl = canvas.toDataURL('image/jpeg', quality);
              base64Length = dataUrl.length - 'data:image/jpeg;base64,'.length;
              approxSizeInBytes = base64Length * 0.75;
            }
            setCompressedBase64(dataUrl);
          }
        };
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compressedBase64) {
      setErrorMsg('Please upload and capture an incident photo first.');
      return;
    }

    const latitudeNum = parseFloat(lat);
    const longitudeNum = parseFloat(lng);

    if (isNaN(latitudeNum) || isNaN(longitudeNum)) {
      setErrorMsg('Please specify valid latitude and longitude coordinates.');
      return;
    }

    setIsSubmitting(true);
    setProcessedReport(null);
    setErrorMsg('');
    setActiveStep(0);
    setLogs([]);

    const addLog = (text: string) => {
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${text}`]);
    };

    try {
      // Step 1: Intake Agent dispatch
      addLog('Intake Agent: Dispatched. Preparing visual analysis payloads...');
      setActiveStep(1);
      await new Promise((r) => setTimeout(r, 1200));

      // Step 2: Running Gemini Classification
      addLog('Intake Agent: Uploading compressed base64 frame to Gemini model...');
      addLog('Intake Agent: Analyzing category vectors, priority weights, and confidence levels...');
      setActiveStep(2);
      await new Promise((r) => setTimeout(r, 1500));

      // POST Request
      addLog('Platform Pipeline: Sending payload to municipal ingestion stream...');
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          citizenId: user?.uid,
          mediaUrl: compressedBase64,
          description: description,
          geo: { lat: latitudeNum, lng: longitudeNum },
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Failed to submit report.');
      }

      const reportResult = await response.json() as Report;

      // Step 3: Deduplication
      addLog('Deduplication Agent: Intercepting report...');
      addLog('Deduplication Agent: Querying spatially co-located incidents of same category...');
      setActiveStep(3);
      await new Promise((r) => setTimeout(r, 1500));

      if (reportResult.duplicateOf) {
        addLog(`Deduplication Agent: Spatial collision detected. Tied to report ID: ${reportResult.duplicateOf}`);
      } else {
        addLog('Deduplication Agent: Uniqueness confirmed. Spatially clean entry.');
      }

      // Step 4: Routing
      addLog('Routing Agent: Analyzing category ownership matrix...');
      setActiveStep(4);
      await new Promise((r) => setTimeout(r, 1200));
      addLog(`Routing Agent: Assigned to [${reportResult.department || 'General Services'}]. Priority: ${reportResult.priority || 'LOW'}`);

      // Step 5: Escalation
      addLog('Escalation Agent: Scanning priority metrics and urgency parameters...');
      setActiveStep(5);
      await new Promise((r) => setTimeout(r, 1000));

      if (reportResult.status === 'escalated') {
        addLog('Escalation Agent: SEVERE incident flagged. Urgent municipal dispatch triggered!');
      } else {
        addLog('Escalation Agent: Urgency within normal SLA. Monitoring active.');
      }

      addLog('Platform Pipeline: Lifecycle processing complete. Record committed to ledger.');
      setProcessedReport(reportResult);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during report submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl('');
    setCompressedBase64('');
    setDescription('');
    setProcessedReport(null);
    setErrorMsg('');
    triggerGeolocation();
  };

  if (authLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-stone-400 border-t-stone-800 animate-spin" />
        <span className="text-xs font-mono tracking-wider text-stone-500 uppercase">Synchronizing Credentials...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 border border-[#1C1A17] p-8 bg-[#F4F3EF] text-center rounded-sm shadow-[4px_4px_0px_0px_#1C1A17]">
        <h3 className="font-serif text-2xl font-black uppercase tracking-wide mb-4">Verification Required</h3>
        <p className="text-sm text-stone-600 mb-6 font-serif italic leading-relaxed">
          &ldquo;The submission of municipal incident logs requires a validated citizen signature.&rdquo;
        </p>
        <button
          onClick={signInWithGoogle}
          className="w-full py-3 font-serif text-sm border border-[#1C1A17] bg-[#1C1A17] text-[#FAF9F6] rounded-sm hover:bg-[#1C1A17]/90 active:translate-y-px transition-all shadow-[4px_4px_0px_0px_#D6D3D1] uppercase tracking-wider font-bold"
        >
          Google Sign-In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Title Plaque */}
      <div className="border-b border-[#1C1A17] pb-4 space-y-2">
        <div className="flex items-center gap-2 text-stone-600">
          <PenSquare className="w-5 h-5 text-[#1C1A17]" />
          <span className="font-mono text-xs uppercase tracking-widest">INCIDENT LOGS</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-black uppercase tracking-tight">
          File Ingestion Portal
        </h2>
        <p className="text-xs font-mono text-stone-500 uppercase tracking-wide">
          Submit photo evidence. The Multi-Agent platform will classify, map, and dispatch autonomously.
        </p>
      </div>

      {!processedReport && !isSubmitting && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Visual Capture & Geolocation */}
          <div className="space-y-6">
            <h3 className="font-serif text-xl font-bold border-b border-stone-200 pb-1.5 uppercase tracking-wide">
              1. Spatial Evidence
            </h3>

            {/* Photo Capture/Upload Canvas */}
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] bg-[#F4F3EF] ${
                previewUrl 
                  ? 'border-[#1C1A17]' 
                  : 'border-stone-300 hover:border-stone-500 hover:bg-stone-50'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {previewUrl ? (
                <div className="space-y-3 w-full">
                  <div className="relative aspect-video w-full border border-[#1C1A17] rounded-sm overflow-hidden bg-white shadow-[2px_2px_0px_0px_#1C1A17]">
                    <img 
                      src={previewUrl} 
                      alt="Citizen Evidence Preview" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    Evidence Frame Captured & Compressed
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setPreviewUrl('');
                      setCompressedBase64('');
                    }}
                    className="text-xs font-mono uppercase tracking-wider text-stone-600 hover:text-red-600 transition-colors"
                  >
                    Remove Frame
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-stone-400 mx-auto" />
                  <p className="font-serif font-bold text-sm text-stone-800">
                    Upload/Drop Incident Photo
                  </p>
                  <p className="text-[11px] font-mono text-stone-500 uppercase tracking-widest">
                    JPEG, PNG up to 10MB
                  </p>
                </div>
              )}
            </div>

            {/* Geolocation Section */}
            <div className="border border-[#1C1A17]/15 p-4 bg-[#F4F3EF] rounded-sm space-y-4">
              <div className="flex justify-between items-center border-b border-[#1C1A17]/10 pb-1.5">
                <span className="font-serif font-bold text-sm uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  Geolocation Lock
                </span>
                <button
                  type="button"
                  onClick={triggerGeolocation}
                  disabled={geoStatus === 'fetching'}
                  className="p-1 text-stone-600 hover:text-[#1C1A17] disabled:opacity-50 hover:bg-stone-200 rounded transition-all"
                  title="Refresh GPS Lock"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${geoStatus === 'fetching' ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {geoStatus === 'fetching' && (
                <div className="py-2 flex items-center gap-2 text-xs font-mono text-stone-500 uppercase">
                  <div className="w-3.5 h-3.5 border border-stone-400 border-t-stone-800 rounded-full animate-spin" />
                  Triangulating satellite coordinates...
                </div>
              )}

              {geoStatus === 'success' && (
                <div className="text-xs font-mono text-[#10B981] flex items-center gap-1.5 uppercase font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Coordinates Locked via GPS
                </div>
              )}

              {geoStatus === 'failed' && (
                <div className="text-xs font-mono text-[#EF4444] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold uppercase">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    GPS Telemetry Denied / Failed
                  </div>
                  <p className="text-[10px] text-stone-500 normal-case leading-normal">{geoError}</p>
                </div>
              )}

              {/* Coordinates Inputs */}
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <label className="block text-stone-500 uppercase mb-1">LATITUDE</label>
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => {
                      setLat(e.target.value);
                      setGeoStatus('idle');
                    }}
                    placeholder="37.774900"
                    className="w-full p-2 border border-[#1C1A17]/20 bg-[#FAF9F6] rounded-sm focus:border-[#1C1A17] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 uppercase mb-1">LONGITUDE</label>
                  <input
                    type="text"
                    value={lng}
                    onChange={(e) => {
                      setLng(e.target.value);
                      setGeoStatus('idle');
                    }}
                    placeholder="-122.419400"
                    className="w-full p-2 border border-[#1C1A17]/20 bg-[#FAF9F6] rounded-sm focus:border-[#1C1A17] outline-none"
                  />
                </div>
              </div>

              <div className="text-[10px] text-stone-500 font-serif italic leading-relaxed">
                &ldquo;Automatic GPS location is highly recommended to bypass duplicates and target exact divisions.&rdquo;
              </div>
            </div>
          </div>

          {/* Right Column: Ingestion Fields */}
          <div className="space-y-6">
            <h3 className="font-serif text-xl font-bold border-b border-stone-200 pb-1.5 uppercase tracking-wide">
              2. Description & Submission
            </h3>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-600">
                Witness Testimony / Narrative Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the incident with relevant details (e.g., 'Streetlight has been flickering next to the corner park entrance since Sunday. Dark areas make paths dangerous.')"
                rows={5}
                className="w-full p-3 border border-[#1C1A17] bg-[#FAF9F6] rounded-sm focus:border-[#1C1A17] focus:ring-0 outline-none font-serif text-sm leading-relaxed"
              />
            </div>

            {errorMsg && (
              <div className="p-3 border border-red-200 bg-red-50 text-red-700 text-xs font-mono rounded-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 font-serif text-sm border border-[#1C1A17] bg-[#1C1A17] text-[#FAF9F6] rounded-sm hover:bg-[#1C1A17]/95 active:translate-y-px transition-all shadow-[4px_4px_0px_0px_#D6D3D1] uppercase tracking-wider font-black flex items-center justify-center gap-2"
            >
              Dispatch to Ingestion Pipeline
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Ingestion Notes Panel */}
            <div className="border border-[#1C1A17]/10 p-4 rounded-sm space-y-2 text-xs text-stone-600 bg-[#FAF9F6]">
              <span className="font-mono font-bold uppercase block border-b border-[#1C1A17]/10 pb-1">Ingestion Standards</span>
              <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                <li>Visual frame sizes are compressed on-device for secure transfer.</li>
                <li>Categories and Severities are computed on ingestion using multimodal artificial networks.</li>
                <li>Duplicate reports are linked together under a parent ticket.</li>
              </ul>
            </div>
          </div>
        </form>
      )}

      {/* Processing State - Editorial Console Logs */}
      {isSubmitting && (
        <div className="max-w-2xl mx-auto border border-[#1C1A17] p-8 bg-[#FAF9F6] rounded-sm shadow-[4px_4px_0px_0px_#1C1A17] space-y-8">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-[#1C1A17] animate-spin mx-auto" />
            <h3 className="font-serif text-xl font-bold uppercase tracking-wider">Multi-Agent Pipeline Active</h3>
            <p className="text-xs font-mono text-stone-500 uppercase tracking-widest">
              Processing Municipal Ledger Entry...
            </p>
          </div>

          {/* Stepper visual */}
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div 
                key={s} 
                className={`h-2 rounded-sm transition-all ${
                  s <= activeStep 
                    ? 'bg-[#1C1A17]' 
                    : s === activeStep + 1 
                      ? 'bg-stone-300 animate-pulse' 
                      : 'bg-stone-100'
                }`}
              />
            ))}
          </div>

          {/* Live System Log Box */}
          <div className="border border-[#1C1A17]/20 p-4 bg-[#F4F3EF] rounded-sm font-mono text-xs space-y-1.5 h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-300 scrollbar-track-transparent">
            {logs.map((log, index) => (
              <div key={index} className="text-stone-700 leading-normal flex items-start gap-1">
                <span className="text-[#1C1A17] select-none shrink-0">&gt;</span>
                <span className="whitespace-pre-wrap">{log}</span>
              </div>
            ))}
          </div>

          <div className="text-center font-serif text-xs italic text-stone-500 leading-normal border-t border-[#1C1A17]/10 pt-4">
            &ldquo;Autonomous Agents inspect spatial collisions, route ownership vectors, and assign legal SLA timelines.&rdquo;
          </div>
        </div>
      )}

      {/* Finished State - Resulting Ticket */}
      {processedReport && !isSubmitting && (
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="border border-[#1C1A17] p-6 sm:p-8 bg-[#F4F3EF] rounded-sm shadow-[5px_5px_0px_0px_#1C1A17] space-y-6">
            
            {/* Ticket Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 border-b border-[#1C1A17]/20 pb-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-stone-500">MUNICIPAL TICKET RECORD</span>
                <h3 className="font-serif text-2xl font-black uppercase tracking-tight text-[#1C1A17]">
                  {processedReport.id}
                </h3>
                <span className="font-mono text-[11px] text-stone-500 block mt-1">
                  SUBMITTED AT: {new Date(processedReport.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Status Badge */}
              <div 
                className="px-3 py-1.5 border border-[#1C1A17] bg-[#1C1A17] text-[#FAF9F6] rounded-sm shadow-[2px_2px_0px_0px_#888] text-xs font-mono uppercase tracking-widest font-bold text-center"
              >
                STATUS: {processedReport.status}
              </div>
            </div>

            {/* Main Ticket Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Evidence Frame Preview */}
              <div className="space-y-2">
                <span className="font-mono text-xs uppercase text-stone-500 block">VISUAL EVIDENCE</span>
                <div className="border border-[#1C1A17] rounded-sm overflow-hidden bg-white aspect-video max-h-56 relative shadow-[2px_2px_0px_0px_#1C1A17]">
                  <img 
                    src={processedReport.mediaUrl} 
                    alt="Ticket Evidence Frame"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Ingestion Meta */}
              <div className="space-y-4 font-mono text-xs">
                <span className="text-stone-500 uppercase block font-sans">AI METRICS & CLASSIFICATION</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#FAF9F6] p-2 border border-stone-200 rounded-sm">
                    <span className="text-stone-500 block text-[10px]">CATEGORY</span>
                    <span className="text-[#1C1A17] font-bold text-sm block">{processedReport.category}</span>
                  </div>

                  <div className="bg-[#FAF9F6] p-2 border border-stone-200 rounded-sm">
                    <span className="text-stone-500 block text-[10px]">CONFIDENCE</span>
                    <span className="text-[#1C1A17] font-bold text-sm block">
                      {(processedReport.confidence * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="bg-[#FAF9F6] p-2 border border-stone-200 rounded-sm" style={{ borderLeft: `4px solid ${SEVERITY_COLORS[processedReport.severity] || '#ccc'}` }}>
                    <span className="text-stone-500 block text-[10px]">SEVERITY</span>
                    <span className="text-[#1C1A17] font-bold text-sm block">{processedReport.severity}</span>
                  </div>

                  <div className="bg-[#FAF9F6] p-2 border border-stone-200 rounded-sm">
                    <span className="text-stone-500 block text-[10px]">PRIORITY SLA</span>
                    <span className="text-[#1C1A17] font-bold text-sm block">
                      {processedReport.priority ? `${processedReport.priority}` : 'None'}
                    </span>
                  </div>
                </div>

                <div className="bg-[#FAF9F6] p-2.5 border border-stone-200 rounded-sm space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#1C1A17] uppercase tracking-wide text-[10px]">
                    <Briefcase className="w-3.5 h-3.5" />
                    ASSIGNED DEPARTMENT
                  </div>
                  <div className="text-xs text-stone-800 font-serif font-bold">
                    {processedReport.department || 'Awaiting assignment'}
                  </div>
                </div>
              </div>
            </div>

            {/* Testimony Section */}
            {processedReport.description && (
              <div className="border-t border-[#1C1A17]/10 pt-4 space-y-1.5">
                <span className="font-mono text-xs uppercase text-stone-500 block">WITNESS TESTIMONY</span>
                <p className="font-serif text-stone-800 text-sm leading-relaxed p-3 bg-[#FAF9F6] border border-stone-200/60 rounded-sm italic">
                  &ldquo;{processedReport.description}&rdquo;
                </p>
              </div>
            )}

            {/* Multi-Agent Log Stream */}
            <div className="border-t border-[#1C1A17]/10 pt-4 space-y-3">
              <span className="font-mono text-xs uppercase text-stone-500 block flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#1C1A17]" />
                MULTI-AGENT INGESTION LEDGER
              </span>
              
              <div className="space-y-2">
                {processedReport.history.map((log, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start text-xs font-mono">
                    <div className="shrink-0 mt-0.5">
                      <CornerDownRight className="w-3.5 h-3.5 text-stone-400" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap gap-x-2 items-center">
                        <span className="uppercase font-bold text-[#1C1A17]">{log.status}</span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-stone-600 normal-case leading-normal">{log.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Advisory */}
            <div className="border-t border-[#1C1A17]/10 pt-4 font-mono text-[10px] text-stone-500 uppercase tracking-wide leading-relaxed">
              Reports are reviewed and routed automatically &mdash; confirmations from neighbors help show how many people are affected by the same issue.
            </div>

            {/* Options */}
            <div className="border-t border-[#1C1A17]/10 pt-4 flex justify-end">
              <button
                onClick={handleReset}
                className="px-5 py-2.5 font-serif text-xs border border-[#1C1A17] bg-[#1C1A17] text-[#FAF9F6] rounded-sm hover:opacity-90 active:translate-y-px transition-all uppercase tracking-wider font-bold shadow-[2px_2px_0px_0px_#888]"
              >
                Log Another Incident
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
