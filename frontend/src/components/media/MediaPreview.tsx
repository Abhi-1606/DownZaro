import React from 'react';
import { CustomPlayer } from './CustomPlayer';
import { FormatSelector } from './FormatSelector';
import { MediaInfoResponse } from '../../utils/types';
import { formatNumber, formatRelativeDate } from '../../utils/formatters';
import { Eye, Calendar, User, ExternalLink } from 'lucide-react';

interface MediaPreviewProps {
  info: MediaInfoResponse;
  onStartDownload: (params: any) => void;
  isDownloading?: boolean;
  isAuthenticated?: boolean;
  guestDownloadsCount?: number;
  guestLimit?: number;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  info,
  onStartDownload,
  isDownloading,
  isAuthenticated = false,
  guestDownloadsCount = 0,
  guestLimit = 3,
  onOpenAuth,
}) => {
  const media = info.media;

  return (
    <div className="w-full max-w-7xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Custom Video Player & Video Details (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Custom HTML5 Video & Embedded Player */}
          <CustomPlayer
            streamUrl={info.preview_proxy_url || media.preview_stream_url}
            embedUrl={media.embed_url}
            thumbnailUrl={media.thumbnail}
            title={media.title}
            startSeconds={info.start_seconds}
            durationFormatted={media.duration_formatted}
            isShort={media.duration > 0 && media.duration <= 65}
            qualities={info.preview_qualities || media.preview_streams}
            videoFormats={media.video_formats}
          />

          {/* Media Title & Metadata Info */}
          <div className="bg-zinc-950/80 p-5 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-xl font-inter">
            <h1
              dir="auto"
              className="text-lg md:text-xl font-bold font-manrope text-white leading-snug mb-3 tracking-tight"
            >
              {media.title}
            </h1>

            {/* Author / Stats Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#ef233c]/15 text-[#ef233c] flex items-center justify-center font-bold">
                  <User className="w-3.5 h-3.5" />
                </div>
                {media.uploader_url ? (
                  <a
                    href={media.uploader_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-white hover:text-[#ef233c] flex items-center gap-1 transition-colors"
                  >
                    {media.uploader}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="font-semibold text-white">{media.uploader}</span>
                )}
              </div>

              <div className="flex items-center gap-4 text-zinc-400">
                {media.view_count !== undefined && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{formatNumber(media.view_count)} views</span>
                  </div>
                )}
                {media.upload_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatRelativeDate(media.upload_date)}</span>
                  </div>
                )}
                <span className="font-semibold px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[11px]">
                  {media.duration_formatted}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Download Options Format Selector (5 cols) */}
        <div className="lg:col-span-5 sticky top-24">
          <FormatSelector
            media={media}
            onStartDownload={onStartDownload}
            isDownloading={isDownloading}
            isAuthenticated={isAuthenticated}
            guestDownloadsCount={guestDownloadsCount}
            guestLimit={guestLimit}
            onOpenAuth={onOpenAuth}
          />
        </div>
      </div>
    </div>
  );
};
