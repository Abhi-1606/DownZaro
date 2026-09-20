import React from 'react';
import { InteractiveFolder } from '../ui/InteractiveFolder';
import {
  Film,
  Video,
  Play,
  Music,
  Headphones,
  Disc,
  Image as ImageIcon,
  Sparkles,
  Crop,
  FolderArchive,
  FileCheck,
  ShieldCheck,
  FolderOpen,
} from 'lucide-react';

export const MediaVaultSection: React.FC = () => {
  return (
    <section id="media-vault" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5 relative z-10 scroll-mt-24">
      <div className="text-center mb-14 sm:mb-16 animate-fade-up max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4 shadow-[0_0_20px_rgba(239,35,60,0.15)]">
          <FolderOpen className="w-3.5 h-3.5 text-[#ef233c]" />
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider font-manrope">
            Interactive Media Vault
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight font-manrope mb-4">
          One Engine. <span className="text-[#ef233c]">Every Format You Need.</span>
        </h2>
        <p className="text-zinc-400 text-sm md:text-base max-w-xl mx-auto font-inter font-light">
          Click any vault folder to reveal the formats, bitrates, and packages DownZaro generates seamlessly.
        </p>
      </div>

      {/* Interactive Folders Grid (Equally spaced across all 4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-stretch">
        {/* Folder 1: 4K Video */}
        <div className="flex flex-col items-center justify-between gap-4 p-6 rounded-3xl bg-zinc-950/50 border border-white/10 backdrop-blur-md hover:border-[#ef233c]/40 hover:bg-zinc-950/70 transition-all w-full">
          <div className="py-6">
            <InteractiveFolder
              size={1.15}
              color="#ef233c"
              label="4K VIDEO"
              items={[
                <div key="1" className="flex flex-col items-center justify-center text-center">
                  <Film className="w-5 h-5 text-[#ef233c] mb-1" />
                  <span className="text-[9px] font-bold text-white font-mono">2160p UHD</span>
                </div>,
                <div key="2" className="flex flex-col items-center justify-center text-center">
                  <Video className="w-5 h-5 text-red-400 mb-1" />
                  <span className="text-[9px] font-bold text-white font-mono">1080p 60fps</span>
                </div>,
                <div key="3" className="flex flex-col items-center justify-center text-center">
                  <Play className="w-5 h-5 text-rose-300 mb-1" />
                  <span className="text-[9px] font-bold text-white font-mono">Lossless Mux</span>
                </div>,
              ]}
            />
          </div>
          <div className="text-center">
            <h3 className="text-base font-bold text-white font-manrope">Ultra HD Video</h3>
            <p className="text-xs text-zinc-400 font-inter mt-1">4K & 1080p MP4 Streams</p>
          </div>
        </div>

        {/* Folder 2: Studio Audio */}
        <div className="flex flex-col items-center justify-between gap-4 p-6 rounded-3xl bg-zinc-950/50 border border-white/10 backdrop-blur-md hover:border-[#ff4d6d]/40 hover:bg-zinc-950/70 transition-all w-full">
          <div className="py-6">
            <InteractiveFolder
              size={1.15}
              color="#ff4d6d"
              label="320K AUDIO"
              items={[
                <div key="1" className="flex flex-col items-center justify-center text-center">
                  <Music className="w-5 h-5 text-pink-400 mb-1" />
                  <span className="text-[9px] font-bold text-white font-mono">320kbps MP3</span>
                </div>,
                <div key="2" className="flex flex-col items-center justify-center text-center">
                  <Headphones className="w-5 h-5 text-rose-400 mb-1" />
                  <span className="text-[9px] font-bold text-white font-mono">Lossless AAC</span>
                </div>,
                <div key="3" className="flex flex-col items-center justify-center text-center">
                  <Disc className="w-5 h-5 text-pink-300 mb-1" />
                  <span className="text-[9px] font-bold text-white font-mono">ID3 Metadata</span>
                </div>,
              ]}
            />
          </div>
          <div className="text-center">
            <h3 className="text-base font-bold text-white font-manrope">Studio Audio</h3>
            <p className="text-xs text-zinc-400 font-inter mt-1">High-Bitrate MP3 & M4A</p>
          </div>
        </div>

        {/* Folder 3: HD Artwork */}
        <div className="flex flex-col items-center justify-between gap-4 p-6 rounded-3xl bg-zinc-950/50 border border-white/10 backdrop-blur-md hover:border-[#b5179e]/40 hover:bg-zinc-950/70 transition-all w-full">
          <div className="py-6">
            <InteractiveFolder
              size={1.15}
              color="#b5179e"
              label="ARTWORK"
              items={[
                <div key="1" className="flex flex-col items-center justify-center text-center">
                  <ImageIcon className="w-5 h-5 text-fuchsia-400 mb-1" />
                  <span className="text-[9px] font-bold text-white font-mono">MaxRes Cover</span>
                </div>,
                <div key="2" className="flex flex-col items-center justify-center text-center">
                  <Sparkles className="w-5 h-5 text-purple-400 mb-1" />
                  <span className="text-[9px] font-bold text-white font-mono">Clean WebP</span>
                </div>,
                <div key="3" className="flex flex-col items-center justify-center text-center">
                  <Crop className="w-5 h-5 text-fuchsia-300 mb-1" />
                  <span className="text-[9px] font-bold text-white font-mono">Square Crop</span>
                </div>,
              ]}
            />
          </div>
          <div className="text-center">
            <h3 className="text-base font-bold text-white font-manrope">HD Artwork</h3>
            <p className="text-xs text-zinc-400 font-inter mt-1">Full-Res Poster & Covers</p>
          </div>
        </div>

        {/* Folder 4: All-in-One Package */}
        <div className="flex flex-col items-center justify-between gap-4 p-6 rounded-3xl bg-zinc-950/50 border border-white/10 backdrop-blur-md hover:border-amber-500/40 hover:bg-zinc-950/70 transition-all w-full">
          <div className="py-6">
            <InteractiveFolder
              size={1.15}
              color="#27272a"
              label="ALL-IN-ONE"
              items={[
                <div key="1" className="flex flex-col items-center justify-center text-center">
                  <FolderArchive className="w-5 h-5 text-amber-400 mb-1" />
                  <span className="text-[9px] font-bold text-white font-mono">ZIP Archive</span>
                </div>,
                <div key="2" className="flex flex-col items-center justify-center text-center">
                  <FileCheck className="w-5 h-5 text-emerald-400 mb-1" />
                  <span className="text-[9px] font-bold text-white font-mono">Video+Audio</span>
                </div>,
                <div key="3" className="flex flex-col items-center justify-center text-center">
                  <ShieldCheck className="w-5 h-5 text-blue-400 mb-1" />
                  <span className="text-[9px] font-bold text-white font-mono">1-Click Bundle</span>
                </div>,
              ]}
            />
          </div>
          <div className="text-center">
            <h3 className="text-base font-bold text-white font-manrope">Universal Bundles</h3>
            <p className="text-xs text-zinc-400 font-inter mt-1">Packaged ZIP with All Assets</p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-zinc-500 font-manrope mt-8">
        💡 Click any folder to toggle open/close • Hover over cards to inspect drifting elements
      </p>
    </section>
  );
};

export default MediaVaultSection;
