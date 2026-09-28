import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HeroCarouselSlide, GradientOverlayStyle } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Pause,
  Play,
  Award,
  Zap,
  Leaf,
  Users,
  ShieldCheck,
  Building2
} from 'lucide-react';

interface HeroCarouselProps {
  slides: HeroCarouselSlide[];
  onSelectArticle: (articleId: string) => void;
  onStartOnboarding: () => void;
  onNavigateToVendor: () => void;
  partnerCount?: number;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  slides,
  onSelectArticle,
  onStartOnboarding,
  onNavigateToVendor,
  partnerCount,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeSlides = slides.filter(s => s.isPublished);
  const currentSlide = activeSlides[currentIndex] || activeSlides[0];

  useEffect(() => {
    if (!isPlaying || isHovered || activeSlides.length <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeSlides.length);
    }, 6500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isHovered, activeSlides.length, currentIndex]);

  if (!currentSlide) return null;

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % activeSlides.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const handleCtaAction = (actionType: string, targetArticleId?: string) => {
    if (actionType === 'article' && targetArticleId) {
      onSelectArticle(targetArticleId);
    } else if (actionType === 'onboarding') {
      onStartOnboarding();
    } else if (actionType === 'vendor') {
      onNavigateToVendor();
    } else if (targetArticleId) {
      onSelectArticle(targetArticleId);
    } else {
      onStartOnboarding();
    }
  };

  // Gradient Overlay Presets with multi-directional deep contrast
  const getGradientClass = (style: GradientOverlayStyle) => {
    switch (style) {
      case 'sapphire':
        return 'from-slate-950 via-sky-950/85 to-indigo-950/70';
      case 'forest':
        return 'from-slate-950 via-emerald-950/90 to-teal-950/70';
      case 'sunset':
        return 'from-slate-950 via-amber-950/85 to-rose-950/70';
      case 'dark':
        return 'from-slate-950 via-slate-900/90 to-slate-950/80';
      case 'emerald':
      default:
        return 'from-slate-950 via-[#0a3826]/90 to-emerald-950/75';
    }
  };

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-xl border border-slate-800/80 bg-slate-950 select-none group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Mobile: height follows content (fixed h clips impact badge). Desktop heights unchanged. */}
      <div className="relative w-full min-h-0 h-auto overflow-visible md:h-[580px] md:overflow-hidden lg:h-[620px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full min-h-full"
          >
            <img
              src={currentSlide.imageUrl}
              alt={currentSlide.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
            {/* Multi-layer Gradient Overlays for High-Contrast Readability */}
            <div
              className={`absolute inset-0 bg-gradient-to-r ${getGradientClass(
                currentSlide.overlayGradient
              )} mix-blend-multiply opacity-95`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            <div className="absolute inset-0 bg-radial-at-c from-transparent via-slate-950/40 to-slate-950/80" />
          </motion.div>
        </AnimatePresence>

        {/* Floating Ambient Glow */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Content Container — md+: fill fixed height; mobile: stack & grow */}
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-10 lg:px-12 py-8 sm:py-14 flex flex-col gap-5 sm:gap-6 md:gap-0 md:h-full md:justify-between text-left">
          {/* Top Bar inside Carousel */}
          <div className="flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-2.5 sm:px-3 py-1 bg-white/15 backdrop-blur-md border border-white/25 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-200 shadow-sm flex items-center gap-1.5 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse shrink-0" />
                <span className="leading-snug">{currentSlide.badgeText}</span>
              </span>
              <span className="hidden sm:inline-block px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-md text-[11px] font-semibold text-slate-300 border border-white/10">
                {currentSlide.category}
              </span>
            </div>

            {/* Slide Counter & Autoplay Toggle */}
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/15 rounded-md px-3 py-1 text-xs font-semibold text-slate-200 shrink-0">
              <span>
                {currentIndex + 1} / {activeSlides.length}
              </span>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title={isPlaying ? 'Jeda carousel' : 'Putar carousel otomatis'}
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Main Slide Content Animation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-end md:my-auto">
            <div className="lg:col-span-8 space-y-3 sm:space-y-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide.id + '_content'}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="space-y-3 sm:space-y-4"
                >
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15] max-w-3xl drop-shadow-md">
                    {currentSlide.title}
                  </h1>

                  <p className="text-sm sm:text-base lg:text-lg text-slate-200/90 leading-relaxed max-w-2xl font-normal drop-shadow-sm">
                    {currentSlide.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="pt-1 sm:pt-3 flex flex-col xs:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3.5">
                <button
                  onClick={() =>
                    handleCtaAction(currentSlide.ctaPrimaryAction, currentSlide.targetArticleId)
                  }
                  className="w-full sm:w-auto justify-center px-5 sm:px-7 py-3 min-h-12 rounded-lg bg-white hover:bg-emerald-50 text-[#0f5238] font-bold text-sm shadow-xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer group/btn"
                >
                  <span>{currentSlide.ctaPrimaryText}</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>

                {currentSlide.ctaSecondaryText && (
                  <button
                    onClick={() =>
                      handleCtaAction(currentSlide.ctaSecondaryAction || 'onboarding')
                    }
                    className="w-full sm:w-auto justify-center px-4 sm:px-6 py-3 min-h-12 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/25 backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>{currentSlide.ctaSecondaryText}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Hero Frosted Impact Badge (World-Class Metric Card) */}
            {currentSlide.impactBadge && (
              <div className="lg:col-span-4 bg-slate-900/60 backdrop-blur-xl border border-white/20 rounded-xl p-4 sm:p-7 text-left space-y-2 sm:space-y-3 shadow-2xl relative overflow-hidden group/metric">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  <span>Capaian Terverifikasi</span>
                  <Award className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                  {currentSlide.impactBadge.value}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-snug">
                  {currentSlide.impactBadge.label}
                </p>
                <div className="pt-2 sm:pt-3 border-t border-white/15 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span>
                    {partnerCount != null
                      ? `Gerakan ${partnerCount} Vendor RS Siloam`
                      : 'Gerakan Vendor RS Siloam'}
                  </span>
                  <span className="text-emerald-300 font-bold shrink-0">100% Real Impact</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar: Thumbnail Indicators & Slide Nav */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-white/10 shrink-0">
            {/* Thumbnail Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {activeSlides.map((slide, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'w-10 sm:w-12 bg-emerald-400 shadow-lg shadow-emerald-500/50'
                        : 'w-2 sm:w-2.5 bg-white/30 hover:bg-white/60'
                    }`}
                    title={`Slide ${idx + 1}: ${slide.title}`}
                  />
                );
              })}
            </div>

            {/* Arrow Controls */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handlePrev}
                className="w-9 h-9 rounded-lg bg-black/40 hover:bg-black/70 border border-white/15 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-md"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="w-9 h-9 rounded-lg bg-black/40 hover:bg-black/70 border border-white/15 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-md"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar (Visible when autoplay active) */}
      {isPlaying && !isHovered && activeSlides.length > 1 && (
        <motion.div
          key={currentIndex}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 6.5, ease: 'linear' }}
          className="h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 origin-left w-full"
        />
      )}
    </div>
  );
};
