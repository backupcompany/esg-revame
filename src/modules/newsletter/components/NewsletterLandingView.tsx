import React, { useState, useEffect, useRef } from 'react';
import {
  NewsletterArticle,
  PublicLearningGuide,
  PublicVendorSpotlight,
  HeroCarouselSlide,
  SustainabilityGalleryItem,
} from '../types';
import { newsletterService } from '../services/newsletterService';
import { EcosystemMetrics, PrimaryTab } from '../../../core/types';
import { ArticleReaderModal } from './ArticleReaderModal';
import { GuideReaderModal } from './GuideReaderModal';
import { PLACEHOLDER_IMAGE } from '../../../core/ui/assets';
import { LanguageToggle } from '../../../core/ui/Navigation';
import { useAuth } from '../../../core/context/AuthContext';
import { useLanguage } from '../../../core/context/LanguageContext';
import { SustainabilityGallery } from './SustainabilityGallery';
import { TracingBeam } from '../../../components/ui/tracing-beam';
import {
  ArrowRight,
  Zap,
  Recycle,
  Droplets,
  Trees,
  Users,
  Leaf,
  ShieldCheck,
  Check,
  Building2,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

const HERO_VIDEO = '/hero.mp4?v=2';

interface NewsletterLandingViewProps {
  onNavigateToVendor: (tab?: PrimaryTab) => void;
  onNavigateToAdmin: () => void;
  onStartOnboarding: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onOpenAuth?: () => void;
}

const NAV = [
  { href: '#dampak', id: 'Dampak', en: 'Impact' },
  { href: '#galeri', id: 'Galeri', en: 'Gallery' },
  { href: '#berita', id: 'Berita', en: 'News' },
  { href: '#edukasi', id: 'Edukasi', en: 'Learning' },
];

export const NewsletterLandingView: React.FC<NewsletterLandingViewProps> = ({
  onNavigateToVendor,
  onNavigateToAdmin,
  onStartOnboarding,
  theme: _theme,
  onToggleTheme: _onToggleTheme,
  onOpenAuth
}) => {
  const { isId } = useLanguage();
  const { dbUser } = useAuth();
  const signedIn = Boolean(dbUser);
  const canAccessAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin';
  const [heroSlides, setHeroSlides] = useState<HeroCarouselSlide[]>([]);
  const [galleryItems, setGalleryItems] = useState<SustainabilityGalleryItem[]>([]);
  const [articles, setArticles] = useState<NewsletterArticle[]>([]);
  const [guides, setGuides] = useState<PublicLearningGuide[]>([]);
  const [spotlights, setSpotlights] = useState<PublicVendorSpotlight[]>([]);
  const [metrics, setMetrics] = useState<EcosystemMetrics | null>(null);

  const [heroIndex, setHeroIndex] = useState<number | null>(null);
  const [articleIndex, setArticleIndex] = useState<number | null>(null);
  const [articleFull, setArticleFull] = useState<NewsletterArticle[]>([]);
  const heroScroll = useRef<HTMLDivElement>(null);
  const articleScroll = useRef<HTMLDivElement>(null);
  const heroVideo = useRef<HTMLVideoElement>(null);
  const [activeArticle, setActiveArticle] = useState<NewsletterArticle | null>(null);
  const [activeGuide, setActiveGuide] = useState<PublicLearningGuide | null>(null);
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [subscriberName, setSubscriberName] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubmittingSubscribe, setIsSubmittingSubscribe] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    loadData();
    const tick = () => {
      void newsletterService.getEcosystemMetrics().then(setMetrics);
    };
    const id = window.setInterval(tick, 15000);
    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

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

  const filteredArticles = articles;

  const logos = [0, 1];

  const faqs = isId
    ? [
        ['Siapa yang bisa masuk portal?', 'Hanya email yang sudah ada di roster vendor Siloam. Tidak ada daftar mandiri.'],
        ['Apa itu asesmen?', '15 soal diagnostik (lingkungan, sosial, tata kelola). Bukan sertifikasi.'],
        ['Bagaimana bukti ditinjau?', 'Vendor mengunggah bukti aksi. Tim Siloam memverifikasi atau meminta tambahan.'],
        ['Berapa lama kode etik berlaku?', 'Versi yang ditandatangani berlaku satu tahun.'],
      ]
    : [
        ['Who can enter the portal?', 'Only emails already on the Siloam vendor roster. There is no public signup.'],
        ['What is the assessment?', '15 diagnostic questions (environment, social, governance). It is not a certification.'],
        ['How is evidence reviewed?', 'Vendors upload action evidence. Siloam verifies it or asks for more.'],
        ['How long does the code of conduct last?', 'A signed version is valid for one year.'],
      ];

  const metricsRow = metrics
    ? [
        [isId ? 'Energi' : 'Energy', `${metrics.totals.energySavedKwh} kWh`, <Zap className="w-4 h-4" />],
        [isId ? 'Daur ulang' : 'Recycled', `${metrics.totals.wasteRecycledKg} kg`, <Recycle className="w-4 h-4" />],
        [isId ? 'Plastik' : 'Plastic', `${metrics.totals.plasticReducedKg} kg`, <Leaf className="w-4 h-4" />],
        [isId ? 'Air' : 'Water', `${metrics.totals.waterSavedLiters} L`, <Droplets className="w-4 h-4" />],
        [isId ? 'Orang' : 'People', `${metrics.totals.peopleBenefited}`, <Users className="w-4 h-4" />],
        [isId ? 'Pohon' : 'Trees', `${metrics.totals.treesPlanted}`, <Trees className="w-4 h-4" />],
      ]
    : [];

  const enter = () => (signedIn ? onNavigateToVendor('home') : onOpenAuth?.());

  const armHero = useRef((node: HTMLVideoElement | null) => {
    heroVideo.current = node;
    if (!node) return;
    node.muted = true;
    node.defaultMuted = true;
    node.loop = true;
    const start = () => {
      node.muted = true;
      if (node.paused) void node.play().catch(() => {});
    };
    start();
    node.addEventListener('canplay', start, { once: true });
  }).current;

  useEffect(() => {
    if (heroIndex === null) return;
    const el = document.getElementById(`hl-${heroIndex}`);
    if (el && heroScroll.current) heroScroll.current.scrollTo({ top: Math.max(0, el.offsetTop - 56) });
  }, [heroIndex]);

  useEffect(() => {
    if (articleIndex === null) return;
    let stop = false;
    Promise.all(filteredArticles.map(a => newsletterService.getArticleById(a.id))).then(rows => {
      if (stop) return;
      setArticleFull(rows.filter((a): a is NewsletterArticle => !!a));
      requestAnimationFrame(() => {
        const el = document.getElementById(`art-${articleIndex}`);
        if (el && articleScroll.current) articleScroll.current.scrollTo({ top: Math.max(0, el.offsetTop - 56) });
      });
    });
    const el = document.getElementById(`art-${articleIndex}`);
    if (el && articleScroll.current) articleScroll.current.scrollTo({ top: Math.max(0, el.offsetTop - 56) });
    return () => { stop = true; };
  }, [articleIndex]);

  return (
    <div className="esg-public dark min-h-screen">
      <section id="hero" className="relative min-h-screen overflow-hidden">
        <video
          ref={armHero}
          className="esg-hero-video pointer-events-none absolute inset-0 h-full w-full object-cover"
          src={HERO_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
        />

        <div className="relative z-10 flex min-h-screen flex-col items-center px-4 pb-10 pt-6">
          <nav className="liquid-glass flex w-full max-w-[850px] items-center justify-between gap-3 rounded-3xl px-3 py-2 sm:px-4">
            <a href="#hero" className="flex items-center gap-2 shrink-0">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--ep-primary)] text-[var(--ep-primary-fg)]">
                <Leaf className="h-5 w-5" />
              </span>
              <span className="text-lg font-semibold tracking-tight">ESG</span>
            </a>
            <div className="hidden items-center gap-5 text-base text-[var(--ep-fg)]/90 md:flex">
              {NAV.map(item => (
                <a key={item.href} href={item.href} className="hover:text-[var(--ep-primary)]">
                  {isId ? item.id : item.en}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:block"><LanguageToggle /></div>
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={enter}
                  className="rounded-xl bg-[var(--ep-primary)] px-3 py-2 text-sm font-medium text-[var(--ep-primary-fg)] hover:opacity-90"
                >
                  {signedIn ? (isId ? 'Portal' : 'Portal') : (isId ? 'Masuk' : 'Sign in')}
                </button>
              )}
              <button
                type="button"
                className="rounded-xl p-2 md:hidden"
                aria-label={mobileMenuOpen ? 'Close' : 'Menu'}
                onClick={() => setMobileMenuOpen(o => !o)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </nav>

          <div className={`nav-drop grid w-full max-w-[850px] md:hidden ${mobileMenuOpen ? 'open' : ''}`}>
            <div className="nav-drop-inner">
              <div className="liquid-glass mt-3 rounded-3xl p-4">
                {NAV.map(item => (
                  <a key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className="block py-3 text-base">
                    {isId ? item.id : item.en}
                  </a>
                ))}
                <LanguageToggle />
                {signedIn && canAccessAdmin && (
                  <button type="button" onClick={onNavigateToAdmin} className="mt-3 text-sm font-medium text-[var(--ep-primary)]">
                    Admin CMS
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
            <a href="#berita" className="liquid-glass mb-6 inline-flex items-center gap-2 rounded-full py-1 pl-4 pr-1 text-sm">
              {isId ? 'Buletin ESG Siloam' : 'Siloam ESG bulletin'}
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
                {isId ? 'Baca' : 'Explore'} <ChevronRight className="h-4 w-4" />
              </span>
            </a>
            <h1 className="max-w-5xl text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--ep-hero)] sm:text-6xl lg:text-7xl">
              {isId ? 'Aksi ESG rantai pasok, dalam satu portal' : 'Supply-chain ESG, in one portal'}
            </h1>
            <p className="mt-5 max-w-md text-lg text-[var(--ep-sub)] opacity-80">
              {isId
                ? 'Ukur kematangan, belajar, unggah bukti, dan tandatangani kode etik. Undangan roster, bukan daftar umum.'
                : 'Measure maturity, learn, upload evidence, and sign the code of conduct. Roster invite only.'}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={enter} className="rounded-full bg-[var(--ep-primary)] px-6 py-3 text-base font-medium text-[var(--ep-primary-fg)] hover:opacity-90">
                {signedIn ? (isId ? 'Buka portal' : 'Open portal') : (isId ? 'Masuk sekarang' : 'Sign in')}
              </button>
              <a href="#dampak" className="liquid-glass rounded-full px-6 py-3 text-base hover:bg-white/5">
                {isId ? 'Lihat dampak' : 'See impact'}
              </a>
            </div>
          </div>

          <div className="flex w-full max-w-6xl items-center gap-6 overflow-hidden">
            <p className="hidden shrink-0 text-sm text-[var(--ep-fg)]/50 sm:block">
              {isId ? 'Mitra di jaringan Siloam' : 'Partners across Siloam'}
            </p>
            <div className="w-44 overflow-hidden">
              <div className="esg-marquee flex w-max items-center">
                {logos.map(i => (
                  <img key={i} src="/siloam.png" alt="" className="h-8 w-44 object-contain" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-24 px-4 py-20 sm:px-6">
        {heroSlides.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight">{isId ? 'Sorotan' : 'Highlights'}</h2>
            <p className="text-sm italic text-[var(--ep-sub)]">{isId ? 'Dua dulu. Gambarnya ada di dalam.' : 'Two first. Pictures are inside.'}</p>
            {heroSlides.slice(0, 2).map(slide => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setHeroIndex(heroSlides.indexOf(slide))}
                className="block w-full cursor-pointer border-b border-white/10 py-5 text-left"
              >
                <p className="text-sm text-[var(--ep-primary)]">{slide.badgeText}</p>
                <h3 className="mt-1 text-lg font-semibold">{slide.title}</h3>
                <p className="mt-1 text-sm italic text-[var(--ep-sub)]">{slide.subtitle}</p>
              </button>
            ))}
            {heroSlides.length > 2 && (
              <button type="button" onClick={() => setHeroIndex(2)} className="cursor-pointer text-sm font-semibold text-[var(--ep-primary)]">
                {isId ? `Lainnya · ${heroSlides.length - 2}` : `More · ${heroSlides.length - 2}`}
              </button>
            )}
          </section>
        )}

        <section id="cara" className="space-y-8">
          <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            {isId ? 'Tiga langkah' : 'Three steps'}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {(isId
              ? [
                  ['01', 'Masuk dengan email roster', 'Google atau Microsoft. Email harus sudah terdaftar pada vendor.'],
                  ['02', 'Asesmen lalu aksi', '15 soal diagnostik, lalu pilih aksi dan unggah bukti.'],
                  ['03', 'Tinjauan Siloam', 'Admin memverifikasi bukti. Kode etik berlaku satu tahun.'],
                ]
              : [
                  ['01', 'Sign in with a roster email', 'Google or Microsoft. The email must already belong to a vendor.'],
                  ['02', 'Assess, then act', '15 diagnostic questions, then pick an action and upload evidence.'],
                  ['03', 'Siloam review', 'Admins verify evidence. The code of conduct lasts one year.'],
                ]
            ).map(([n, t, d]) => (
              <div key={n} className="p-1">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--ep-primary)] text-sm font-semibold text-[var(--ep-primary-fg)] shadow-[0_0_18px_rgba(135,251,137,0.5)]">{n}</span>
                <h3 className="mt-4 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-[var(--ep-sub)]">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="dampak" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-[var(--ep-primary)]">{isId ? 'Transparansi' : 'Transparency'}</p>
              <h2 className="text-3xl font-semibold tracking-tight">{isId ? 'Dampak ekosistem' : 'Ecosystem impact'}</h2>
            </div>
            {metrics && (
              <p className="text-sm text-[var(--ep-sub)]">
                {metrics.activeVendors} {isId ? 'mitra aktif' : 'active partners'}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            {metricsRow.map(([label, value, icon]) => (
              <div key={String(label)} className="p-1">
                <div className="text-[var(--ep-primary)]">{icon}</div>
                <p className="mt-3 text-lg font-semibold">{value}</p>
                <p className="text-xs text-[var(--ep-sub)]">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <SustainabilityGallery items={galleryItems} />

        <section id="berita" className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">{isId ? 'Artikel' : 'Articles'}</h2>
          <p className="text-sm italic text-[var(--ep-sub)]">{isId ? 'Dua cerita dulu. Sisanya lewat Lainnya.' : 'Two stories first. The rest is under More.'}</p>
          <div>
            {filteredArticles.slice(0, 2).map(article => (
              <button
                key={article.id}
                type="button"
                onClick={() => setArticleIndex(filteredArticles.indexOf(article))}
                className="block w-full cursor-pointer border-b border-white/10 py-5 text-left"
              >
                <p className="text-sm text-[var(--ep-primary)]">{article.category}{article.edition ? ` · ${article.edition}` : ''}</p>
                <h3 className="mt-1 text-lg font-semibold">{article.title}</h3>
                <p className="mt-1 text-sm italic text-[var(--ep-sub)]">{article.subtitle}</p>
              </button>
            ))}
          </div>
          {filteredArticles.length > 2 && (
            <button type="button" onClick={() => setArticleIndex(2)} className="cursor-pointer text-sm font-semibold text-[var(--ep-primary)]">
              {isId ? `Lainnya · ${filteredArticles.length - 2}` : `More · ${filteredArticles.length - 2}`}
            </button>
          )}
          {filteredArticles.length === 0 && (
            <p className="py-10 text-center text-sm text-[var(--ep-sub)]">{isId ? 'Tidak ada artikel.' : 'No articles.'}</p>
          )}
        </section>

        <section id="spotlight" className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight">{isId ? 'Cerita mitra' : 'Partner stories'}</h2>
          <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
            {spotlights.map(spot => (
              <div key={spot.id} className="mb-8 break-inside-avoid">
                <p className="text-xs text-[var(--ep-primary)]">{spot.maturityLevel}</p>
                <h3 className="mt-1 text-lg font-semibold">{spot.vendorName}</h3>
                <p className="text-sm text-[var(--ep-sub)]">{spot.industry} · {spot.location}</p>
                <p className="mt-3 text-sm">{spot.achievementSummary}</p>
                <p className="mt-3 text-2xl font-semibold text-[var(--ep-primary)]">{spot.metricAchieved}</p>
                <p className="text-xs text-[var(--ep-sub)]">{spot.metricLabel}</p>
                {spot.quote && <p className="mt-3 text-sm italic text-[var(--ep-sub)]">“{spot.quote}”</p>}
              </div>
            ))}
          </div>
        </section>

        <section id="edukasi" className="space-y-6">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">{isId ? 'Edukasi terbuka' : 'Open learning'}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {guides.map(guide => (
              <button
                key={guide.id}
                type="button"
                onClick={() => void openGuide(guide.id)}
                className="p-1 text-left"
              >
                <p className="text-xs text-[var(--ep-primary)]">{guide.pillar} · {guide.readTimeMinutes} {isId ? 'mnt' : 'min'}</p>
                <h3 className="mt-2 font-semibold">{guide.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-[var(--ep-sub)]">{guide.summary}</p>
              </button>
            ))}
          </div>
        </section>

        <section id="faq" className="space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight">FAQ</h2>
          {faqs.map(([q, a], i) => (
            <button
              key={q}
              type="button"
              onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
              className={`w-full border-b border-white/10 px-1 py-4 text-left ${openFaq === i ? 'border-l-2 border-l-[var(--ep-primary)] pl-4' : ''}`}
            >
              <span className="flex items-center justify-between gap-3 font-medium">
                {q}
                <ChevronDown className={`h-4 w-4 shrink-0 ${openFaq === i ? 'rotate-180' : ''}`} />
              </span>
              {openFaq === i && <p className="mt-2 text-sm text-[var(--ep-sub)]">{a}</p>}
            </button>
          ))}
        </section>

        <section id="langganan" className="py-4">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">
                {isId ? 'Buletin bulanan' : 'Monthly bulletin'}
              </h2>
              <p className="mt-2 text-sm text-[var(--ep-sub)]">
                {isId ? 'Edisi terbaru langsung ke email. Bisa berhenti kapan saja.' : 'New editions by email. Unsubscribe any time.'}
              </p>
            </div>
            {isSubscribed ? (
              <p className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-[var(--ep-primary)]" /> {isId ? 'Terdaftar.' : 'Subscribed.'}</p>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input
                  value={subscriberName}
                  onChange={e => setSubscriberName(e.target.value)}
                  placeholder={isId ? 'Nama (opsional)' : 'Name (optional)'}
                  className="w-full rounded-full bg-white/5 px-4 py-3 text-sm outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={subscriberEmail}
                    onChange={e => setSubscriberEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full rounded-full bg-white/5 px-4 py-3 text-sm outline-none"
                  />
                  <button type="submit" disabled={isSubmittingSubscribe} className="rounded-full bg-[var(--ep-primary)] px-5 text-sm font-medium text-[var(--ep-primary-fg)]">
                    {isSubmittingSubscribe ? '…' : 'OK'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        <section className="py-10 text-center">
          <Building2 className="mx-auto h-8 w-8 text-[var(--ep-primary)]" />
          <h2 className="mx-auto mt-4 max-w-xl text-3xl font-semibold tracking-tight">
            {isId ? 'Rekanan Siloam yang sudah diundang' : 'Invited Siloam partners'}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--ep-sub)]">
            {isId
              ? 'Masuk dengan email roster, lengkapi profil, lalu asesmen.'
              : 'Sign in with your roster email, finish the profile, then take the assessment.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={onStartOnboarding} className="rounded-full bg-[var(--ep-primary)] px-6 py-3 text-sm font-medium text-[var(--ep-primary-fg)]">
              {isId ? 'Lanjut onboarding' : 'Continue onboarding'}
            </button>
            <button type="button" onClick={() => onNavigateToVendor('assessment')} className="rounded-full px-6 py-3 text-sm text-[var(--ep-sub)]">
              {isId ? 'Asesmen' : 'Assessment'}
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black px-4 py-12 text-sm text-white/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-white/80">Siloam ESG Horizon</p>
            <p className="mt-1 text-xs">© 2026 Siloam Hospitals Group</p>
          </div>
          <div className="flex flex-wrap gap-4">
            {NAV.map(item => (
              <a key={item.href} href={item.href} className="hover:text-white">{isId ? item.id : item.en}</a>
            ))}
            {signedIn && <button type="button" onClick={() => onNavigateToVendor('home')} className="hover:text-white">Portal</button>}
            {signedIn && canAccessAdmin && (
              <button type="button" onClick={onNavigateToAdmin} className="inline-flex items-center gap-1 hover:text-white">
                <ShieldCheck className="h-4 w-4" /> Admin
              </button>
            )}
          </div>
        </div>
      </footer>

      {heroIndex !== null && (
        <div ref={heroScroll} className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-slate-100">
          <div className="sticky top-0 z-10 flex items-center justify-end gap-4 bg-slate-950 px-4 py-3 md:px-6">
            {heroIndex < heroSlides.length - 1 && (
              <button
                type="button"
                onClick={() => {
                  const next = heroIndex + 1;
                  setHeroIndex(next);
                  const el = document.getElementById(`hl-${next}`);
                  if (el && heroScroll.current) heroScroll.current.scrollTo({ top: el.offsetTop - 56, behavior: 'smooth' });
                }}
                className="cursor-pointer text-sm font-semibold text-emerald-400"
              >
                {isId ? 'Berikutnya' : 'Next'}
              </button>
            )}
            <button type="button" onClick={() => setHeroIndex(null)} className="cursor-pointer text-sm font-semibold">
              {isId ? 'Tutup' : 'Close'}
            </button>
          </div>
          <div className="px-4 pb-24 pt-4 md:px-16">
            <TracingBeam container={heroScroll}>
              {heroSlides.map((slide, i) => (
                <section id={`hl-${i}`} key={slide.id} className="mb-28 scroll-mt-16">
                  <p className="text-sm text-emerald-400">{slide.badgeText}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{slide.title}</h2>
                  <img src={slide.imageUrl} alt="" className="mt-6 max-h-96 w-full rounded-lg object-cover" />
                  <p className="mt-4 text-lg italic text-slate-300">{slide.subtitle}</p>
                  {slide.impactBadge && (
                    <p className="mt-4 text-2xl font-semibold text-emerald-400">
                      {slide.impactBadge.value}
                      <span className="ml-2 text-sm font-normal">{slide.impactBadge.label}</span>
                    </p>
                  )}
                </section>
              ))}
            </TracingBeam>
          </div>
        </div>
      )}
      {articleIndex !== null && (
        <div ref={articleScroll} className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-slate-100">
          <div className="sticky top-0 z-10 flex items-center justify-end gap-4 bg-slate-950 px-4 py-3 md:px-6">
            {articleIndex < filteredArticles.length - 1 && (
              <button
                type="button"
                onClick={() => {
                  const next = articleIndex + 1;
                  setArticleIndex(next);
                  const el = document.getElementById(`art-${next}`);
                  if (el && articleScroll.current) articleScroll.current.scrollTo({ top: el.offsetTop - 56, behavior: 'smooth' });
                }}
                className="cursor-pointer text-sm font-semibold text-emerald-400"
              >
                {isId ? 'Berikutnya' : 'Next'}
              </button>
            )}
            <button type="button" onClick={() => setArticleIndex(null)} className="cursor-pointer text-sm font-semibold">
              {isId ? 'Tutup' : 'Close'}
            </button>
          </div>
          <div className="px-4 pb-24 pt-4 md:px-16">
            <TracingBeam container={articleScroll}>
              {(articleFull.length ? articleFull : filteredArticles).map((article, i) => (
                <section id={`art-${i}`} key={article.id} className="mb-28 scroll-mt-16">
                  <p className="text-sm text-emerald-400">{article.category}{article.edition ? ` · ${article.edition}` : ''}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{article.title}</h2>
                  {article.coverImageUrl && <img src={article.coverImageUrl} alt="" className="mt-6 max-h-96 w-full rounded-lg object-cover" />}
                  <p className="mt-4 text-lg italic text-slate-300">{article.subtitle}</p>
                  {article.impactHighlight && (
                    <p className="mt-4 text-2xl font-semibold text-emerald-400">
                      {article.impactHighlight.metricValue}
                      <span className="ml-2 text-sm font-normal">{article.impactHighlight.metricLabel}</span>
                    </p>
                  )}
                  <div className="mt-6 whitespace-pre-line text-base leading-relaxed text-slate-200">{article.content.replace(/\*\*/g, '')}</div>
                </section>
              ))}
            </TracingBeam>
          </div>
        </div>
      )}
      <ArticleReaderModal article={activeArticle} onClose={() => setActiveArticle(null)} onLike={handleLike} onNavigateToPortal={onStartOnboarding} />
      <GuideReaderModal guide={activeGuide} onClose={() => setActiveGuide(null)} />
    </div>
  );
};
