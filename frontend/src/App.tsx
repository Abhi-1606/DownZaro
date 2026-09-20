import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HeroSection } from './components/sections/HeroSection';
import { FeaturesSection } from './components/sections/FeaturesSection';
import { HowItWorks } from './components/sections/HowItWorks';
import { FaqAccordion } from './components/sections/FaqAccordion';
import { UrlInput } from './components/media/UrlInput';
import { MediaPreview } from './components/media/MediaPreview';
import { JobProgressList } from './components/progress/JobProgressList';
import { HistoryPanel } from './components/history/HistoryPanel';
import { UndoToast } from './components/history/UndoToast';
import { LegalModal } from './components/legal/LegalModal';
import { InstallAppModal } from './components/pwa/InstallAppModal';


import { useTheme } from './hooks/useTheme';
import { useHistoryStorage } from './hooks/useHistoryStorage';
import {
  MediaInfoResponse,
  DownloadJob,
  HealthInfo,
  HistoryItem,
} from './utils/types';
import {
  AlertCircle,
  WifiOff,
  ShieldCheck,
  X,
} from 'lucide-react';

export const App: React.FC = () => {
  const { themeMode, resolvedTheme, setThemeMode } = useTheme();
  const {
    history,
    addHistoryItem,
    removeHistoryItem,
    clearAllHistory,
    undoToast,
    dismissUndo,
  } = useHistoryStorage();

  const [activeView, setActiveView] = useState<'home' | 'history'>('home');
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | 'dmca' | null>(null);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Capture PWA beforeinstallprompt on Chrome/Edge/Android
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);


  // Media Fetching State
  const [mediaInfo, setMediaInfo] = useState<MediaInfoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<{ title: string; message: string; retryable?: boolean } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Active Download Jobs
  const [activeJobs, setActiveJobs] = useState<DownloadJob[]>([]);

  // Health Diagnostics
  const [healthInfo, setHealthInfo] = useState<HealthInfo | null>(null);

  // Offline detection
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // One-time dismissible creator rights notice
  const [showNotice, setShowNotice] = useState(() => {
    try {
      return !localStorage.getItem('downzaro_notice_dismissed');
    } catch {
      return true;
    }
  });

  // Offline / Online listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch health check on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealthInfo(data))
      .catch((err) => console.warn('Health check error:', err));
  }, []);

  const handleFetch = async (url: string) => {
    // Abort previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setFetchError(null);
    setMediaInfo(null);

    try {
      const res = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text || `Server error (${res.status})` };
      }

      if (!res.ok) {
        throw new Error(data.message || data.detail || `Server returned error (${res.status})`);
      }

      setMediaInfo(data);
      setActiveView('home');
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setFetchError({
        title: 'Extraction Error',
        message: err.message || 'Failed to process media URL. Please check the link and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelFetch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  const handleStartDownload = async (params: {
    format_type: 'video' | 'audio' | 'thumbnail' | 'all_in_one';
    format_id?: string;
    audio_id?: string;
    thumb_id?: string;
    thumbnail_url?: string;
    format_label: string;
  }) => {
    if (!mediaInfo) return;

    // STRATEGY 1: Vercel-compatible stream-download
    // Resolves a direct CDN URL via yt_dlp Python API —
    // no job/SSE needed. Works on Vercel serverless.
    if (params.format_type === 'video' || params.format_type === 'audio') {
      try {
        const res = await fetch('/api/stream-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: mediaInfo.canonical_url,
            format_type: params.format_type,
            format_id: params.format_id,
            audio_id: params.audio_id,
          }),
        });

        const text = await res.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch { data = {}; }

        if (res.ok && data.direct_url) {
          const fakeJobId = `stream-${Date.now()}`;
          const readyJob: DownloadJob = {
            job_id: fakeJobId,
            title: mediaInfo.media.title,
            platform_id: mediaInfo.platform_id,
            url: mediaInfo.canonical_url,
            format_type: params.format_type,
            format_label: params.format_label,
            status: 'ready',
            stage_label: 'Download ready!',
            progress_percent: 100,
            speed: '--',
            eta: '--',
            created_at: Date.now(),
            thumbnail_url: mediaInfo.media.thumbnail,
            filename: data.filename,
            download_url: data.direct_url,
          };
          setActiveJobs((prev) => [readyJob, ...prev]);

          // Trigger native browser download via hidden anchor
          const a = document.createElement('a');
          a.href = data.direct_url;
          a.download = data.filename || 'media';
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => { if (document.body.contains(a)) document.body.removeChild(a); }, 300);
          return;
        }
        // If stream-download fails, fall through to job-based path
      } catch {
        // Silently fall through to job-based download
      }
    }

    // STRATEGY 2: Job-based background download (local server)
    // Creates a job, SSE streams progress back to UI.
    // Used for thumbnails, all_in_one bundles, and as local fallback.
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: mediaInfo.canonical_url,
          title: mediaInfo.media.title,
          video_id: mediaInfo.media.video_id,
          extractor_key: mediaInfo.media.extractor_key,
          format_type: params.format_type,
          format_id: params.format_id,
          audio_id: params.audio_id,
          thumb_id: params.thumb_id,
          thumbnail_url: params.thumbnail_url || mediaInfo.media.thumbnail,
        }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text || `Server error (${res.status})` };
      }

      if (!res.ok) {
        alert(data.message || 'Failed to initialize download.');
        return;
      }

      const newJob: DownloadJob = {
        job_id: data.job_id,
        title: mediaInfo.media.title,
        platform_id: mediaInfo.platform_id,
        url: mediaInfo.canonical_url,
        format_type: params.format_type,
        format_label: params.format_label,
        status: data.status,
        stage_label: data.stage_label,
        progress_percent: 0,
        speed: '--',
        eta: '--',
        created_at: Date.now(),
        thumbnail_url: mediaInfo.media.thumbnail,
      };

      setActiveJobs((prev) => [newJob, ...prev]);
    } catch (err: any) {
      alert(`Download start error: ${err.message}`);
    }
  };


  const handleCancelJob = async (jobId: string) => {
    try {
      await fetch(`/api/cancel/${jobId}`, { method: 'POST' });
      setActiveJobs((prev) =>
        prev.map((j) => (j.job_id === jobId ? { ...j, status: 'cancelled', stage_label: 'Cancelled' } : j))
      );
    } catch {}
  };

  const handleDismissJob = (jobId: string) => {
    setActiveJobs((prev) => prev.filter((j) => j.job_id !== jobId));
  };

  const handleClearCompletedJobs = () => {
    setActiveJobs((prev) => prev.filter((j) => !['ready', 'failed', 'cancelled'].includes(j.status)));
  };

  const handleJobComplete = (completedJob: DownloadJob) => {
    const historyItem: HistoryItem = {
      id: completedJob.job_id,
      title: completedJob.title,
      url: completedJob.url,
      platform_id: completedJob.platform_id,
      platform_name: completedJob.platform_id.toUpperCase(),
      format_type: completedJob.format_type,
      quality: completedJob.format_label,
      date: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'Completed',
      thumbnail: completedJob.thumbnail_url,
      filename: completedJob.filename,
      download_url: completedJob.download_url,
    };

    addHistoryItem(historyItem);
  };

  const dismissNotice = () => {
    setShowNotice(false);
    try {
      localStorage.setItem('downzaro_notice_dismissed', 'true');
    } catch {}
  };

  const handleScrollToInput = () => {
    setActiveView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-white font-inter relative overflow-x-hidden selection-red flex flex-col">
      {/* Global Red Noir Background with Parallax Stars & Crimson Blur */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0505] to-black" />
        <div className="absolute top-0 left-0 w-[1px] h-[1px] bg-transparent stars-1 animate-star-1" />
        <div className="absolute top-0 left-0 w-[2px] h-[2px] bg-transparent stars-2 animate-star-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_80%)]" />
      </div>

      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="sticky top-0 z-50 bg-[#ef233c] text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-md font-manrope">
          <WifiOff className="w-4 h-4" />
          <span>You are currently offline. Please check your internet connection.</span>
        </div>
      )}

      {/* App Header */}
      <Header
        themeMode={themeMode}
        resolvedTheme={resolvedTheme}
        setThemeMode={setThemeMode}
        activeView={activeView}
        setActiveView={setActiveView}
        onGetStartedClick={handleScrollToInput}
        onOpenInstallApp={() => setInstallModalOpen(true)}
        activeDownloadsCount={activeJobs.filter((j) => ['queued', 'preparing', 'downloading_video', 'downloading_audio', 'merging'].includes(j.status)).length}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16 relative z-10">
        {activeView === 'history' ? (
          /* DOWNLOAD HISTORY VIEW */
          <HistoryPanel
            history={history}
            onRemoveItem={removeHistoryItem}
            onClearAll={clearAllHistory}
            onRedownload={(url) => {
              handleFetch(url);
              setActiveView('home');
            }}
          />
        ) : (
          /* HOME VIEW */
          <>
            {/* First-time Creator Rights Notice */}
            {showNotice && (
              <div className="max-w-4xl mx-auto px-4 pt-4">
                <div className="p-3.5 rounded-2xl bg-brand-primary/10 border border-brand-primary/30 text-xs text-light-text dark:text-dark-text flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-brand-primary shrink-0" />
                    <span>
                      Welcome to DownZaro. Please respect creator copyright and terms of service. Only download media you have permission to access.
                    </span>
                  </div>
                  <button
                    onClick={dismissNotice}
                    className="p-1 rounded-full text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text"
                    aria-label="Dismiss notice"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Hero Section */}
            <HeroSection />

            {/* Smart URL Bar Input */}
            <div className="px-4">
              <UrlInput
                onFetch={handleFetch}
                isLoading={isLoading}
                onCancelFetch={handleCancelFetch}
              />
            </div>

            {/* Extraction Error Banner */}
            {fetchError && (
              <div className="max-w-4xl mx-auto px-4 mt-6 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">{fetchError.title}</h4>
                    <p className="text-xs text-red-400 mt-0.5 leading-relaxed">{fetchError.message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Active Download Progress List */}
            <div className="px-4">
              <JobProgressList
                jobs={activeJobs}
                onCancelJob={handleCancelJob}
                onDismissJob={handleDismissJob}
                onClearCompleted={handleClearCompletedJobs}
                onJobComplete={handleJobComplete}
              />
            </div>

            {/* Media Preview & Format Selector */}
            {mediaInfo && (
              <div className="px-4">
                <MediaPreview
                  info={mediaInfo}
                  onStartDownload={handleStartDownload}
                />
              </div>
            )}

            {/* Landing Sections: Features, How It Works, FAQ */}
            <FeaturesSection />
            <HowItWorks />
            <FaqAccordion />
          </>
        )}
      </main>

      {/* Undo Toast (8 seconds) */}
      <UndoToast toast={undoToast} onDismiss={dismissUndo} />

      {/* Legal Policy Modals */}
      <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />

      {/* Universal PWA Install App Modal (Mac, iPhone, iPad, Windows, Android) */}
      <InstallAppModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstallSuccess={() => {
          setDeferredPrompt(null);
          setInstallModalOpen(false);
        }}
      />

      {/* Footer */}
      <Footer
        onOpenLegal={(type) => setLegalModalType(type)}
        healthInfo={healthInfo}
      />
    </div>
  );
};
export default App;
