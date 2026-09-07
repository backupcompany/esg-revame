import React, { useState } from 'react';
import { SustainabilityGalleryItem } from '../types';
import {
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  ZoomIn,
  X,
  Share2,
  Check,
  Building2,
  Award
} from 'lucide-react';

interface SustainabilityGalleryProps {
  items: SustainabilityGalleryItem[];
}

export const SustainabilityGallery: React.FC<SustainabilityGalleryProps> = ({ items }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [activeItem, setActiveItem] = useState<SustainabilityGalleryItem | null>(null);
  const [copied, setCopied] = useState(false);

  const categories = [
    'Semua',
    'Energi Bersih',
    'Manajemen Limbah',
    'Konservasi Air',
    'K3 & Sosial',
    'Fasilitas Hijau'
  ];

  const filteredItems = items.filter(item => {
    return selectedCategory === 'Semua' || item.category === selectedCategory;
  });

  const handleShare = () => {
    if (activeItem) {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section id="galeri" className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#0f5238] dark:text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dokumentasi Visual Rumah Sakit Hijau</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            Galeri Transformasi & Fasilitas Berkelanjutan
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 max-w-2xl">
            Bukti visual nyata dari program retrofit energi surya, pengolahan limbah sirkular, dan pelestarian lingkungan di jaringan rumah sakit Siloam.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#0f5238] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <div
            key={item.id}
            onClick={() => setActiveItem(item)}
            className="group relative bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            {/* Image Container with Gradient Overlay */}
            <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-900">
              <img
                src={item.imageUrl}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              {/* Dynamic Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Category Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-500/30 rounded-md text-[10px] font-black uppercase tracking-wider">
                  {item.category}
                </span>
                <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md text-white rounded-md text-[10px] font-bold">
                  {item.year}
                </span>
              </div>

              {/* Zoom Action Icon */}
              <div className="absolute top-3 right-3 w-7 h-7 rounded-md bg-black/50 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                <ZoomIn className="w-3.5 h-3.5" />
              </div>

              {/* Metric Tag overlay */}
              {item.metricTag && (
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-emerald-950/80 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-xs font-black shadow-md flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>{item.metricTag}</span>
                </div>
              )}
            </div>

            {/* Content Details */}
            <div className="p-5 space-y-2.5 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{item.hospitalUnit}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0f5238] dark:group-hover:text-emerald-400 transition-colors leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {item.caption}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-[#0f5238] dark:text-emerald-400">
                <span>Lihat Detail Foto</span>
                <ZoomIn className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Layers className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Tidak ada dokumentasi pada kategori ini</p>
          <p className="text-xs text-slate-400">Pilih kategori lain untuk melihat foto fasilitas lainnya.</p>
        </div>
      )}

      {/* Lightbox Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col text-left">
            {/* Modal Image */}
            <div className="relative aspect-16/9 w-full bg-black overflow-hidden">
              <img
                src={activeItem.imageUrl}
                alt={activeItem.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setActiveItem(null)}
                className="absolute top-4 right-4 p-2 rounded-md bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="px-2.5 py-1 bg-[#0f5238]/90 text-emerald-200 backdrop-blur-md rounded-md text-xs font-black uppercase">
                  {activeItem.category}
                </span>
                {activeItem.metricTag && (
                  <span className="px-2.5 py-1 bg-white/20 text-white backdrop-blur-md rounded-md text-xs font-bold">
                    {activeItem.metricTag}
                  </span>
                )}
              </div>
            </div>

            {/* Modal Description */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                    <Building2 className="w-4 h-4" />
                    <span>{activeItem.hospitalUnit}</span>
                    <span>•</span>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Tahun {activeItem.year}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {activeItem.title}
                  </h3>
                </div>

                <button
                  onClick={handleShare}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 shrink-0 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                  <span>{copied ? 'Tersalin!' : 'Bagikan'}</span>
                </button>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/60">
                {activeItem.caption}
              </p>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveItem(null)}
                  className="px-5 py-2.5 rounded-lg bg-[#0f5238] hover:bg-[#0f5238]/90 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Tutup Galeri
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
