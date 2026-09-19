import React, { useState, useMemo } from 'react';
import { HistoryItem } from '../../utils/types';
import { formatBytes } from '../../utils/formatters';
import {
  Search,
  Trash2,
  ExternalLink,
  Copy,
  RotateCcw,
  Check,
  FileText,
  Image as ImageIcon,
  Music,
  Film,
  DownloadCloud,
} from 'lucide-react';

interface HistoryPanelProps {
  history: HistoryItem[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onRedownload: (url: string) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onRemoveItem,
  onClearAll,
  onRedownload,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter & search history items
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.platform_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.quality.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [history, searchQuery]);

  const handleCopyLink = (item: HistoryItem) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-fade-up">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 mb-8 border-b border-white/10">
        {/* Top-Left: Page Title */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white font-manrope tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#ef233c]/10 border border-[#ef233c]/30 text-[#ef233c]">
              <DownloadCloud className="w-6 h-6" />
            </div>
            Download History
          </h2>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 font-manrope">
            {history.length} items
          </span>
        </div>

        {/* Center-Top: Rounded Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search download history..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-zinc-950/80 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#ef233c] focus:shadow-[0_0_15px_rgba(239,35,60,0.2)] transition-all font-inter"
          />
        </div>

        {/* Top-Right: Clear All Action */}
        {history.length > 0 && (
          <button
            onClick={onClearAll}
            className="self-end md:self-auto px-4 py-2 rounded-full text-xs font-bold text-red-400 hover:text-white hover:bg-[#ef233c] border border-red-500/30 transition-all flex items-center gap-1.5 cursor-pointer font-manrope"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear all
          </button>
        )}
      </div>

      {/* Empty State */}
      {history.length === 0 ? (
        <div className="min-h-[380px] flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-zinc-950/40 border border-white/5">
          {/* Centered Icon Cluster */}
          <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
            {/* Clapperboard / Video */}
            <div className="absolute top-2 left-6 p-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 transform -rotate-12 shadow-lg">
              <Film className="w-6 h-6" />
            </div>
            {/* Image */}
            <div className="absolute top-2 right-6 p-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 transform rotate-12 shadow-lg">
              <ImageIcon className="w-6 h-6" />
            </div>
            {/* Audio / Music */}
            <div className="absolute bottom-2 left-8 p-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 transform -rotate-6 shadow-lg">
              <Music className="w-6 h-6" />
            </div>
            {/* Document */}
            <div className="absolute bottom-2 right-8 p-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 transform rotate-6 shadow-lg">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          {/* Text */}
          <p className="text-white font-semibold text-lg font-manrope">
            Your downloaded files will appear here
          </p>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm font-inter">
            Paste a link on the Home page to start downloading media at ultra-fast speeds.
          </p>
        </div>
      ) : filteredHistory.length === 0 ? (
        /* No Search Results */
        <div className="text-center py-16 text-zinc-400">
          <p className="text-base font-semibold">No results found for "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-xs font-bold text-[#ef233c] hover:underline cursor-pointer"
          >
            Clear search
          </button>
        </div>
      ) : (
        /* History Items List */
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-gradient-to-b from-zinc-900/60 to-black/80 border border-white/10 backdrop-blur-xl shadow-lg hover:border-white/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              {/* Left: Thumbnail & Details */}
              <div className="flex items-center gap-4 min-w-0">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-16 h-12 rounded-xl object-cover shrink-0 bg-zinc-800 border border-white/10 shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-16 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-zinc-400">
                    <Film className="w-6 h-6" />
                  </div>
                )}

                <div className="min-w-0">
                  <h4
                    dir="auto"
                    className="text-sm font-bold text-white truncate font-manrope"
                    title={item.title}
                  >
                    {item.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-zinc-400 font-inter">
                    <span className="font-semibold px-2 py-0.5 rounded-full bg-[#ef233c]/15 text-[#ef233c] border border-[#ef233c]/20 text-[10px]">
                      {item.platform_name}
                    </span>
                    <span>•</span>
                    <span className="font-medium text-zinc-300">{item.quality}</span>
                    {item.size_bytes && (
                      <>
                        <span>•</span>
                        <span>{formatBytes(item.size_bytes)}</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="text-[11px] text-zinc-500">{item.date}</span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={() => onRedownload(item.url)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Re-download"
                  aria-label="Re-download this video"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleCopyLink(item)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Copy media URL"
                  aria-label="Copy media URL"
                >
                  {copiedId === item.id ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Open source URL"
                  aria-label="Open original source URL"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Remove from history"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

