import api from '@/utils/api';

export interface SeoPageDto {
  id?: string;
  slug: string;
  titleH1: string;
  contentTop?: string;
  titleH2?: string;
  contentBottom?: string;
  categoryId?: string;
  categoryName?: string;
  adIds?: string[];
  ads?: { id: string; title: string; pinCode: number }[];
}

export interface SearchQueryDto {
  id: string;
  query: string;
  count: number;
  createdDate: string;
  updatedDate?: string;
}

export const seoService = {
  getPages: async (): Promise<SeoPageDto[]> => {
    const response = await api.get<SeoPageDto[]>('/admin/seo/pages');
    return response.data;
  },

  getPageById: async (id: string): Promise<SeoPageDto> => {
    const response = await api.get<SeoPageDto>(`/admin/seo/pages/${id}`);
    return response.data;
  },

  createPage: async (data: SeoPageDto): Promise<void> => {
    await api.post('/admin/seo/pages', data);
  },

  updatePage: async (id: string, data: SeoPageDto): Promise<void> => {
    await api.put(`/admin/seo/pages/${id}`, data);
  },

  deletePage: async (id: string): Promise<void> => {
    await api.delete(`/admin/seo/pages/${id}`);
  },

  getSearches: async (): Promise<SearchQueryDto[]> => {
    const response = await api.get<SearchQueryDto[]>('/admin/seo/searches');
    return response.data;
  },

  deleteSearch: async (id: string): Promise<void> => {
    await api.delete(`/admin/seo/searches/${id}`);
  }
};
