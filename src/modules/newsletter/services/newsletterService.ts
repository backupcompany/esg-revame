import {
  NewsletterArticle,
  PublicLearningGuide,
  NewsletterSubscriber,
  PublicVendorSpotlight,
  HeroCarouselSlide,
  SustainabilityGalleryItem
} from '../types';
import { EcosystemMetrics } from '../../../core/types';
import { impactService } from '../../../core/services/impactService';
import { apiDelete, apiGet, apiPost, publicGet, publicPost } from '../../../core/services/api';
import { PLACEHOLDER_IMAGE } from '../../../core/ui/assets';

function cmsId(prefix: string, existing?: string): string {
  if (existing && /^[a-z0-9_-]{3,80}$/.test(existing)) return existing;
  return `${prefix}_${Date.now().toString(36)}`;
}

export class NewsletterService {
  public async getHeroSlides(onlyPublished = true): Promise<HeroCarouselSlide[]> {
    if (onlyPublished) {
      const data = await publicGet<{ slides: HeroCarouselSlide[] }>('/api/public/hero?limit=10');
      return data?.slides ?? [];
    }
    const data = await apiGet<{ slides: HeroCarouselSlide[] }>('/api/admin/cms/hero?limit=50');
    return data?.slides ?? [];
  }

  public async saveHeroSlide(slideData: Partial<HeroCarouselSlide>): Promise<HeroCarouselSlide> {
    const slide: HeroCarouselSlide = {
      id: cmsId('slide', slideData.id),
      title: slideData.title || 'Inisiatif Keberlanjutan Siloam',
      subtitle: slideData.subtitle || '',
      badgeText: slideData.badgeText || 'ESG Horizon',
      category: slideData.category || 'Siloam Initiative',
      imageUrl: slideData.imageUrl || PLACEHOLDER_IMAGE,
      overlayGradient: slideData.overlayGradient || 'emerald',
      impactBadge: slideData.impactBadge,
      ctaPrimaryText: slideData.ctaPrimaryText || 'Baca Selengkapnya',
      ctaPrimaryAction: slideData.ctaPrimaryAction || 'article',
      targetArticleId: slideData.targetArticleId,
      ctaSecondaryText: slideData.ctaSecondaryText,
      ctaSecondaryAction: slideData.ctaSecondaryAction || 'onboarding',
      order: slideData.order ?? 1,
      isPublished: slideData.isPublished !== undefined ? slideData.isPublished : true
    };
    const saved = await apiPost<{ success: boolean }>('/api/admin/cms/hero', slide);
    if (!saved?.success) throw new Error('hero save failed');
    return slide;
  }

  public async deleteHeroSlide(id: string): Promise<void> {
    const ok = await apiDelete<{ success: boolean }>(`/api/admin/cms/hero/${encodeURIComponent(id)}`);
    if (!ok?.success) throw new Error('hero delete failed');
  }

  public async getSustainabilityGallery(category?: string, onlyPublished = true): Promise<SustainabilityGalleryItem[]> {
    const params = new URLSearchParams({ limit: '50' });
    if (category && category !== 'Semua') params.set('category', category);
    if (onlyPublished) {
      const data = await publicGet<{ items: SustainabilityGalleryItem[] }>(`/api/public/gallery?${params}`);
      return data?.items ?? [];
    }
    const data = await apiGet<{ items: SustainabilityGalleryItem[] }>(`/api/admin/cms/gallery?${params}`);
    const items = data?.items ?? [];
    return category && category !== 'Semua' ? items.filter(g => g.category === category) : items;
  }

  public async saveGalleryItem(galleryData: Partial<SustainabilityGalleryItem>): Promise<SustainabilityGalleryItem> {
    const item: SustainabilityGalleryItem = {
      id: cmsId('gal', galleryData.id),
      title: galleryData.title || 'Dokumentasi Fasilitas Hijau',
      hospitalUnit: galleryData.hospitalUnit || 'Siloam Hospitals Group',
      category: galleryData.category || 'Energi Bersih',
      imageUrl: galleryData.imageUrl || PLACEHOLDER_IMAGE,
      caption: galleryData.caption || '',
      year: galleryData.year || new Date().getFullYear().toString(),
      metricTag: galleryData.metricTag,
      isPublished: galleryData.isPublished !== undefined ? galleryData.isPublished : true
    };
    const saved = await apiPost<{ success: boolean }>('/api/admin/cms/gallery', item);
    if (!saved?.success) throw new Error('gallery save failed');
    return item;
  }

