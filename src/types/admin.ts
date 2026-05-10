// Admin Types

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'suspended' | 'banned';
  registeredAt: string;
  lastLogin: string;
  adsCount: number;
  profilePhoto?: string;
  isAdmin?: boolean;
  roles: string[];
}

export interface AdminRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface AdminAd {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  location: string;
  seller: {
    id: string;
    name: string;
    email: string;
  };
  status: 'active' | 'pending' | 'rejected' | 'expired';
  isVip: boolean;
  isPremium: boolean;
  isFeatured: boolean;
  isBoosted: boolean;
  createdAt: string;
  viewCount: number;
  rejectionReason?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalAds: number;
  pendingApprovals: number;
  activeAds: number;
  totalRevenue: number;
  todayUsers: number;
  todayAds: number;
}

export interface AdminReport {
  id: string;
  adId?: string;
  adTitle?: string;
  adSlug?: string;
  storeInformationId?: string;
  storeName?: string;
  storeSlug?: string;
  reporterId: string;
  reporterName: string;
  note: string;
  reason: string;
  status: 'Pending' | 'InReview' | 'Resolved' | 'Rejected';
  createdDate: string;
}

export interface HelpItem {
  id: string;
  question: string;
  questionRu?: string;
  answer: string;
  answerRu?: string;
  displayOrder: number;
}

export interface HelpCategory {
  id: string;
  name: string;
  nameRu?: string;
  slug: string;
  displayOrder: number;
  helpItems: HelpItem[];
}

export interface StaticPage {
  id: string;
  title: string;
  titleRu?: string;
  slug: string;
  content: string;
  contentRu?: string;
  displayOrder: number;
}

export interface LegalPolicy {
  id: string;
  title: string;
  titleRu?: string;
  slug: string;
  content: string;
  contentRu?: string;
  version: string;
  publishedDate: string;
  effectiveDate: string;
  displayOrder: number;
}

export interface PrivacyPolicy {
  id: string;
  title: string;
  titleRu?: string;
  slug: string;
  content: string;
  contentRu?: string;
  version: string;
  publishedDate: string;
  effectiveDate: string;
}
