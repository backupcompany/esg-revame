import React, { useState } from 'react';
import { CURATED_IMAGE_LIBRARY, CuratedImagePreset } from '../data/seedNewsletter';
import { X, Search, Check, Image as ImageIcon, ExternalLink, Sparkles } from 'lucide-react';

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  currentImageUrl?: string;
  title?: string;
}

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  currentImageUrl,
  title = 'Pilih Gambar Berkualitas Tinggi'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [customUrl, setCustomUrl] = useState(currentImageUrl || '');
  const [previewError, setPreviewError] = useState(false);

  if (!isOpen) return null;

  const categories = ['Semua', 'Rumah Sakit & Fasilitas', 'Energi Bersih', 'Logistik & Cold Chain', 'Sosial & K3', 'Sirkularitas & Farmasi', 'Konservasi & Alam', 'Tata Kelola & Data'];

  const filteredImages = CURATED_IMAGE_LIBRARY.filter(img => {
    const matchesCat = selectedCategory === 'Semua' || img.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleApplyCustom = () => {
    if (customUrl.trim()) {
      onSelectImage(customUrl.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl text-left">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0f5238] to-emerald-500 flex items-center justify-center text-white shadow-xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih foto kurasi resolusi tinggi berstandar rumah sakit kelas dunia atau masukkan URL gambar kustom.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom URL Bar */}
        <div className="px-5 sm:px-6 py-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="url"
              placeholder="Atau tempel link URL foto langsung (e.g. Unsplash, CDN RS Siloam)..."
              value={customUrl}
              onChange={e => {
                setCustomUrl(e.target.value);
                setPreviewError(false);
              }}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f5238] focus:ring-1 focus:ring-[#0f5238]"
            />
            {customUrl && (
              <button
                type="button"
                onClick={() => setCustomUrl('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleApplyCustom}
            disabled={!customUrl.trim()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0f5238] hover:bg-[#0f5238]/90 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Gunakan URL Ini</span>
          </button>
        </div>

        {/* Search & Categories */}
        <div className="p-5 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari gambar kurasi (surya, limbah, taman, k3)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f5238]"
              />
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{filteredImages.length} Foto Siap Pakai</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0f5238] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Curated Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map(img => {
            const isSelected = currentImageUrl === img.url || customUrl === img.url;
            return (
              <div
                key={img.id}
                onClick={() => {
                  setCustomUrl(img.url);
                  onSelectImage(img.url);
                  onClose();
                }}
                className={`group relative rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#0f5238] ring-2 ring-[#0f5238]/30 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-[#0f5238]/60 hover:shadow-lg'
                }`}
              >
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={img.url}
                    alt={img.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                    {img.category}
                  </span>

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#0f5238] text-white flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0f5238] dark:group-hover:text-emerald-400 line-clamp-1">
                    {img.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                    {img.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between text-xs text-slate-500">
          <span>Resolusi tinggi 1600px • Lisensi bebas royalti komersial</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