  public async deleteGalleryItem(id: string): Promise<void> {
    const ok = await apiDelete<{ success: boolean }>(`/api/admin/cms/gallery/${encodeURIComponent(id)}`);
    if (!ok?.success) throw new Error('gallery delete failed');
  }

  public async getPublishedArticles(category?: string): Promise<NewsletterArticle[]> {
    const params = new URLSearchParams({ limit: '20' });
    if (category && category !== 'All') params.set('category', category);
    const data = await publicGet<{ articles: NewsletterArticle[] }>(`/api/public/articles?${params}`);
    return data?.articles ?? [];
  }

  public async getAllArticles(): Promise<NewsletterArticle[]> {
    const data = await apiGet<{ articles: NewsletterArticle[] }>('/api/admin/cms/articles?limit=50');
    return data?.articles ?? [];
  }

  public async getArticleById(id: string): Promise<NewsletterArticle | null> {
    const pub = await publicGet<{ article: NewsletterArticle }>(`/api/public/articles/${encodeURIComponent(id)}`);
    if (pub?.article) return pub.article;
    const admin = await apiGet<{ article: NewsletterArticle }>(`/api/admin/cms/articles/${encodeURIComponent(id)}`);
    if (admin?.article) return admin.article;
    return null;
  }

  public async saveArticle(articleData: Partial<NewsletterArticle>): Promise<NewsletterArticle> {
    const article: NewsletterArticle = {
      id: cmsId('art', articleData.id),
      title: articleData.title || 'Untitled Story',
      subtitle: articleData.subtitle || '',
      content: articleData.content || '',
      category: articleData.category || 'Siloam Initiative',
      author: articleData.author || 'Tim Keberlanjutan Siloam',
      authorRole: articleData.authorRole || 'ESG Editor',
      publishedDate: articleData.publishedDate || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      edition: articleData.edition || 'Edisi Terkini',
      readTimeMinutes: articleData.readTimeMinutes || 3,
      coverImageUrl: articleData.coverImageUrl || PLACEHOLDER_IMAGE,
      featured: articleData.featured || false,
      isPublished: articleData.isPublished !== undefined ? articleData.isPublished : true,
      tags: articleData.tags || ['Siloam ESG'],
      vendorName: articleData.vendorName,
      impactHighlight: articleData.impactHighlight,
      likesCount: articleData.likesCount || 0
    };
    const saved = await apiPost<{ success: boolean }>('/api/admin/cms/articles', article);
    if (!saved?.success) throw new Error('article save failed');
    return article;
  }

  public async deleteArticle(id: string): Promise<void> {
    const ok = await apiDelete<{ success: boolean }>(`/api/admin/cms/articles/${encodeURIComponent(id)}`);
    if (!ok?.success) throw new Error('article delete failed');
  }

  public async likeArticle(id: string): Promise<number> {
    const data = await publicPost<{ likesCount: number }>(`/api/public/articles/${encodeURIComponent(id)}/like`, {});
    return typeof data?.likesCount === 'number' ? data.likesCount : 0;
  }

  public async getPublicGuides(pillar?: string, onlyPublished = true): Promise<PublicLearningGuide[]> {
    const params = new URLSearchParams({ limit: '50' });
    if (pillar && pillar !== 'All') params.set('pillar', pillar);
    if (onlyPublished) {
      const data = await publicGet<{ guides: PublicLearningGuide[] }>(`/api/public/guides?${params}`);
      return data?.guides ?? [];
    }
    const data = await apiGet<{ guides: PublicLearningGuide[] }>(`/api/admin/cms/guides?${params}`);
    const guides = data?.guides ?? [];
    return pillar && pillar !== 'All' ? guides.filter(g => g.pillar === pillar) : guides;
  }

  public async getGuideById(id: string): Promise<PublicLearningGuide | null> {
    const pub = await publicGet<{ guide: PublicLearningGuide }>(`/api/public/guides/${encodeURIComponent(id)}`);
    if (pub?.guide) return pub.guide;
    const admin = await apiGet<{ guide: PublicLearningGuide }>(`/api/admin/cms/guides/${encodeURIComponent(id)}`);
    if (admin?.guide) return admin.guide;
    return null;
  }

