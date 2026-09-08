import React, { useState, useEffect } from 'react';
import {
  NewsletterArticle,
  PublicLearningGuide,
  PublicVendorSpotlight,
  HeroCarouselSlide,
  SustainabilityGalleryItem,
  ArticleCategory
} from '../types';
import { newsletterService } from '../services/newsletterService';
import { EcosystemMetrics, PrimaryTab } from '../../../core/types';
import { BaseCard, MetricCard } from '../../../core/ui/Cards';
import { Button } from '../../../core/ui/Button';
import { ArticleReaderModal } from './ArticleReaderModal';
import { GuideReaderModal } from './GuideReaderModal';
import { PLACEHOLDER_IMAGE } from '../../../core/ui/assets';
import { LanguageToggle, AccountButton } from '../../../core/ui/Navigation';
import { useLanguage } from '../../../core/context/LanguageContext';
import { HeroCarousel } from './HeroCarousel';
import { SustainabilityGallery } from './SustainabilityGallery';
import {
  Sparkles,
  Search,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  Leaf,
  Users,
  Scale,
  Zap,
  Recycle,
  Droplets,
  Trees,
  Heart,
  BookOpen,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Share2,
  Award,
  ArrowUpRight,
  Filter,
  Check,
  Sun,
  Moon,
  ThumbsUp,
  Eye,
  Layers,
  Hospital
} from 'lucide-react';

interface NewsletterLandingViewProps {
  onNavigateToVendor: (tab?: PrimaryTab) => void;
  onNavigateToAdmin: () => void;
  onStartOnboarding: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onOpenAuth?: () => void;
}

