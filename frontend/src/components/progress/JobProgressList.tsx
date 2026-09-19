import React, { useEffect, useState, useRef } from 'react';
import { DownloadJob } from '../../utils/types';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Download,
  ExternalLink,
  Sparkles,
  X,
  Trash2,
} from 'lucide-react';

interface JobProgressListProps {
  jobs: DownloadJob[];
  onCancelJob: (jobId: string) => void;
  onDismissJob: (jobId: string) => void;
  onClearCompleted?: () => void;
  onJobComplete: (job: DownloadJob) => void;
}

export const JobProgressList: React.FC<JobProgressListProps> = ({
  jobs,
  onCancelJob,
  onDismissJob,
  onClearCompleted,
  onJobComplete,
}) => {
  if (jobs.length === 0) return null;

  const finishedCount = jobs.filter((j) => ['ready', 'failed', 'cancelled'].includes(j.status)).length;

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 space-y-3 font-inter animate-fade-up">
      {finishedCount > 1 && onClearCompleted && (
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-xs font-semibold text-zinc-400 font-manrope">
            Downloads ({jobs.length})
          </span>
          <button
            onClick={onClearCompleted}
            className="text-xs font-bold text-red-400 hover:text-white hover:underline flex items-center gap-1.5 cursor-pointer font-manrope px-2.5 py-1 rounded-full bg-white/5 hover:bg-[#ef233c]/20 border border-white/10 transition-all"
          >
            <Trash2 className="w-3 h-3 text-[#ef233c]" />
            Dismiss all completed ({finishedCount})
          </button>
        </div>
      )}

      {jobs.map((job) => (
        <JobCard
          key={job.job_id}
          job={job}
          onCancel={() => onCancelJob(job.job_id)}
          onDismiss={() => onDismissJob(job.job_id)}
          onComplete={(completedJob) => onJobComplete(completedJob)}
        />
      ))}
    </div>
  );
};

const JobCard: React.FC<{
  job: DownloadJob;
  onCancel: () => void;
  onDismiss: () => void;
  onComplete: (job: DownloadJob) => void;
}> = ({ job, onCancel, onDismiss, onComplete }) => {
  const [currentJob, setCurrentJob] = useState<DownloadJob>(job);
  const autoDownloadedRef = useRef(false);

  const triggerDirectBrowserDownload = (downloadUrl?: string, filename?: string) => {
    const url = downloadUrl || currentJob.download_url;
    const name = filename || currentJob.filename || 'downloaded_media';
    if (!url) return;

    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }, 200);
  };

  // Connect to Server-Sent Events (SSE)
  useEffect(() => {
    if (['ready', 'failed', 'cancelled'].includes(currentJob.status)) {
      return;
    }

    const eventSource = new EventSource(`/api/progress/${job.job_id}`);

    eventSource.addEventListener('progress', (e) => {
      try {
        const data = JSON.parse(e.data);
        setCurrentJob((prev) => {
          const updated = {
            ...prev,
            status: data.status,
            stage_label: data.stage_label,
            progress_percent: data.progress_percent,
            speed: data.speed,
            eta: data.eta,
            filename: data.filename,
            download_url: data.download_url,
            error: data.error,
          };

          if (data.status === 'ready') {
            onComplete(updated);
            // Auto-trigger browser download shelf in Chrome once
            if (!autoDownloadedRef.current && data.download_url) {
              autoDownloadedRef.current = true;
              triggerDirectBrowserDownload(data.download_url, data.filename);
            }
          }
          return updated;
        });
      } catch (err) {
        console.error('Failed to parse progress SSE:', err);
      }
    });

    eventSource.onerror = () => {
      // Auto-reconnect managed by browser EventSource
    };

    return () => {
      eventSource.close();
    };
  }, [job.job_id, onComplete]);

  const isCompleted = currentJob.status === 'ready';
  const isFailed = currentJob.status === 'failed';
  const isCancelled = currentJob.status === 'cancelled';
  const isMerging = currentJob.status === 'merging';

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-2xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {isCompleted ? (
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : isFailed || isCancelled ? (
            <div className="w-10 h-10 rounded-xl bg-[#ef233c]/20 text-[#ef233c] flex items-center justify-center shrink-0 shadow-sm border border-[#ef233c]/30">
              <AlertCircle className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#ef233c]/20 text-[#ef233c] flex items-center justify-center shrink-0 animate-pulse shadow-sm border border-[#ef233c]/30">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}

          <div className="min-w-0">
            <h4
              dir="auto"
              className="text-sm font-bold font-manrope text-white truncate"
              title={currentJob.title}
            >
              {currentJob.title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
              <span className="font-semibold text-[#ef233c]">{currentJob.format_label}</span>
              <span>•</span>
              <span className={isCompleted ? 'text-emerald-400 font-bold' : 'font-medium'}>
                {isCompleted ? 'Ready to Download / Saving...' : currentJob.stage_label}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="shrink-0 flex items-center gap-2">
          {isCompleted && currentJob.download_url && (
            <a
              href={currentJob.download_url}
              download={currentJob.filename || 'media'}
              onClick={() => {
                triggerDirectBrowserDownload();
              }}
              className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#ef233c] hover:bg-red-700 shadow-lg shadow-[#ef233c]/30 flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer font-manrope"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save File</span>
            </a>
          )}

          {!isCompleted && !isFailed && !isCancelled ? (
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
              title="Cancel Download"
              aria-label="Cancel download"
            >
              <XCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close / Dismiss"
              aria-label="Close download notification"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar & Status */}
      {!isCompleted && !isFailed && !isCancelled && (
        <div className="space-y-1.5 mt-2">
          <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
            {isMerging ? (
              <div className="h-full bg-gradient-to-r from-[#ef233c] to-[#ff4d6d] w-1/2 rounded-full animate-[gradient_2s_ease-in-out_infinite]" />
            ) : (
              <div
                className="h-full bg-gradient-to-r from-[#ef233c] to-[#ff4d6d] rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(239,35,60,0.6)]"
                style={{ width: `${Math.max(3, currentJob.progress_percent)}%` }}
              />
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>
              {isMerging ? 'Merging audio and video tracks (ffmpeg)...' : `${currentJob.progress_percent}%`}
            </span>
            <div className="flex items-center gap-3">
              {currentJob.speed && currentJob.speed !== '--' && <span>Speed: {currentJob.speed}</span>}
              {currentJob.eta && currentJob.eta !== '--' && <span>ETA: {currentJob.eta}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Completed Success Banner */}
      {isCompleted && (
        <div className="mt-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-300">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-semibold truncate">
              {currentJob.filename ? `Downloaded: ${currentJob.filename}` : 'Your media file has finished processing.'}
            </span>
          </div>
          {currentJob.download_url && (
            <a
              href={currentJob.download_url}
              download={currentJob.filename || 'media'}
              className="text-[#ef233c] font-bold hover:underline shrink-0 flex items-center gap-1 font-manrope"
            >
              Download again <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Error Detail Banner */}
      {isFailed && (
        <div className="mt-2 text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 font-inter">
          {currentJob.error || 'The download encountered an error. Please try another quality or check the link.'}
        </div>
      )}
    </div>
  );
};