  public async savePublicGuide(guideData: Partial<PublicLearningGuide>): Promise<PublicLearningGuide> {
    const guide: PublicLearningGuide = {
      id: cmsId('guide', guideData.id),
      title: guideData.title || 'Panduan Keberlanjutan',
      pillar: guideData.pillar || 'General',
      category: guideData.category || 'Edukasi ESG',
      summary: guideData.summary || '',
      content: guideData.content || '',
      keyTakeaways: guideData.keyTakeaways || [],
      readTimeMinutes: guideData.readTimeMinutes || 4,
      iconName: guideData.iconName || 'BookOpen',
      targetAudience: guideData.targetAudience || 'Untuk Publik & Mitra'
    };
    const saved = await apiPost<{ success: boolean }>('/api/admin/cms/guides', guide);
    if (!saved?.success) throw new Error('guide save failed');
    return guide;
  }

  public async deletePublicGuide(id: string): Promise<void> {
    const ok = await apiDelete<{ success: boolean }>(`/api/admin/cms/guides/${encodeURIComponent(id)}`);
    if (!ok?.success) throw new Error('guide delete failed');
  }

  public async getSpotlights(onlyPublished = true): Promise<PublicVendorSpotlight[]> {
    if (onlyPublished) {
      const data = await publicGet<{ spotlights: PublicVendorSpotlight[] }>('/api/public/spotlights?limit=20');
      return data?.spotlights ?? [];
    }
    const data = await apiGet<{ spotlights: PublicVendorSpotlight[] }>('/api/admin/cms/spotlights?limit=50');
    return data?.spotlights ?? [];
  }

  public async saveSpotlight(spotlightData: Partial<PublicVendorSpotlight>): Promise<PublicVendorSpotlight> {
    const spotlight: PublicVendorSpotlight = {
      id: cmsId('spot', spotlightData.id),
      vendorName: spotlightData.vendorName || '',
      industry: spotlightData.industry || '',
      location: spotlightData.location || '',
      maturityLevel: spotlightData.maturityLevel || 'Starter',
      badgeTitle: spotlightData.badgeTitle || '',
      achievementSummary: spotlightData.achievementSummary || '',
      metricAchieved: spotlightData.metricAchieved || '',
      metricLabel: spotlightData.metricLabel || '',
      quote: spotlightData.quote || '',
      quotePerson: spotlightData.quotePerson || '',
      facilityImageUrl: spotlightData.facilityImageUrl || PLACEHOLDER_IMAGE,
      logoUrl: spotlightData.logoUrl,
      isPublished: spotlightData.isPublished !== undefined ? spotlightData.isPublished : true
    };
    const saved = await apiPost<{ success: boolean }>('/api/admin/cms/spotlights', spotlight);
    if (!saved?.success) throw new Error('spotlight save failed');
    return spotlight;
  }

  public async deleteSpotlight(id: string): Promise<void> {
    const ok = await apiDelete<{ success: boolean }>(`/api/admin/cms/spotlights/${encodeURIComponent(id)}`);
    if (!ok?.success) throw new Error('spotlight delete failed');
  }

  public async subscribeNewsletter(email: string, name?: string, organization?: string): Promise<NewsletterSubscriber> {
    const subscriber: NewsletterSubscriber = {
      id: `sub_${Date.now()}`,
      email: email.trim().toLowerCase(),
      name: name?.trim(),
      organization: organization?.trim(),
      subscribedAt: new Date().toISOString()
    };
    const saved = await publicPost<{ success: boolean }>('/api/public/subscribe', {
      email: subscriber.email,
      name: subscriber.name,
      organization: subscriber.organization
    });
    if (!saved?.success) throw new Error('subscribe failed');
    return subscriber;
  }

  public async getSubscribers(): Promise<NewsletterSubscriber[]> {
    const data = await apiGet<{ subscribers: NewsletterSubscriber[] }>('/api/admin/cms/subscribers?limit=100');
    return data?.subscribers ?? [];
  }

  public async getEcosystemMetrics(): Promise<EcosystemMetrics> {
    const data = await publicGet<{ metrics: EcosystemMetrics }>('/api/public/metrics');
    if (data?.metrics) return data.metrics;
    return impactService.getCollectiveImpact();
  }
}

export const newsletterService = new NewsletterService();
