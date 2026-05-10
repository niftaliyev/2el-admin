import api from '@/utils/api';
import { HelpCategory, StaticPage, LegalPolicy, PrivacyPolicy } from '@/types/admin';

export const helpService = {
  getContent: async (): Promise<HelpCategory[]> => {
    const response = await api.get<HelpCategory[]>('/help/content');
    return response.data;
  },

  getStaticPages: async (): Promise<StaticPage[]> => {
    const response = await api.get<StaticPage[]>('/help/pages');
    return response.data;
  },

  getLegalPolicies: async (): Promise<LegalPolicy[]> => {
    const response = await api.get<LegalPolicy[]>('/help/legal');
    return response.data;
  },

  getPrivacyPolicy: async (slug: string): Promise<PrivacyPolicy> => {
    const response = await api.get<PrivacyPolicy>(`/help/privacy/${slug}`);
    return response.data;
  }
};
