import React, { useState } from 'react';
import {
  Video,
  Music,
  Image as ImageIcon,
  Layers,
  Download,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { MediaDetails, VideoFormat, AudioFormat, ThumbnailFormat } from '../../utils/types';
import { formatBytes } from '../../utils/formatters';

interface FormatSelectorProps {
  media: MediaDetails;
  onStartDownload: (params: {
    format_type: 'video' | 'audio' | 'thumbnail' | 'all_in_one';
    format_id?: string;
    audio_id?: string;
    thumb_id?: string;
    thumbnail_url?: string;
    format_label: string;
  }) => void;
  isDownloading?: boolean;
  isAuthenticated?: boolean;
  guestDownloadsCount?: number;
  guestLimit?: number;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  media,
  onStartDownload,
  isDownloading = false,
  isAuthenticated = false,
  guestDownloadsCount = 0,
  guestLimit = 3,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'thumbnail' | 'all_in_one'>('video');

  // Selected format items
  const [selectedVideo, setSelectedVideo] = useState<VideoFormat | null>(() => {
    return media.video_formats.find((f) => f.is_recommended) || media.video_formats[0] || null;
  });

  const [selectedAudio, setSelectedAudio] = useState<AudioFormat | null>(() => {
    return media.audio_formats.find((a) => a.is_recommended) || media.audio_formats[0] || null;
  });

  const [selectedThumb, setSelectedThumb] = useState<ThumbnailFormat | null>(() => {
    return media.thumbnails.find((t) => t.is_recommended) || media.thumbnails[0] || null;
  });

  const handleDownloadClick = () => {
    if (activeTab === 'video') {
      if (!selectedVideo) return;
      onStartDownload({
        format_type: 'video',
        format_id: selectedVideo.format_id,
        format_label: `MP4 - ${selectedVideo.resolution} (${selectedVideo.fps}fps)`,
      });
    } else if (activeTab === 'audio') {
      if (!selectedAudio) return;
      onStartDownload({
        format_type: 'audio',
        audio_id: selectedAudio.audio_id,
        format_label: `${selectedAudio.title} (${selectedAudio.bitrate})`,
      });
    } else if (activeTab === 'thumbnail') {
      if (!selectedThumb) return;
      onStartDownload({
        format_type: 'thumbnail',
        thumb_id: selectedThumb.thumb_id,
        thumbnail_url: selectedThumb.url,
        format_label: `Thumbnail (${selectedThumb.resolution})`,
      });
    } else if (activeTab === 'all_in_one') {
      onStartDownload({
        format_type: 'all_in_one',
        format_id: selectedVideo?.format_id,
        audio_id: selectedAudio?.audio_id || 'mp3-320k',
        thumbnail_url: selectedThumb?.url || media.thumbnail,
        format_label: 'All-in-One ZIP Bundle',
      });
    }
  };

  return (
    <div className="w-full bg-zinc-950/80 rounded-2xl p-6 border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col justify-between font-inter">
      <div>
        {/* Title Header */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
          <h3 className="text-lg font-bold font-manrope text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#ef233c]" />
            Download Options
          </h3>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400">
            {media.video_formats.length} Qualities Available
          </span>
        </div>

        {/* 4 Feature Rounded Icon Tiles (Red Noir Accent) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
          {/* 1. Video Tile */}
          <button
            onClick={() => setActiveTab('video')}
            className={`relative p-3.5 rounded-xl text-left transition-all duration-200 border flex flex-col justify-between ${
              activeTab === 'video'
                ? 'border-[#ef233c] bg-[#ef233c]/15 shadow-[0_0_20px_rgba(239,35,60,0.25)]'
                : 'border-white/10 bg-black/40 hover:border-white/20'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#ef233c] to-[#990012] text-white flex items-center justify-center shadow-md mb-2">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold font-manrope text-white">Video</div>
              <div className="text-[10px] text-zinc-400 line-clamp-1">Best quality MP4</div>
            </div>
          </button>

          {/* 2. Audio Tile */}
          <button
            onClick={() => setActiveTab('audio')}
            disabled={!media.has_audio}
            className={`relative p-3.5 rounded-xl text-left transition-all duration-200 border flex flex-col justify-between ${
              !media.has_audio
                ? 'opacity-30 cursor-not-allowed border-transparent'
                : activeTab === 'audio'
                ? 'border-[#ef233c] bg-[#ef233c]/15 shadow-[0_0_20px_rgba(239,35,60,0.25)]'
                : 'border-white/10 bg-black/40 hover:border-white/20'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0D9488] to-[#10B981] text-white flex items-center justify-center shadow-md mb-2">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold font-manrope text-white">Audio</div>
              <div className="text-[10px] text-zinc-400 line-clamp-1">
                {media.has_audio ? 'MP3 320k' : 'No audio'}
              </div>
            </div>
          </button>

          {/* 3. Thumbnail Tile */}
          <button
            onClick={() => setActiveTab('thumbnail')}
            className={`relative p-3.5 rounded-xl text-left transition-all duration-200 border flex flex-col justify-between ${
              activeTab === 'thumbnail'
                ? 'border-[#ef233c] bg-[#ef233c]/15 shadow-[0_0_20px_rgba(239,35,60,0.25)]'
                : 'border-white/10 bg-black/40 hover:border-white/20'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#EA580C] to-[#F59E0B] text-white flex items-center justify-center shadow-md mb-2">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold font-manrope text-white">Cover Art</div>
              <div className="text-[10px] text-zinc-400 line-clamp-1">HD Poster</div>
            </div>
          </button>

          {/* 4. All in One Tile */}
          <button
            onClick={() => setActiveTab('all_in_one')}
            className={`relative p-3.5 rounded-xl text-left transition-all duration-200 border flex flex-col justify-between ${
              activeTab === 'all_in_one'
                ? 'border-[#ef233c] bg-[#ef233c]/15 shadow-[0_0_20px_rgba(239,35,60,0.25)]'
                : 'border-white/10 bg-black/40 hover:border-white/20'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#E11D48] to-[#F43F5E] text-white flex items-center justify-center shadow-md mb-2">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold font-manrope text-white">All in One</div>
              <div className="text-[10px] text-zinc-400 line-clamp-1">Bundle as ZIP</div>
            </div>
          </button>
        </div>

        {/* Guest Download Limit Status / Unlimited Announcement */}
        {!isAuthenticated ? (
          <div className="mb-4 p-3 rounded-xl bg-zinc-900/90 border border-white/10 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-zinc-300 font-medium">
                Guest Downloads: <strong className="text-white font-bold">{Math.min(guestDownloadsCount, guestLimit)} / {guestLimit} used</strong>
              </span>
            </div>
            {onOpenAuth && (
              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="text-[11px] font-bold text-[#ef233c] hover:underline cursor-pointer flex items-center gap-1"
              >
                Sign In for Unlimited →
              </button>
            )}
          </div>
        ) : (
          <div className="mb-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-400 font-medium">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Unlimited Lossless Downloads Active</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">UNLIMITED</span>
          </div>
        )}

        {/* Tab Content Display */}
        <div className="min-h-[220px]">
          {/* TAB 1: VIDEO FORMATS */}
          {activeTab === 'video' && (
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {media.video_formats.map((fmt) => {
                const isSelected = selectedVideo?.format_id === fmt.format_id;
                return (
                  <div
                    key={fmt.format_id}
                    onClick={() => setSelectedVideo(fmt)}
                    className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'border-[#ef233c] bg-[#ef233c]/15 shadow-md shadow-[#ef233c]/20'
                        : 'border-white/10 bg-black/40 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-[#ef233c] bg-[#ef233c] text-white'
                            : 'border-zinc-600'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3 fill-current" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white font-manrope">
                            {fmt.resolution}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/10 text-zinc-300">
                            {fmt.ext.toUpperCase()}
                          </span>
                          {fmt.fps >= 50 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#ef233c]/20 text-red-400">
                              {fmt.fps} FPS
                            </span>
                          )}
                          {fmt.hdr && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                              HDR
                            </span>
                          )}
                          {fmt.is_recommended && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ef233c] text-white flex items-center gap-1 shadow-sm">
                              <Sparkles className="w-3 h-3" /> Recommended
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-400">
                          Codec: {fmt.codec}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-white">
                        {formatBytes(fmt.size_bytes)}
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        {fmt.size_bytes ? 'Estimated' : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: AUDIO FORMATS */}
          {activeTab === 'audio' && (
            <div className="space-y-2.5">
              {media.audio_formats.map((audio) => {
                const isSelected = selectedAudio?.audio_id === audio.audio_id;
                return (
                  <div
                    key={audio.audio_id}
                    onClick={() => setSelectedAudio(audio)}
                    className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'border-[#ef233c] bg-[#ef233c]/15 shadow-md shadow-[#ef233c]/20'
                        : 'border-white/10 bg-black/40 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-[#ef233c] bg-[#ef233c] text-white'
                            : 'border-zinc-600'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3 fill-current" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white font-manrope">
                            {audio.title}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ef233c]/20 text-red-400">
                            {audio.badge}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-400">
                          Bitrate: {audio.bitrate} • Formatted with Metadata
                        </span>
                      </div>
                    </div>
                    <div className="text-right font-bold text-xs text-white">
                      {formatBytes(audio.size_bytes)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: THUMBNAILS */}
          {activeTab === 'thumbnail' && (
            <div className="grid grid-cols-2 gap-3">
              {media.thumbnails.map((thumb) => {
                const isSelected = selectedThumb?.thumb_id === thumb.thumb_id;
                return (
                  <div
                    key={thumb.thumb_id}
                    onClick={() => setSelectedThumb(thumb)}
                    className={`p-3 rounded-xl cursor-pointer border flex flex-col items-center text-center transition-all ${
                      isSelected
                        ? 'border-[#ef233c] bg-[#ef233c]/15 shadow-md shadow-[#ef233c]/20'
                        : 'border-white/10 bg-black/40 hover:bg-white/5'
                    }`}
                  >
                    <img
                      src={thumb.url}
                      alt={thumb.resolution}
                      className="w-full h-24 object-cover rounded-lg mb-2 shadow-sm"
                    />
                    <span className="text-xs font-bold text-white font-manrope">
                      {thumb.resolution}
                    </span>
                    <span className="text-[10px] text-zinc-400">JPG Image</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: ALL IN ONE */}
          {activeTab === 'all_in_one' && (
            <div className="p-4 rounded-xl bg-[#ef233c]/10 border border-[#ef233c]/30 text-white">
              <div className="flex items-center gap-2 font-bold text-sm text-[#ef233c] mb-2 font-manrope">
                <Layers className="w-5 h-5" /> One Link, Multiple Downloads
              </div>
              <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                DownZaro will download the highest quality MP4 video, extract crystal-clear 320kbps MP3 audio, and package them together with the HD thumbnail into a single convenient ZIP archive.
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
                <div className="p-2 rounded-lg bg-black/50 border border-white/10">
                  🎥 Best Video
                </div>
                <div className="p-2 rounded-lg bg-black/50 border border-white/10">
                  🎵 320k MP3
                </div>
                <div className="p-2 rounded-lg bg-black/50 border border-white/10">
                  🖼️ HD Cover
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Download Trigger Button */}
      <button
        onClick={handleDownloadClick}
        disabled={isDownloading}
        className="w-full mt-6 py-4 rounded-full font-bold text-sm uppercase tracking-wider text-white bg-[#ef233c] hover:bg-red-700 shadow-[0_0_30px_rgba(239,35,60,0.35)] hover:shadow-[0_0_40px_rgba(239,35,60,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transform active:scale-98 font-manrope"
      >
        <Download className="w-4 h-4" />
        <span>
          {activeTab === 'video' && `Download Video (${selectedVideo?.resolution || '1080p'})`}
          {activeTab === 'audio' && `Extract & Download MP3 (${selectedAudio?.bitrate || '320 kbps'})`}
          {activeTab === 'thumbnail' && 'Download High-Res Thumbnail'}
          {activeTab === 'all_in_one' && 'Download All-in-One ZIP Bundle'}
        </span>
        <ArrowRight className="w-4 h-4 ml-1" />
      </button>
    </div>
  );
};
