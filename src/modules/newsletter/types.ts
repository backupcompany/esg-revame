export type ArticleCategory =
  | 'All'
  | 'Environmental'
  | 'Social'
  | 'Governance'
  | 'Siloam Initiative'
  | 'Vendor Spotlight';

export interface NewsletterArticle {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  category: 'Environmental' | 'Social' | 'Governance' | 'Siloam Initiative' | 'Vendor Spotlight';
  author: string;
  authorRole: string;
  publishedDate: string;
  edition: string;
  readTimeMinutes: number;
  coverImageUrl?: string;
  featured: boolean;
  isPublished: boolean;
  tags: string[];
  vendorName?: string;
  impactHighlight?: {
    metricValue: string;
    metricLabel: string;
  };
  likesCount?: number;
}

export interface PublicLearningGuide {
  id: string;
  title: string;
  pillar: 'E' | 'S' | 'G' | 'General';
  category: string;
  summary: string;
  content: string;
  keyTakeaways: string[];
  readTimeMinutes: number;
  iconName: string;
  targetAudience: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  organization?: string;
  subscribedAt: string;
}

export type GradientOverlayStyle = 'emerald' | 'sapphire' | 'forest' | 'dark' | 'sunset';

export interface HeroCarouselSlide {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string;
  category: 'Siloam Initiative' | 'Green Hospital' | 'Vendor Milestone' | 'Community Impact' | 'Circular Economy';
  imageUrl: string;
  overlayGradient: GradientOverlayStyle;
  impactBadge?: {
    value: string;
    label: string;
  };
  ctaPrimaryText: string;
  ctaPrimaryAction: 'article' | 'onboarding' | 'vendor' | 'custom';
  targetArticleId?: string;
  ctaSecondaryText?: string;
  ctaSecondaryAction?: 'onboarding' | 'vendor' | 'contact' | 'custom';
  order: number;
  isPublished: boolean;
}

export interface SustainabilityGalleryItem {
  id: string;
  title: string;
  hospitalUnit: string;
  category: 'Energi Bersih' | 'Manajemen Limbah' | 'Konservasi Air' | 'K3 & Sosial' | 'Fasilitas Hijau';
  imageUrl: string;
  caption: string;
  year: string;
  metricTag?: string;
  isPublished: boolean;
}

export interface PublicVendorSpotlight {
  id: string;
  vendorName: string;
  industry: string;
  location: string;
  maturityLevel: 'Starter' | 'Bronze' | 'Silver' | 'Gold' | 'Champion';
  badgeTitle: string;
  achievementSummary: string;
  metricAchieved: string;
  metricLabel: string;
  quote: string;
  quotePerson: string;
  facilityImageUrl?: string;
  logoUrl?: string;
  isPublished: boolean;
}