export const NewsletterLandingView: React.FC<NewsletterLandingViewProps> = ({
  onNavigateToVendor,
  onNavigateToAdmin,
  onStartOnboarding,
  theme,
  onToggleTheme,
  onOpenAuth
}) => {
  const { isId } = useLanguage();
  const [heroSlides, setHeroSlides] = useState<HeroCarouselSlide[]>([]);
  const [galleryItems, setGalleryItems] = useState<SustainabilityGalleryItem[]>([]);
  const [articles, setArticles] = useState<NewsletterArticle[]>([]);
  const [guides, setGuides] = useState<PublicLearningGuide[]>([]);
  const [spotlights, setSpotlights] = useState<PublicVendorSpotlight[]>([]);
  const [metrics, setMetrics] = useState<EcosystemMetrics | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState<NewsletterArticle | null>(null);
  const [activeGuide, setActiveGuide] = useState<PublicLearningGuide | null>(null);

  // Subscribe form state
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [subscriberName, setSubscriberName] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubmittingSubscribe, setIsSubmittingSubscribe] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [slides, gals, arts, gds, spots, mets] = await Promise.all([
      newsletterService.getHeroSlides(true),
      newsletterService.getSustainabilityGallery(undefined, true),
      newsletterService.getPublishedArticles(),
      newsletterService.getPublicGuides(),
      newsletterService.getSpotlights(true),
      newsletterService.getEcosystemMetrics()
    ]);
    setHeroSlides(slides);
    setGalleryItems(gals);
    setArticles(arts);
    setGuides(gds);
    setSpotlights(spots);
    setMetrics(mets);
  };

  const handleLike = async (id: string) => {
    const newCount = await newsletterService.likeArticle(id);
    setArticles(prev =>
      prev.map(a => (a.id === id ? { ...a, likesCount: newCount } : a))
    );
    if (activeArticle && activeArticle.id === id) {
      setActiveArticle({ ...activeArticle, likesCount: newCount });
    }
  };

  const openArticle = async (id: string) => {
    const full = await newsletterService.getArticleById(id);
    if (full) setActiveArticle(full);
  };

  const openGuide = async (id: string) => {
    const full = await newsletterService.getGuideById(id);
    if (full) setActiveGuide(full);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberEmail.trim()) return;
    setIsSubmittingSubscribe(true);
    try {
      await newsletterService.subscribeNewsletter(subscriberEmail, subscriberName);
      setIsSubscribed(true);
      setSubscriberEmail('');
      setSubscriberName('');
    } finally {
      setIsSubmittingSubscribe(false);
    }
  };

  const categories: ArticleCategory[] = [
    'All',
    'Siloam Initiative',
    'Vendor Spotlight',
    'Environmental',
    'Social',
    'Governance'
  ];

  const filteredArticles = articles.filter(a => {
    const matchesCat = selectedCategory === 'All' || a.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 selection:bg-emerald-200 selection:text-emerald-900">
      {/* Editorial Newsletter Masthead */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 sticky top-0 z-40 backdrop-blur-md">
        {/* Top Notice Bar */}
        <div className="bg-[#0f5238] text-emerald-100 px-4 py-1.5 text-xs text-center font-medium flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
          <span>
            <strong>Siloam ESG Horizon:</strong>{' '}
            {isId
              ? 'Buletin Resmi Informasi Baik & Aksi Berkelanjutan Ekosistem Rumah Sakit Siloam'
              : 'Official bulletin of Siloam hospital-ecosystem sustainability actions'}
          </span>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0f5238] to-emerald-600 flex items-center justify-center text-white shadow-md">
              <Leaf className="w-6 h-6 fill-current" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-slate-50">
                  Siloam ESG Horizon
                </span>
                <span className="hidden sm:inline px-2 py-0.5 bg-emerald-100 text-[#0f5238] dark:bg-emerald-950 dark:text-emerald-300 rounded-md text-[10px] font-bold uppercase">
                  {isId ? 'Portal Publik & CMS' : 'Public Portal & CMS'}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {metrics
                  ? (isId
                    ? `Aksi Nyata ${metrics.totalVendors} Mitra Rantai Pasok Menuju Net-Zero Healthcare`
                    : `${metrics.totalVendors} supply-chain partners acting toward net-zero healthcare`)
                  : (isId
                    ? 'Aksi Nyata Mitra Rantai Pasok Menuju Net-Zero Healthcare'
                    : 'Supply-chain partners acting toward net-zero healthcare')}
              </p>
            </div>
          </div>

          {/* Action Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={isId ? 'Ganti tema' : 'Toggle theme'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {onOpenAuth && <AccountButton onClick={onOpenAuth} />}

            <button
              onClick={() => onNavigateToVendor('home')}
              className="px-3 sm:px-4 py-2 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Portal Mitra Vendor</span>
              <span className="sm:hidden">Vendor</span>
            </button>

            <button
              onClick={onNavigateToAdmin}
              className="px-3 sm:px-4 py-2 rounded-lg text-xs font-bold bg-[#0f5238] hover:bg-[#0f5238]/90 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin CMS</span>
              <span className="sm:hidden">CMS</span>
            </button>
          </div>
        </div>

        {/* Section Navigation Links */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 px-4 sm:px-6 max-w-7xl mx-auto flex items-center justify-between overflow-x-auto py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <div className="flex items-center space-x-6 shrink-0">
            <a href="#hero" className="hover:text-[#0f5238] dark:hover:text-emerald-400 transition-colors">
              ⭐ Inisiatif Utama
            </a>
            <a href="#dampak" className="hover:text-[#0f5238] dark:hover:text-emerald-400 transition-colors">
              📊 Dampak Ekosistem
            </a>
            <a href="#galeri" className="hover:text-[#0f5238] dark:hover:text-emerald-400 transition-colors">
              📸 Galeri Fasilitas
            </a>
            <a href="#berita" className="hover:text-[#0f5238] dark:hover:text-emerald-400 transition-colors">
              📰 Berita & Artikel
            </a>
            <a href="#spotlight" className="hover:text-[#0f5238] dark:hover:text-emerald-400 transition-colors">
              🌟 Cerita Mitra
            </a>
            <a href="#edukasi" className="hover:text-[#0f5238] dark:hover:text-emerald-400 transition-colors">
              🎓 Edukasi Terbuka
            </a>
            <a href="#langganan" className="hover:text-[#0f5238] dark:hover:text-emerald-400 transition-colors">
              ✉️ Berlangganan
            </a>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Jaringan RS Siloam Terhubung</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        {/* ================= SECTION 1: WORLD-CLASS HERO IMAGE CAROUSEL ================= */}
        <section id="hero">
          {heroSlides.length > 0 && (
            <HeroCarousel
              slides={heroSlides}
              onSelectArticle={articleId => {
                void openArticle(articleId);
              }}
              onStartOnboarding={onStartOnboarding}
              onNavigateToVendor={() => onNavigateToVendor('home')}
              partnerCount={metrics?.totalVendors}
            />
          )}
        </section>

        {/* ================= SECTION 2: AGGREGATE ECOSYSTEM METRICS ================= */}
        <section id="dampak" className="space-y-4 text-left">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#0f5238] dark:text-emerald-400">
                Transparansi & Akuntabilitas Publik
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                Dampak Agregat Ekosistem Siloam Hospitals
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Rangkuman angka riil dari seluruh aksi keberlanjutan yang telah diverifikasi di seluruh unit rumah sakit dan mitra.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-[#0f5238] dark:text-emerald-300">
              <Building2 className="w-4 h-4" />
              <span>
                {metrics
                  ? `${metrics.activeVendors} Mitra Aktif Terhubung`
                  : 'Mitra Aktif Terhubung'}
              </span>
            </div>
          </div>

          {metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <MetricCard
                title="Energi Terhemat"
                value={metrics.totals.energySavedKwh}
                unit="kWh"
                icon={<Zap className="w-4 h-4" />}
                colorTheme="amber"
              />
              <MetricCard
                title="Limbah Didaur Ulang"
                value={metrics.totals.wasteRecycledKg}
                unit="kg"
                icon={<Recycle className="w-4 h-4" />}
                colorTheme="blue"
              />
              <MetricCard
                title="Plastik Dihindari"
                value={metrics.totals.plasticReducedKg}
                unit="kg"
                icon={<Leaf className="w-4 h-4" />}
                colorTheme="emerald"
              />
              <MetricCard
                title="Air Terkonservasi"
                value={metrics.totals.waterSavedLiters}
                unit="Liter"
                icon={<Droplets className="w-4 h-4" />}
                colorTheme="blue"
              />
              <MetricCard
                title="Pekerja & Komunitas"
                value={metrics.totals.peopleBenefited}
                unit="Orang"
                icon={<Users className="w-4 h-4" />}
                colorTheme="indigo"
              />
              <MetricCard
                title="Pohon Tertanam"
                value={metrics.totals.treesPlanted}
                unit="Pohon"
                icon={<Trees className="w-4 h-4" />}
                colorTheme="emerald"
              />
            </div>
          )}
        </section>

        {/* ================= SECTION 3: SUSTAINABILITY PHOTO GALLERY ================= */}
        <SustainabilityGallery items={galleryItems} />

        {/* ================= SECTION 4: NEWSLETTER ARTICLES MAGAZINE ================= */}
        <section id="berita" className="space-y-6 text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#0f5238] dark:text-emerald-400">
                Kabar Baik & Wawasan Hijau
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                Kumpulan Artikel & Buletin Terbaru
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Liputan mendalam tentang inovasi rantai pasok medis berkelanjutan, efisiensi energi, dan tata kelola etis.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari topik, mitra, atau berita..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f5238] focus:ring-1 focus:ring-[#0f5238] transition-all"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
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
                  {cat === 'All' ? 'Semua Kategori' : cat}
                </button>
              );
            })}
          </div>

          {/* Rich Articles Grid with Images & Overlays */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(article => (
              <article
                key={article.id}
                onClick={() => void openArticle(article.id)}
                className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 hover:border-[#0f5238]/60 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              >
                {/* Article Cover Image with Gradient Badges */}
                <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-900">
                  <img
                    src={article.coverImageUrl || PLACEHOLDER_IMAGE}
                    alt={article.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  {/* Category Pill on Image */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white border border-white/20 rounded-md text-[10px] font-black uppercase tracking-wider">
                      {article.category}
                    </span>
                    {article.featured && (
                      <span className="px-2 py-0.5 bg-amber-400 text-amber-950 rounded-md text-[10px] font-black uppercase">
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Read Time & Edition */}
                  <div className="absolute bottom-3 left-3 text-[11px] font-semibold text-white/90 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-400" /> {article.readTimeMinutes} menit baca
                    </span>
                  </div>

                  {/* Likes Count */}
                  {article.likesCount !== undefined && article.likesCount > 0 && (
                    <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-emerald-400" />
                      <span>{article.likesCount}</span>
                    </div>
                  )}
                </div>

                {/* Article Body */}
                <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0f5238] dark:group-hover:text-emerald-400 transition-colors leading-snug">
                      {article.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {article.subtitle}
                    </p>

                    {/* Impact pill if present */}
                    {article.impactHighlight && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between text-xs mt-2">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          {article.impactHighlight.metricLabel}
                        </span>
                        <span className="font-extrabold text-[#0f5238] dark:text-emerald-300">
                          {article.impactHighlight.metricValue}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="text-slate-400 text-[11px]">
                      <span>{article.publishedDate}</span>
                    </div>
                    <span className="font-bold text-[#0f5238] dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Baca Artikel <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Tidak ada artikel yang cocok</p>
              <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau kategori filter.</p>
            </div>
          )}
        </section>

        {/* ================= SECTION 5: VENDOR SPOTLIGHT SHOWCASE ================= */}
        <section id="spotlight" className="space-y-6 text-left">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#0f5238] dark:text-emerald-400">
              Inspirasi & Kolaborasi
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Vendor Spotlight: Aksi Nyata Mitra Siloam
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Perusahaan-perusahaan terkemuka yang telah mengintegrasikan praktik ramah lingkungan dan tata kelola berintegritas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {spotlights.map(spot => (
              <div
                key={spot.id}
                className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Vendor Facility Photo */}
                {spot.facilityImageUrl && (
                  <div className="relative aspect-16/9 w-full overflow-hidden bg-slate-900">
                    <img
                      src={spot.facilityImageUrl}
                      alt={spot.vendorName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 bg-amber-400 text-amber-950 text-[10px] font-black uppercase rounded-md shadow-md">
                        {spot.maturityLevel} Tier Partner
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 text-xs text-white/90 font-medium">
                      <span>{spot.location}</span>
                    </div>
                  </div>
                )}

                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {spot.vendorName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{spot.industry}</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-100 dark:border-slate-700/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">
                        Capaian Utama
                      </span>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                        {spot.achievementSummary}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-[#0f5238] dark:text-emerald-400">
                        {spot.metricAchieved}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{spot.metricLabel}</span>
                    </div>

                    {spot.quote && (
                      <blockquote className="text-xs italic text-slate-600 dark:text-slate-300 border-l-2 border-[#0f5238] pl-3 py-1 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-r-lg">
                        "{spot.quote}"
                        <span className="block not-italic font-bold text-[10px] text-slate-400 mt-1">
                          — {spot.quotePerson}
                        </span>
                      </blockquote>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= SECTION 6: OPEN ACCESS PUBLIC LEARNING ================= */}
        <section id="edukasi" className="space-y-6 text-left">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#0f5238] dark:text-emerald-400">
                Edukasi Terbuka untuk Semua
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                Siloam Public ESG Academy
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Panduan praktis dan modul ringkas yang dapat diakses siapa saja secara gratis tanpa perlu registrasi.
              </p>
            </div>

            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
              Open Access Micro-Guides
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {guides.map(guide => (
              <div
                key={guide.id}
                onClick={() => void openGuide(guide.id)}
                className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 hover:border-[#0f5238]/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-xs font-extrabold rounded-md text-slate-700 dark:text-slate-300">
                      Pilar {guide.pillar}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">{guide.readTimeMinutes} mnt baca</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0f5238] dark:group-hover:text-emerald-400 transition-colors leading-snug">
                    {guide.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {guide.summary}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">{guide.category}</span>
                  <span className="font-bold text-[#0f5238] dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Buka Panduan <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= SECTION 7: NEWSLETTER SUBSCRIPTION WIDGET ================= */}
        <section
          id="langganan"
          className="bg-gradient-to-r from-[#0f5238] via-emerald-950 to-slate-900 text-white rounded-2xl p-8 sm:p-10 shadow-xl text-left relative overflow-hidden border border-emerald-800/40"
        >
          <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-white/20 rounded-md text-xs font-extrabold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Buletin Bulanan Gratis</span>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Tetap Terhubung dengan Perkembangan ESG Siloam
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-xl">
                Dapatkan edisi buletin terbaru, kisah inspiratif mitra, dan panduan keberlanjutan langsung ke kotak masuk email Anda setiap bulan.
              </p>
            </div>

            <div className="md:col-span-5">
              {isSubscribed ? (
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-emerald-400/40 text-center space-y-2 animate-fade-in">
                  <div className="w-10 h-10 bg-white text-[#0f5238] rounded-lg flex items-center justify-center mx-auto shadow-sm">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <h4 className="text-base font-bold text-white">Terima Kasih Telah Berlangganan!</h4>
                  <p className="text-xs text-emerald-100">
                    Anda akan menerima edisi buletin Siloam ESG Horizon berikutnya.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-3 bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/20">
                  <input
                    type="text"
                    placeholder="Nama Lengkap / Organisasi (Opsional)"
                    value={subscriberName}
                    onChange={e => setSubscriberName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg text-xs bg-white/90 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="Alamat Email Anda"
                      value={subscriberEmail}
                      onChange={e => setSubscriberEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg text-xs bg-white/90 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingSubscribe}
                      className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold text-xs rounded-lg shrink-0 transition-colors cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {isSubmittingSubscribe ? 'Mengirim...' : 'Langganan'}
                    </button>
                  </div>
                  <p className="text-[10px] text-emerald-200">
                    Kami menghormati privasi Anda. Tanpa spam, batalkan langganan kapan saja.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* ================= SECTION 8: CALL TO ACTION FOR VENDORS ================= */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-4xl mx-auto space-y-5">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 text-[#0f5238] dark:text-emerald-300 rounded-xl flex items-center justify-center mx-auto shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Apakah Perusahaan Anda Rekanan Bisnis Siloam?
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Mulailah perjalanan ESG perusahaan Anda sekarang. Ikuti onboarding cepat &lt;5 menit, ambil asesmen diagnostik mandiri, dan dapatkan pengakuan sebagai mitra berkelanjutan resmi Siloam Hospitals.
          </p>

          <div className="pt-3 flex flex-wrap justify-center items-center gap-3.5">
            <button
              onClick={onStartOnboarding}
              className="px-7 py-3.5 bg-[#0f5238] hover:bg-[#0f5238]/90 text-white text-xs sm:text-sm font-bold rounded-lg shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Mulai Onboarding Mitra (Gratis)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateToVendor('assessment')}
              className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer"
            >
              Coba Asesmen Diagnostik
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-12 mt-16 text-slate-500 dark:text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0f5238] text-white flex items-center justify-center">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">
                  Siloam Hospitals ESG Horizon
                </span>
                <span className="text-[11px] text-slate-400">
                  Direktorat Sustainability & Hospital Facilities Management
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <button onClick={() => onNavigateToVendor('home')} className="hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer">
                Portal Vendor
              </button>
              <button onClick={onNavigateToAdmin} className="hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer">
                Admin CMS
              </button>
              <button onClick={onStartOnboarding} className="hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer">
                Daftar Mitra
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
            <p>© 2026 Siloam Hospitals Group • Sustainability & Supply Chain Governance</p>
            <p>Dibangun untuk transparansi publik dan pemberdayaan mitra berkelanjutan.</p>
          </div>
        </div>
      </footer>

      {/* Modals for Reading Article & Guide */}
      <ArticleReaderModal
        article={activeArticle}
        onClose={() => setActiveArticle(null)}
        onLike={handleLike}
        onNavigateToPortal={onStartOnboarding}
      />

      <GuideReaderModal
        guide={activeGuide}
        onClose={() => setActiveGuide(null)}
      />
    </div>
  );
};
