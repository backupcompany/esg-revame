import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../core/context/LanguageContext';
import {
  NewsletterArticle,
  PublicLearningGuide,
  PublicVendorSpotlight,
  NewsletterSubscriber,
  HeroCarouselSlide,
  SustainabilityGalleryItem,
  GradientOverlayStyle
} from '../types';
import { newsletterService } from '../services/newsletterService';
import { BaseCard } from '../../../core/ui/Cards';
import { Button } from '../../../core/ui/Button';
import { Input, TextArea } from '../../../core/ui/Form';
import { PLACEHOLDER_IMAGE } from '../../../core/ui/assets';
import { ImagePickerModal } from './ImagePickerModal';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  X,
  FileText,
  Sparkles,
  BookOpen,
  Users,
  Mail,
  Award,
  Globe,
  RefreshCw,
  Send,
  Save,
  Check,
  Image as ImageIcon,
  Sliders,
  Layers,
  ArrowUp,
  ArrowDown,
  LayoutTemplate,
  Camera,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Palette
} from 'lucide-react';

export const NewsletterCMSPanel: React.FC = () => {
  const { isId } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<
    'hero' | 'gallery' | 'articles' | 'spotlights' | 'learning' | 'subscribers'
  >('hero');

  const [heroSlides, setHeroSlides] = useState<HeroCarouselSlide[]>([]);
  const [galleryItems, setGalleryItems] = useState<SustainabilityGalleryItem[]>([]);
  const [articles, setArticles] = useState<NewsletterArticle[]>([]);
  const [spotlights, setSpotlights] = useState<PublicVendorSpotlight[]>([]);
  const [guides, setGuides] = useState<PublicLearningGuide[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Image Picker state
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [imagePickerTarget, setImagePickerTarget] = useState<
    'hero' | 'gallery' | 'article' | 'spotlight' | null
  >(null);
  const [imagePickerCurrentVal, setImagePickerCurrentVal] = useState<string>('');

  // Modal / Form state for Hero Slide
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [editingHeroSlide, setEditingHeroSlide] = useState<Partial<HeroCarouselSlide>>({
    title: '',
    subtitle: '',
    badgeText: 'ESG Horizon',
    category: 'Siloam Initiative',
    imageUrl: PLACEHOLDER_IMAGE,
    overlayGradient: 'emerald',
    impactBadge: {
      value: '',
      label: ''
    },
    ctaPrimaryText: 'Baca Selengkapnya',
    ctaPrimaryAction: 'article',
    ctaSecondaryText: 'Gabung Mitra Siloam',
    ctaSecondaryAction: 'onboarding',
    order: 1,
    isPublished: true
  });

  // Modal / Form state for Gallery Item
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [editingGalleryItem, setEditingGalleryItem] = useState<Partial<SustainabilityGalleryItem>>({
    title: '',
    hospitalUnit: '',
    category: 'Energi Bersih',
    imageUrl: PLACEHOLDER_IMAGE,
    caption: '',
    year: '',
    metricTag: '',
    isPublished: true
  });

  // Modal / Form state for Article
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Partial<NewsletterArticle>>({
    title: '',
    subtitle: '',
    category: 'Siloam Initiative',
    author: 'Tim Keberlanjutan Siloam Hospitals',
    authorRole: 'ESG Editor',
    edition: 'Edisi Agustus 2026',
    readTimeMinutes: 4,
    coverImageUrl: PLACEHOLDER_IMAGE,
    content: '',
    featured: false,
    isPublished: true,
    tags: [],
    impactHighlight: {
      metricValue: '',
      metricLabel: ''
    }
  });

  // Modal / Form state for Spotlight
  const [isSpotlightModalOpen, setIsSpotlightModalOpen] = useState(false);
  const [editingSpotlight, setEditingSpotlight] = useState<Partial<PublicVendorSpotlight>>({
    vendorName: '',
    industry: '',
    location: '',
    maturityLevel: 'Starter',
    badgeTitle: '',
    achievementSummary: '',
    metricAchieved: '',
    metricLabel: '',
    quote: '',
    quotePerson: '',
    facilityImageUrl: PLACEHOLDER_IMAGE,
    isPublished: true
  });

  // Modal / Form state for Guide
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<Partial<PublicLearningGuide>>({
    title: '',
    pillar: 'E',
    category: 'Efisiensi Energi',
    summary: '',
    content: '',
    keyTakeaways: ['Langkah 1...', 'Langkah 2...'],
    readTimeMinutes: 4,
    iconName: 'Zap',
    targetAudience: 'Untuk Pengelola Fasilitas & Publik'
  });

  const [tagInput, setTagInput] = useState('');
  const [takeawayInput, setTakeawayInput] = useState('');

  useEffect(() => {
    loadAllCMSData();
  }, []);

  const loadAllCMSData = async () => {
    setIsLoading(true);
    try {
      const [slides, gals, arts, spots, gds, subs] = await Promise.all([
        newsletterService.getHeroSlides(false),
        newsletterService.getSustainabilityGallery(undefined, false),
        newsletterService.getAllArticles(),
        newsletterService.getSpotlights(false),
        newsletterService.getPublicGuides(undefined, false),
        newsletterService.getSubscribers()
      ]);
      setHeroSlides(slides);
      setGalleryItems(gals);
      setArticles(arts);
      setSpotlights(spots);
      setGuides(gds);
      setSubscribers(subs);
    } finally {
      setIsLoading(false);
    }
  };

  // Image Picker Handlers
  const handleOpenImagePicker = (
    target: 'hero' | 'gallery' | 'article' | 'spotlight',
    currentUrl?: string
  ) => {
    setImagePickerTarget(target);
    setImagePickerCurrentVal(currentUrl || '');
    setIsImagePickerOpen(true);
  };

  const handleApplyPickedImage = (imageUrl: string) => {
    if (imagePickerTarget === 'hero') {
      setEditingHeroSlide(prev => ({ ...prev, imageUrl }));
    } else if (imagePickerTarget === 'gallery') {
      setEditingGalleryItem(prev => ({ ...prev, imageUrl }));
    } else if (imagePickerTarget === 'article') {
      setEditingArticle(prev => ({ ...prev, coverImageUrl: imageUrl }));
    } else if (imagePickerTarget === 'spotlight') {
      setEditingSpotlight(prev => ({ ...prev, facilityImageUrl: imageUrl }));
    }
  };

  // Hero Slide Actions
  const handleSaveHeroSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    await newsletterService.saveHeroSlide(editingHeroSlide);
    setIsHeroModalOpen(false);
    loadAllCMSData();
  };

  const handleDeleteHeroSlide = async (id: string) => {
    if (confirm('Yakin ingin menghapus slide carousel ini?')) {
      await newsletterService.deleteHeroSlide(id);
      loadAllCMSData();
    }
  };

  const handleTogglePublishHero = async (slide: HeroCarouselSlide) => {
    await newsletterService.saveHeroSlide({
      ...slide,
      isPublished: !slide.isPublished
    });
    loadAllCMSData();
  };

  // Gallery Actions
  const handleSaveGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await newsletterService.saveGalleryItem(editingGalleryItem);
    setIsGalleryModalOpen(false);
    loadAllCMSData();
  };

  const handleDeleteGalleryItem = async (id: string) => {
    if (confirm('Yakin ingin menghapus foto dokumentasi ini?')) {
      await newsletterService.deleteGalleryItem(id);
      loadAllCMSData();
    }
  };

  const handleTogglePublishGallery = async (item: SustainabilityGalleryItem) => {
    await newsletterService.saveGalleryItem({
      ...item,
      isPublished: !item.isPublished
    });
    loadAllCMSData();
  };

  // Article Actions
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    await newsletterService.saveArticle(editingArticle);
    setIsArticleModalOpen(false);
    loadAllCMSData();
  };

  const handleDeleteArticle = async (id: string) => {
    if (confirm('Yakin ingin menghapus artikel ini dari buletin publik?')) {
      await newsletterService.deleteArticle(id);
      loadAllCMSData();
    }
  };

  const handleTogglePublishArticle = async (article: NewsletterArticle) => {
    await newsletterService.saveArticle({
      ...article,
      isPublished: !article.isPublished
    });
    loadAllCMSData();
  };

  // Spotlight Actions
  const handleSaveSpotlight = async (e: React.FormEvent) => {
    e.preventDefault();
    await newsletterService.saveSpotlight(editingSpotlight);
    setIsSpotlightModalOpen(false);
    loadAllCMSData();
  };

  const handleDeleteSpotlight = async (id: string) => {
    if (confirm('Hapus profil spotlight mitra ini?')) {
      await newsletterService.deleteSpotlight(id);
      loadAllCMSData();
    }
  };

  // Guide Actions
  const handleSaveGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    await newsletterService.savePublicGuide(editingGuide);
    setIsGuideModalOpen(false);
    loadAllCMSData();
  };

  const handleDeleteGuide = async (id: string) => {
    if (confirm('Hapus modul panduan edukasi publik ini?')) {
      await newsletterService.deletePublicGuide(id);
      loadAllCMSData();
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* CMS Header */}
      <BaseCard padding="md" className="border-l-4 border-[#0f5238] bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isId ? 'Buletin' : 'Bulletin'}</h2>
            <p className="text-sm italic text-slate-600 dark:text-slate-300">{isId ? 'Slide, galeri, artikel, dan cerita mitra untuk halaman publik.' : 'Slides, gallery, articles, and partner stories for the public page.'}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={loadAllCMSData}
            >
              Perbarui Data
            </Button>
          </div>
        </div>
      </BaseCard>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('hero')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'hero'
              ? 'bg-[#0f5238] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <LayoutTemplate className="w-3.5 h-3.5" />
          <span>Carousel & Banner ({heroSlides.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('gallery')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'gallery'
              ? 'bg-[#0f5238] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Galeri Fasilitas ({galleryItems.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('articles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'articles'
              ? 'bg-[#0f5238] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Artikel & Berita ({articles.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('spotlights')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'spotlights'
              ? 'bg-[#0f5238] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Vendor Spotlight ({spotlights.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('learning')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'learning'
              ? 'bg-[#0f5238] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Edukasi Publik ({guides.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('subscribers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'subscribers'
              ? 'bg-[#0f5238] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Pelanggan Buletin ({subscribers.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: HERO CAROUSEL MANAGEMENT ================= */}
      {activeSubTab === 'hero' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Kelola Slide Hero Carousel Halaman Awal
              </h3>
              <p className="text-xs text-slate-500">
                Atur urutan gambar, gradien overlay, metrik dampak, dan tombol aksi untuk banner utama kelas dunia.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingHeroSlide({
                  title: '',
                  subtitle: '',
                  badgeText: 'ESG Headline',
                  category: 'Siloam Initiative',
                  imageUrl: PLACEHOLDER_IMAGE,
                  overlayGradient: 'emerald',
                  impactBadge: {
                    value: '',
                    label: ''
                  },
                  ctaPrimaryText: 'Baca Selengkapnya',
                  ctaPrimaryAction: 'onboarding',
                  order: heroSlides.length + 1,
                  isPublished: true
                });
                setIsHeroModalOpen(true);
              }}
            >
              Tambah Slide Baru
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {heroSlides.map((slide, idx) => (
              <div
                key={slide.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Slide Thumbnail Preview */}
                <div className="relative w-full md:w-48 aspect-video rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200 dark:border-slate-800">
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-black/70 text-white rounded text-[10px] font-bold">
                    Slide #{slide.order}
                  </div>
                  <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 bg-emerald-950/80 text-emerald-300 rounded text-[9px] font-extrabold uppercase">
                    {slide.overlayGradient} gradient
                  </div>
                </div>

                {/* Slide Details */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-[#0f5238] dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-extrabold rounded-full uppercase">
                      {slide.badgeText}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300 rounded-full">
                      {slide.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        slide.isPublished
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {slide.isPublished ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {slide.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {slide.subtitle}
                  </p>

                  {slide.impactBadge && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-bold text-[#0f5238] dark:text-emerald-400">
                        {slide.impactBadge.value}
                      </span>
                      <span>({slide.impactBadge.label})</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => handleTogglePublishHero(slide)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                      slide.isPublished
                        ? 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100'
                        : 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                    }`}
                  >
                    {slide.isPublished ? 'Sembunyikan' : 'Tayangkan'}
                  </button>

                  <button
                    onClick={() => {
                      setEditingHeroSlide(slide);
                      setIsHeroModalOpen(true);
                    }}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    title="Edit Slide"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteHeroSlide(slide.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                    title="Hapus Slide"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 2: SUSTAINABILITY GALLERY MANAGEMENT ================= */}
      {activeSubTab === 'gallery' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Kelola Galeri Transformasi & Fasilitas Hijau
              </h3>
              <p className="text-xs text-slate-500">
                Dokumentasi fotografi instalasi solar rooftop, pengolahan air limbah, dan ruang hijau di jaringan rumah sakit Siloam.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingGalleryItem({
                  title: '',
                  hospitalUnit: '',
                  category: 'Energi Bersih',
                  imageUrl: PLACEHOLDER_IMAGE,
                  caption: '',
                  year: '',
                  metricTag: '',
                  isPublished: true
                });
                setIsGalleryModalOpen(true);
              }}
            >
              Tambah Foto Fasilitas
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleryItems.map(item => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white rounded text-[10px] font-bold">
                    {item.category}
                  </div>
                  {item.metricTag && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-900/80 text-emerald-200 rounded text-[10px] font-bold">
                      {item.metricTag}
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">
                      {item.hospitalUnit} • {item.year}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mt-0.5">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {item.caption}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleTogglePublishGallery(item)}
                      className={`text-xs font-semibold cursor-pointer ${
                        item.isPublished ? 'text-slate-500' : 'text-emerald-600 font-bold'
                      }`}
                    >
                      {item.isPublished ? 'Tayang' : 'Disembunyikan'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingGalleryItem(item);
                          setIsGalleryModalOpen(true);
                        }}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Edit Foto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteGalleryItem(item.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Hapus Foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: ARTICLES MANAGEMENT ================= */}
      {activeSubTab === 'articles' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Daftar Artikel & Berita Buletin
              </h3>
              <p className="text-xs text-slate-500">
                Artikel yang ditayangkan di landing page publik untuk masyarakat dan mitra.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingArticle({
                  title: '',
                  subtitle: '',
                  category: 'Siloam Initiative',
                  author: 'Tim Keberlanjutan Siloam Hospitals',
                  authorRole: 'ESG Editor',
                  edition: 'Edisi Agustus 2026',
                  readTimeMinutes: 4,
                  coverImageUrl: PLACEHOLDER_IMAGE,
                  content: '',
                  featured: false,
                  isPublished: true,
                  tags: ['Siloam ESG'],
                  impactHighlight: {
                    metricValue: '',
                    metricLabel: ''
                  }
                });
                setIsArticleModalOpen(true);
              }}
            >
              Tulis Artikel Baru
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {articles.map(article => (
              <div
                key={article.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Cover Preview */}
                {article.coverImageUrl && (
                  <div className="w-full sm:w-32 aspect-video rounded-xl overflow-hidden bg-slate-900 shrink-0">
                    <img
                      src={article.coverImageUrl}
                      alt={article.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold rounded-full text-[#0f5238] dark:text-emerald-300">
                      {article.category}
                    </span>
                    {article.featured && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold rounded-full">
                        ⭐ Berita Utama
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        article.isPublished
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {article.isPublished ? 'Tayang (Published)' : 'Draft (Unpublished)'}
                    </span>
                    <span className="text-xs text-slate-400">• {article.publishedDate}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {article.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {article.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleTogglePublishArticle(article)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                      article.isPublished
                        ? 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100'
                        : 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                    }`}
                  >
                    {article.isPublished ? 'Sembunyikan' : 'Tayangkan'}
                  </button>

                  <button
                    onClick={async () => {
                      const full = await newsletterService.getArticleById(article.id);
                      setEditingArticle(full || article);
                      setIsArticleModalOpen(true);
                    }}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    title="Edit Artikel"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteArticle(article.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                    title="Hapus Artikel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: VENDOR SPOTLIGHT MANAGEMENT ================= */}
      {activeSubTab === 'spotlights' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Kelola Vendor Spotlight Publik
              </h3>
              <p className="text-xs text-slate-500">
                Sorotan kisah inspiratif dan testimoni pencapaian ESG mitra rantai pasok Siloam Hospitals.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingSpotlight({
                  vendorName: '',
                  industry: '',
                  location: '',
                  maturityLevel: 'Starter',
                  badgeTitle: '',
                  achievementSummary: '',
                  metricAchieved: '',
                  metricLabel: '',
                  quote: '',
                  quotePerson: '',
                  facilityImageUrl: PLACEHOLDER_IMAGE,
                  isPublished: true
                });
                setIsSpotlightModalOpen(true);
              }}
            >
              Tambah Spotlight Baru
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {spotlights.map(spot => (
              <div
                key={spot.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3"
              >
                {spot.facilityImageUrl && (
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900">
                    <img
                      src={spot.facilityImageUrl}
                      alt={spot.vendorName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold rounded-full">
                      {spot.maturityLevel} Tier Partner
                    </span>
                    <span className="text-xs text-slate-400">{spot.location}</span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {spot.vendorName}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">{spot.industry}</p>

                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                    {spot.achievementSummary}
                  </p>

                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-[#0f5238] dark:text-emerald-400">
                      {spot.metricAchieved}
                    </span>
                    <span className="text-xs text-slate-400">{spot.metricLabel}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      spot.isPublished ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {spot.isPublished ? 'Aktif Tayang' : 'Disembunyikan'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingSpotlight(spot);
                        setIsSpotlightModalOpen(true);
                      }}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSpotlight(spot.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: PUBLIC LEARNING GUIDES ================= */}
      {activeSubTab === 'learning' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Kelola Modul Siloam Public ESG Academy
              </h3>
              <p className="text-xs text-slate-500">
                Panduan praktis berformat micro-learning terbuka untuk publik dan mitra pemula.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingGuide({
                  title: '',
                  pillar: 'E',
                  category: 'Efisiensi Energi',
                  summary: '',
                  content: '',
                  keyTakeaways: [],
                  readTimeMinutes: 4,
                  iconName: 'Zap',
                  targetAudience: 'Untuk Pengelola Fasilitas & Publik'
                });
                setIsGuideModalOpen(true);
              }}
            >
              Tambah Panduan Baru
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guides.map(guide => (
              <div
                key={guide.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-xs font-bold rounded-full text-[#0f5238]">
                      Pilar {guide.pillar}
                    </span>
                    <span className="text-xs text-slate-400">{guide.readTimeMinutes} menit baca</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {guide.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {guide.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{guide.targetAudience}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        const full = await newsletterService.getGuideById(guide.id);
                        setEditingGuide(full || guide);
                        setIsGuideModalOpen(true);
                      }}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGuide(guide.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 6: SUBSCRIBERS ================= */}
      {activeSubTab === 'subscribers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Daftar Pelanggan Buletin Bulanan
              </h3>
              <p className="text-xs text-slate-500">
                Email yang mendaftar melalui widget buletin di halaman publik.
              </p>
            </div>

            <span className="px-3 py-1 bg-emerald-100 text-[#0f5238] rounded-full text-xs font-bold">
              Total {subscribers.length} Pelanggan Aktif
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Nama / Organisasi</th>
                  <th className="p-3.5">Tanggal Berlangganan</th>
                  <th className="p-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subscribers.map((sub, i) => (
                  <tr key={sub.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{sub.email}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">{sub.name || '—'}</td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(sub.subscribedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                        Aktif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT HERO SLIDE ================= */}
      {isHeroModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-[#0f5238]" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {editingHeroSlide.id ? 'Edit Slide Carousel' : 'Tambah Slide Carousel Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsHeroModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHeroSlide} className="space-y-4">
              {/* Image Preview & Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Foto Latar Carousel (Resolusi Tinggi)</span>
                  <button
                    type="button"
                    onClick={() => handleOpenImagePicker('hero', editingHeroSlide.imageUrl)}
                    className="text-xs font-bold text-[#0f5238] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Pilih dari Galeri Kurasi</span>
                  </button>
                </label>

                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <img
                    src={editingHeroSlide.imageUrl || PLACEHOLDER_IMAGE}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-3 py-1 bg-black/70 backdrop-blur-md rounded-lg text-xs font-bold text-white">
                      Overlay: {editingHeroSlide.overlayGradient || 'emerald'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenImagePicker('hero', editingHeroSlide.imageUrl)}
                      className="px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-md hover:bg-slate-100 cursor-pointer"
                    >
                      Ganti Foto
                    </button>
                  </div>
                </div>

                <Input
                  label="Atau Masukkan URL Gambar Kustom"
                  value={editingHeroSlide.imageUrl || ''}
                  onChange={e => setEditingHeroSlide({ ...editingHeroSlide, imageUrl: e.target.value })}
                  placeholder={PLACEHOLDER_IMAGE}
                />
              </div>

              {/* Title & Subtitle */}
              <Input
                label="Judul Utama Banner (H1)"
                required
                value={editingHeroSlide.title || ''}
                onChange={e => setEditingHeroSlide({ ...editingHeroSlide, title: e.target.value })}
                placeholder="e.g. Dekarbonisasi Menuju Net-Zero Healthcare 2030"
              />

              <TextArea
                label="Sub-judul / Deskripsi Pendukung"
                rows={2}
                required
                value={editingHeroSlide.subtitle || ''}
                onChange={e => setEditingHeroSlide({ ...editingHeroSlide, subtitle: e.target.value })}
                placeholder="Rangkuman inisiatif utama yang langsung terbaca oleh publik..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Gaya Gradien Overlay
                  </label>
                  <select
                    value={editingHeroSlide.overlayGradient || 'emerald'}
                    onChange={e =>
                      setEditingHeroSlide({
                        ...editingHeroSlide,
                        overlayGradient: e.target.value as GradientOverlayStyle
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="emerald">Emerald Twilight (Default)</option>
                    <option value="sapphire">Sapphire Ocean</option>
                    <option value="forest">Deep Forest</option>
                    <option value="dark">Charcoal Minimalist</option>
                    <option value="sunset">Sunset Gold</option>
                  </select>
                </div>

                <Input
                  label="Teks Badge Atas"
                  value={editingHeroSlide.badgeText || ''}
                  onChange={e => setEditingHeroSlide({ ...editingHeroSlide, badgeText: e.target.value })}
                  placeholder="e.g. Inisiatif Unggulan"
                />

                <Input
                  label="Urutan Slide (#)"
                  type="number"
                  value={editingHeroSlide.order ?? 1}
                  onChange={e =>
                    setEditingHeroSlide({ ...editingHeroSlide, order: parseInt(e.target.value) || 1 })
                  }
                />
              </div>

              {/* Metric Impact Badge */}
              <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-[#0f5238] dark:text-emerald-400 block">
                  Frosted Impact Badge (Kartu Metrik Kanan)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Angka Capaian"
                    value={editingHeroSlide.impactBadge?.value || ''}
                    onChange={e =>
                      setEditingHeroSlide({
                        ...editingHeroSlide,
                        impactBadge: {
                          value: e.target.value,
                          label: editingHeroSlide.impactBadge?.label || ''
                        }
                      })
                    }
                    placeholder="nilai metrik terverifikasi"
                  />
                  <Input
                    label="Keterangan Metrik"
                    value={editingHeroSlide.impactBadge?.label || ''}
                    onChange={e =>
                      setEditingHeroSlide({
                        ...editingHeroSlide,
                        impactBadge: {
                          value: editingHeroSlide.impactBadge?.value || '',
                          label: e.target.value
                        }
                      })
                    }
                    placeholder="e.g. Energi Terbarukan"
                  />
                </div>
              </div>

              {/* CTAs */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Teks Tombol Utama"
                  value={editingHeroSlide.ctaPrimaryText || ''}
                  onChange={e =>
                    setEditingHeroSlide({ ...editingHeroSlide, ctaPrimaryText: e.target.value })
                  }
                  placeholder="Baca Selengkapnya"
                />
                <Input
                  label="Teks Tombol Sekunder"
                  value={editingHeroSlide.ctaSecondaryText || ''}
                  onChange={e =>
                    setEditingHeroSlide({ ...editingHeroSlide, ctaSecondaryText: e.target.value })
                  }
                  placeholder="Gabung Gerakan"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="slidePublished"
                  checked={editingHeroSlide.isPublished}
                  onChange={e =>
                    setEditingHeroSlide({ ...editingHeroSlide, isPublished: e.target.checked })
                  }
                  className="rounded text-[#0f5238] focus:ring-[#0f5238]"
                />
                <label htmlFor="slidePublished" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tayangkan slide ini langsung di carousel publik
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button variant="ghost" size="sm" onClick={() => setIsHeroModalOpen(false)}>
                  Batal
                </Button>
                <Button variant="primary" size="sm" type="submit" icon={<Save className="w-4 h-4" />}>
                  Simpan Slide
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT GALLERY ITEM ================= */}
      {isGalleryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#0f5238]" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {editingGalleryItem.id ? 'Edit Foto Fasilitas' : 'Tambah Foto Fasilitas Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsGalleryModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGalleryItem} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Foto Dokumentasi Fasilitas</span>
                  <button
                    type="button"
                    onClick={() => handleOpenImagePicker('gallery', editingGalleryItem.imageUrl)}
                    className="text-xs font-bold text-[#0f5238] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Pilih dari Kurasi Foto</span>
                  </button>
                </label>

                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <img
                    src={editingGalleryItem.imageUrl || ''}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleOpenImagePicker('gallery', editingGalleryItem.imageUrl)}
                    className="absolute bottom-3 right-3 px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-md hover:bg-slate-100 cursor-pointer"
                  >
                    Ganti Foto
                  </button>
                </div>

                <Input
                  label="Atau URL Foto Langsung"
                  value={editingGalleryItem.imageUrl || ''}
                  onChange={e => setEditingGalleryItem({ ...editingGalleryItem, imageUrl: e.target.value })}
                  placeholder={PLACEHOLDER_IMAGE}
                />
              </div>

              <Input
                label="Judul Foto / Fasilitas"
                required
                value={editingGalleryItem.title || ''}
                onChange={e => setEditingGalleryItem({ ...editingGalleryItem, title: e.target.value })}
                placeholder="e.g. Instalasi Rooftop Solar PV 250 kWp"
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Unit Rumah Sakit Siloam"
                  required
                  value={editingGalleryItem.hospitalUnit || ''}
                  onChange={e => setEditingGalleryItem({ ...editingGalleryItem, hospitalUnit: e.target.value })}
                  placeholder="e.g. Siloam Hospitals Lippo Village"
                />

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Foto
                  </label>
                  <select
                    value={editingGalleryItem.category || 'Energi Bersih'}
                    onChange={e => setEditingGalleryItem({ ...editingGalleryItem, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Energi Bersih">Energi Bersih</option>
                    <option value="Manajemen Limbah">Manajemen Limbah</option>
                    <option value="Konservasi Air">Konservasi Air</option>
                    <option value="K3 & Sosial">K3 & Sosial</option>
                    <option value="Fasilitas Hijau">Fasilitas Hijau</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Tahun Implementasi"
                  value={editingGalleryItem.year || '2026'}
                  onChange={e => setEditingGalleryItem({ ...editingGalleryItem, year: e.target.value })}
                  placeholder="2026"
                />
                <Input
                  label="Badge Dampak / Tag"
                  value={editingGalleryItem.metricTag || ''}
                  onChange={e => setEditingGalleryItem({ ...editingGalleryItem, metricTag: e.target.value })}
                  placeholder="e.g. -35% Emisi Listrik"
                />
              </div>

              <TextArea
                label="Keterangan / Caption Foto"
                rows={3}
                value={editingGalleryItem.caption || ''}
                onChange={e => setEditingGalleryItem({ ...editingGalleryItem, caption: e.target.value })}
                placeholder="Jelaskan detail fasilitas dan dampak yang dihasilkan..."
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button variant="ghost" size="sm" onClick={() => setIsGalleryModalOpen(false)}>
                  Batal
                </Button>
                <Button variant="primary" size="sm" type="submit" icon={<Save className="w-4 h-4" />}>
                  Simpan Foto
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT ARTICLE ================= */}
      {isArticleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0f5238]" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {editingArticle.id ? 'Edit Artikel Buletin' : 'Tulis Artikel Buletin Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsArticleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-4">
              {/* Cover Image */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Cover Image Artikel</span>
                  <button
                    type="button"
                    onClick={() => handleOpenImagePicker('article', editingArticle.coverImageUrl)}
                    className="text-xs font-bold text-[#0f5238] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Pilih dari Kurasi Foto</span>
                  </button>
                </label>

                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <img
                    src={editingArticle.coverImageUrl || ''}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleOpenImagePicker('article', editingArticle.coverImageUrl)}
                    className="absolute bottom-3 right-3 px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-md hover:bg-slate-100 cursor-pointer"
                  >
                    Ganti Cover
                  </button>
                </div>

                <Input
                  label="Atau Tempel URL Cover"
                  value={editingArticle.coverImageUrl || ''}
                  onChange={e => setEditingArticle({ ...editingArticle, coverImageUrl: e.target.value })}
                  placeholder={PLACEHOLDER_IMAGE}
                />
              </div>

              <Input
                label="Judul Artikel"
                required
                value={editingArticle.title || ''}
                onChange={e => setEditingArticle({ ...editingArticle, title: e.target.value })}
                placeholder="e.g. RS Siloam Raih Sertifikasi Bangunan Hijau EDGE"
              />

              <TextArea
                label="Sub-judul / Rangkuman Singkat"
                rows={2}
                required
                value={editingArticle.subtitle || ''}
                onChange={e => setEditingArticle({ ...editingArticle, subtitle: e.target.value })}
                placeholder="Rangkuman 2 kalimat tentang isi berita..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={editingArticle.category || 'Siloam Initiative'}
                    onChange={e => setEditingArticle({ ...editingArticle, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Siloam Initiative">Siloam Initiative</option>
                    <option value="Vendor Spotlight">Vendor Spotlight</option>
                    <option value="Environmental">Environmental</option>
                    <option value="Social">Social</option>
                    <option value="Governance">Governance</option>
                  </select>
                </div>

                <Input
                  label="Penulis / Divisi"
                  value={editingArticle.author || ''}
                  onChange={e => setEditingArticle({ ...editingArticle, author: e.target.value })}
                  placeholder="Tim ESG Siloam"
                />

                <Input
                  label="Estimasi Waktu Baca (Menit)"
                  type="number"
                  value={editingArticle.readTimeMinutes ?? 4}
                  onChange={e =>
                    setEditingArticle({ ...editingArticle, readTimeMinutes: parseInt(e.target.value) || 3 })
                  }
                />
              </div>

              <TextArea
                label="Konten Lengkap Artikel (Mendukung Format Paragraf)"
                rows={8}
                required
                value={editingArticle.content || ''}
                onChange={e => setEditingArticle({ ...editingArticle, content: e.target.value })}
                placeholder="Tuliskan isi berita secara mendalam..."
              />

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingArticle.featured}
                    onChange={e => setEditingArticle({ ...editingArticle, featured: e.target.checked })}
                    className="rounded text-[#0f5238]"
                  />
                  <span>Tandai sebagai Berita Utama (Featured)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingArticle.isPublished}
                    onChange={e => setEditingArticle({ ...editingArticle, isPublished: e.target.checked })}
                    className="rounded text-[#0f5238]"
                  />
                  <span>Tayangkan Langsung</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button variant="ghost" size="sm" onClick={() => setIsArticleModalOpen(false)}>
                  Batal
                </Button>
                <Button variant="primary" size="sm" type="submit" icon={<Save className="w-4 h-4" />}>
                  Simpan Artikel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT SPOTLIGHT ================= */}
      {isSpotlightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {editingSpotlight.id ? 'Edit Spotlight Mitra' : 'Tambah Spotlight Mitra Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsSpotlightModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSpotlight} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Foto Fasilitas / Operasional Vendor</span>
                  <button
                    type="button"
                    onClick={() => handleOpenImagePicker('spotlight', editingSpotlight.facilityImageUrl)}
                    className="text-xs font-bold text-[#0f5238] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Pilih dari Kurasi Foto</span>
                  </button>
                </label>

                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <img
                    src={editingSpotlight.facilityImageUrl || ''}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleOpenImagePicker('spotlight', editingSpotlight.facilityImageUrl)}
                    className="absolute bottom-3 right-3 px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-md hover:bg-slate-100 cursor-pointer"
                  >
                    Ganti Foto
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Nama Perusahaan Vendor"
                  required
                  value={editingSpotlight.vendorName || ''}
                  onChange={e => setEditingSpotlight({ ...editingSpotlight, vendorName: e.target.value })}
                  placeholder="e.g. PT Mitra Medika Hijau"
                />
                <Input
                  label="Industri / Sektor"
                  required
                  value={editingSpotlight.industry || ''}
                  onChange={e => setEditingSpotlight({ ...editingSpotlight, industry: e.target.value })}
                  placeholder="e.g. Cold Chain Logistics"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tingkat Kematangan ESG
                  </label>
                  <select
                    value={editingSpotlight.maturityLevel || 'Gold'}
                    onChange={e => setEditingSpotlight({ ...editingSpotlight, maturityLevel: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>

                <Input
                  label="Lokasi Kantor / Pabrik"
                  value={editingSpotlight.location || ''}
                  onChange={e => setEditingSpotlight({ ...editingSpotlight, location: e.target.value })}
                  placeholder="Jakarta, Indonesia"
                />
              </div>

              <TextArea
                label="Ringkasan Pencapaian Utama"
                rows={2}
                required
                value={editingSpotlight.achievementSummary || ''}
                onChange={e => setEditingSpotlight({ ...editingSpotlight, achievementSummary: e.target.value })}
                placeholder="Rangkuman inisiatif dan dampak nyata..."
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Angka Capaian (e.g. 100% Zero Landfill)"
                  required
                  value={editingSpotlight.metricAchieved || ''}
                  onChange={e => setEditingSpotlight({ ...editingSpotlight, metricAchieved: e.target.value })}
                />
                <Input
                  label="Label Capaian"
                  required
                  value={editingSpotlight.metricLabel || ''}
                  onChange={e => setEditingSpotlight({ ...editingSpotlight, metricLabel: e.target.value })}
                />
              </div>

              <TextArea
                label="Kutipan Pimpinan Perusahaan"
                rows={2}
                value={editingSpotlight.quote || ''}
                onChange={e => setEditingSpotlight({ ...editingSpotlight, quote: e.target.value })}
                placeholder="Kutipan inspiratif pimpinan vendor..."
              />

              <Input
                label="Nama & Jabatan Pemberi Kutipan"
                value={editingSpotlight.quotePerson || ''}
                onChange={e => setEditingSpotlight({ ...editingSpotlight, quotePerson: e.target.value })}
                placeholder="e.g. Budi Santoso, Direktur Operasional"
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button variant="ghost" size="sm" onClick={() => setIsSpotlightModalOpen(false)}>
                  Batal
                </Button>
                <Button variant="primary" size="sm" type="submit" icon={<Save className="w-4 h-4" />}>
                  Simpan Spotlight
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT GUIDE ================= */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {editingGuide.id ? 'Edit Modul Edukasi' : 'Tambah Modul Edukasi Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsGuideModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGuide} className="space-y-4">
              <Input
                label="Judul Modul Panduan"
                required
                value={editingGuide.title || ''}
                onChange={e => setEditingGuide({ ...editingGuide, title: e.target.value })}
                placeholder="e.g. Audit Energi Kilat untuk Fasilitas Medis"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Pilar ESG
                  </label>
                  <select
                    value={editingGuide.pillar || 'E'}
                    onChange={e => setEditingGuide({ ...editingGuide, pillar: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="E">Environmental (E)</option>
                    <option value="S">Social (S)</option>
                    <option value="G">Governance (G)</option>
                  </select>
                </div>

                <Input
                  label="Kategori Topik"
                  value={editingGuide.category || ''}
                  onChange={e => setEditingGuide({ ...editingGuide, category: e.target.value })}
                  placeholder="e.g. Efisiensi Energi"
                />
              </div>

              <TextArea
                label="Rangkuman Singkat"
                rows={2}
                required
                value={editingGuide.summary || ''}
                onChange={e => setEditingGuide({ ...editingGuide, summary: e.target.value })}
              />

              <TextArea
                label="Konten Modul Lengkap"
                rows={6}
                required
                value={editingGuide.content || ''}
                onChange={e => setEditingGuide({ ...editingGuide, content: e.target.value })}
              />

              <Input
                label="Target Pembaca"
                value={editingGuide.targetAudience || ''}
                onChange={e => setEditingGuide({ ...editingGuide, targetAudience: e.target.value })}
                placeholder="Untuk Pengelola Fasilitas & Publik"
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button variant="ghost" size="sm" onClick={() => setIsGuideModalOpen(false)}>
                  Batal
                </Button>
                <Button variant="primary" size="sm" type="submit" icon={<Save className="w-4 h-4" />}>
                  Simpan Modul
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: IMAGE PICKER ================= */}
      <ImagePickerModal
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelectImage={handleApplyPickedImage}
        currentImageUrl={imagePickerCurrentVal}
        title="Pilih Gambar Resolusi Tinggi (Siloam ESG Curated Library)"
      />
    </div>
  );
};
