import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Zap,
  AlertCircle,
  Film,
  Music,
  Lock,
  RefreshCw,
} from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '../ui/navigation-menu';

interface FaqItem {
  q: string;
  a: string;
  category: 'platforms' | 'formats' | 'privacy' | 'troubleshooting';
  tag: string;
}

export const FaqAccordion: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      q: 'Which platforms are supported by DownZaro?',
      a: 'DownZaro supports YouTube, Instagram (Reels, Stories & Posts), TikTok (without watermark), Facebook, X (formerly Twitter), Reddit, Twitch clips, Vimeo, Dailymotion, SoundCloud, and over 1,000+ public video websites powered by our core extraction engine.',
      category: 'platforms',
      tag: '1,000+ Sites',
    },
    {
      q: 'Can I download audio tracks as 320kbps MP3?',
      a: 'Yes! DownZaro provides studio-quality 320 kbps, 192 kbps, and 128 kbps MP3 conversion as well as original AAC/M4A streams, complete with embedded ID3 metadata and HD album cover artwork.',
      category: 'formats',
      tag: 'Lossless Audio',
    },
    {
      q: 'Is DownZaro completely free to use?',
      a: 'Yes, DownZaro is 100% free with no subscription, no hidden paywalls, and no intrusive advertisements, popups, or third-party tracking scripts.',
      category: 'privacy',
      tag: 'Zero Ads',
    },
    {
      q: 'Why does a download sometimes fail or take longer?',
      a: 'Downloads can fail if a video is set to private, age-restricted requiring account authentication, or DRM protected (such as Netflix or Spotify). DownZaro continuously updates its cloud extraction engines for maximum reliability.',
      category: 'troubleshooting',
      tag: 'Troubleshooting',
    },
    {
      q: 'Are downloaded files saved or tracked on your servers?',
      a: 'No. Temporary media files generated during format merging are stored in isolated temporary directories and automatically wiped within 30 minutes after delivery. We never log URLs or personal IP addresses.',
      category: 'privacy',
      tag: 'Zero Logs',
    },
    {
      q: 'Can I download YouTube playlists or channels?',
      a: 'To guarantee instant conversion speeds and protect server stability, DownZaro processes the single video URL provided. If you paste a watch link with playlist parameters, only that single video is fetched.',
      category: 'platforms',
      tag: 'Single Stream',
    },
    {
      q: 'How does 4K & 1080p video muxing work?',
      a: 'YouTube and modern video platforms store high-resolution video and audio as separate streams. DownZaro downloads both in parallel and uses a native cloud FFmpeg 7.1 engine to mux them into a single high-bitrate MP4 file seamlessly.',
      category: 'formats',
      tag: 'FFmpeg Muxer',
    },
    {
      q: 'Can I install DownZaro as an app on my phone or Mac?',
      a: 'Yes! DownZaro is a Progressive Web App (PWA). Click the "Install App" button in the navigation bar to install it with native offline caching on iOS (Add to Home Screen), Android, macOS, and Windows.',
      category: 'troubleshooting',
      tag: 'PWA Support',
    },
  ];

  const filteredFaqs = selectedCategory === 'all'
    ? faqs
    : faqs.filter((faq) => faq.category === selectedCategory);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 max-w-5xl mx-auto border-t border-white/5 relative z-10">
      {/* Section Header */}
      <div className="text-center mb-10 animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4">
          <HelpCircle className="w-3.5 h-3.5 text-[#ef233c]" />
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider font-manrope">
            Frequently Asked Questions
          </span>
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight font-manrope mb-4">
          Answers for <span className="text-[#ef233c]">Every Question</span>
        </h2>
        <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
          Explore quick guides on video formats, high-speed audio extraction, platform support, and server security.
        </p>
      </div>

      {/* Navigation Menu Category Hub */}
      <div className="flex justify-center mb-10">
        <NavigationMenu viewport={false} className="z-40">
          <NavigationMenuList className="flex-wrap gap-2 justify-center bg-black/60 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-xl">
            {/* All Questions */}
            <NavigationMenuItem>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`${navigationMenuTriggerStyle()} ${
                  selectedCategory === 'all'
                    ? 'bg-[#ef233c] text-white hover:bg-[#ef233c] hover:text-white'
                    : 'bg-transparent text-zinc-300 hover:bg-white/10 hover:text-white'
                } rounded-xl px-3.5 py-1.5 text-xs font-semibold font-manrope transition-all cursor-pointer`}
              >
                All Questions ({faqs.length})
              </button>
            </NavigationMenuItem>

            {/* Supported Platforms Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger
                className={`${
                  selectedCategory === 'platforms'
                    ? 'bg-[#ef233c]/20 text-[#ef233c] border border-[#ef233c]/40'
                    : 'bg-transparent text-zinc-300 hover:bg-white/10 hover:text-white'
                } rounded-xl px-3.5 py-1.5 text-xs font-semibold font-manrope transition-all cursor-pointer`}
              >
                <Film className="w-3.5 h-3.5 mr-1.5 text-[#ef233c]" />
                Platforms
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[320px] sm:w-[400px] p-4 bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800 rounded-2xl shadow-2xl space-y-2">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-manrope">
                    Supported Platforms
                  </div>
                  <NavigationMenuLink asChild>
                    <button
                      onClick={() => {
                        setSelectedCategory('platforms');
                        setOpenIndex(0);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
                    >
                      <div className="font-semibold text-white text-xs group-hover:text-[#ef233c] flex items-center justify-between">
                        <span>YouTube, TikTok, Reels & 1,000+ Sites</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ef233c]/20 text-[#ef233c]">Popular</span>
                      </div>
                      <p className="text-zinc-400 text-xs mt-1 leading-snug">
                        Discover which sites are fully compatible with DownZaro.
                      </p>
                    </button>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <button
                      onClick={() => {
                        setSelectedCategory('platforms');
                        setOpenIndex(1);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
                    >
                      <div className="font-semibold text-white text-xs group-hover:text-[#ef233c]">
                        Playlists & Channels
                      </div>
                      <p className="text-zinc-400 text-xs mt-1 leading-snug">
                        How DownZaro handles single streams from playlist links.
                      </p>
                    </button>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Formats & Quality Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger
                className={`${
                  selectedCategory === 'formats'
                    ? 'bg-[#ef233c]/20 text-[#ef233c] border border-[#ef233c]/40'
                    : 'bg-transparent text-zinc-300 hover:bg-white/10 hover:text-white'
                } rounded-xl px-3.5 py-1.5 text-xs font-semibold font-manrope transition-all cursor-pointer`}
              >
                <Music className="w-3.5 h-3.5 mr-1.5 text-[#ef233c]" />
                Audio & Video Formats
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[320px] sm:w-[400px] p-4 bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800 rounded-2xl shadow-2xl space-y-2">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-manrope">
                    Audio & Video Options
                  </div>
                  <NavigationMenuLink asChild>
                    <button
                      onClick={() => {
                        setSelectedCategory('formats');
                        setOpenIndex(0);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
                    >
                      <div className="font-semibold text-white text-xs group-hover:text-[#ef233c] flex items-center justify-between">
                        <span>320kbps MP3 & AAC Audio</span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <p className="text-zinc-400 text-xs mt-1 leading-snug">
                        Studio-grade audio extraction with album artwork.
                      </p>
                    </button>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <button
                      onClick={() => {
                        setSelectedCategory('formats');
                        setOpenIndex(1);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
                    >
                      <div className="font-semibold text-white text-xs group-hover:text-[#ef233c]">
                        4K / 1080p FFmpeg Muxing
                      </div>
                      <p className="text-zinc-400 text-xs mt-1 leading-snug">
                        Lossless video and audio stream combining in real-time.
                      </p>
                    </button>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Privacy & Security Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger
                className={`${
                  selectedCategory === 'privacy'
                    ? 'bg-[#ef233c]/20 text-[#ef233c] border border-[#ef233c]/40'
                    : 'bg-transparent text-zinc-300 hover:bg-white/10 hover:text-white'
                } rounded-xl px-3.5 py-1.5 text-xs font-semibold font-manrope transition-all cursor-pointer`}
              >
                <Lock className="w-3.5 h-3.5 mr-1.5 text-[#ef233c]" />
                Privacy & Trust
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[320px] sm:w-[400px] p-4 bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800 rounded-2xl shadow-2xl space-y-2">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-manrope">
                    Privacy Guarantee
                  </div>
                  <NavigationMenuLink asChild>
                    <button
                      onClick={() => {
                        setSelectedCategory('privacy');
                        setOpenIndex(0);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
                    >
                      <div className="font-semibold text-white text-xs group-hover:text-[#ef233c] flex items-center justify-between">
                        <span>Zero Logs & Zero Ads Guarantee</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <p className="text-zinc-400 text-xs mt-1 leading-snug">
                        No trackers, no data retention, and no accounts required.
                      </p>
                    </button>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <button
                      onClick={() => {
                        setSelectedCategory('privacy');
                        setOpenIndex(1);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
                    >
                      <div className="font-semibold text-white text-xs group-hover:text-[#ef233c]">
                        30-Minute Auto File Wipe
                      </div>
                      <p className="text-zinc-400 text-xs mt-1 leading-snug">
                        Temporary muxed chunks are automatically destroyed.
                      </p>
                    </button>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Troubleshooting Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger
                className={`${
                  selectedCategory === 'troubleshooting'
                    ? 'bg-[#ef233c]/20 text-[#ef233c] border border-[#ef233c]/40'
                    : 'bg-transparent text-zinc-300 hover:bg-white/10 hover:text-white'
                } rounded-xl px-3.5 py-1.5 text-xs font-semibold font-manrope transition-all cursor-pointer`}
              >
                <Zap className="w-3.5 h-3.5 mr-1.5 text-[#ef233c]" />
                Troubleshooting
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[320px] sm:w-[400px] p-4 bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800 rounded-2xl shadow-2xl space-y-2">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-manrope">
                    Troubleshooting & Installation
                  </div>
                  <NavigationMenuLink asChild>
                    <button
                      onClick={() => {
                        setSelectedCategory('troubleshooting');
                        setOpenIndex(0);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
                    >
                      <div className="font-semibold text-white text-xs group-hover:text-[#ef233c] flex items-center justify-between">
                        <span>DRM & Age-Restricted Content</span>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <p className="text-zinc-400 text-xs mt-1 leading-snug">
                        Why private or subscription-only streams cannot be downloaded.
                      </p>
                    </button>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <button
                      onClick={() => {
                        setSelectedCategory('troubleshooting');
                        setOpenIndex(1);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
                    >
                      <div className="font-semibold text-white text-xs group-hover:text-[#ef233c]">
                        Install Progressive Web App (PWA)
                      </div>
                      <p className="text-zinc-400 text-xs mt-1 leading-snug">
                        How to install DownZaro directly on iOS, Android, Mac & PC.
                      </p>
                    </button>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isOpen
                  ? 'bg-gradient-to-b from-zinc-900/90 to-black/90 border-[#ef233c]/40 shadow-[0_0_25px_rgba(239,35,60,0.12)]'
                  : 'bg-black/50 border-white/10 hover:border-white/20'
              }`}
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 text-sm sm:text-base font-semibold text-white hover:text-[#ef233c] focus:outline-none transition-colors cursor-pointer font-manrope"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-zinc-300">
                    {faq.tag}
                  </span>
                  <span>{faq.q}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-[#ef233c]' : 'text-zinc-500'
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-6 pt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-white/5 font-inter">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reset Filter Button if filtered */}
      {selectedCategory !== 'all' && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setSelectedCategory('all')}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[#ef233c] transition-colors font-manrope cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Show all questions ({faqs.length})
          </button>
        </div>
      )}
    </section>
  );
};
