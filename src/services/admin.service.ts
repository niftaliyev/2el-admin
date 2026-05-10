import api from '@/utils/api';

class AdminService {
  async getStats(): Promise<any> {
    const response = await api.get('/admin/stats');
    return response.data;
  }

  // ── Ads ───────────────────────────────────────────────────────────────────

  async getAds(page = 1, pageSize = 10, status?: string, searchTerm?: string, sortBy?: string, isAscending?: boolean): Promise<any> {
    const params: any = { page, pageSize };
    if (status && status !== 'all') {
      const statusMap: Record<string, number> = {
        'pending': 0,
        'active': 1,
        'rejected': 3,
        'expired': 2
      };
      if (statusMap[status] !== undefined) params.status = statusMap[status];
    }
    if (searchTerm) params.searchTerm = searchTerm;
    if (sortBy) params.sortBy = sortBy;
    if (isAscending !== undefined) params.isAscending = isAscending;

    const response = await api.get('/admin/ads', { params });
    return response.data;
  }

  async approveAd(id: string): Promise<void> {
    await api.patch(`/admin/ads/${id}/status`, 1, { headers: { 'Content-Type': 'application/json' } });
  }

  async getAdById(id: string): Promise<any> {
    const response = await api.get(`/admin/ads/${id}`);
    return response.data;
  }

  async updateAdStatus(id: string, status: number): Promise<void> {
    await api.patch(`/admin/ads/${id}/status`, status, { headers: { 'Content-Type': 'application/json' } });
  }

  async rejectAd(id: string, reason?: string): Promise<void> {
    await api.post(`/admin/ads/${id}/reject`, { reason });
  }

  async deleteAd(id: string): Promise<void> {
    await api.delete(`/admin/ads/${id}`);
  }

  async featureAd(id: string): Promise<void> {
    await this.approveAd(id);
  }

  async unfeatureAd(_id: string): Promise<void> {
    console.warn('Admin unfeatureAd not yet implemented in backend');
  }

  async getAllAds(): Promise<any[]> {
    const data = await this.getAds(1, 100);
    return data.data ?? [];
  }

  async bulkAdAction(payload: { ids: string[]; action: string; status?: number; reason?: string }): Promise<void> {
    await api.post('/admin/ads/bulk', payload);
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  async getUsers(page = 1, pageSize = 10, status?: string, searchTerm?: string, sortBy?: string, isAscending?: boolean): Promise<any> {
    const response = await api.get('/admin/users', {
      params: { page, pageSize, status, searchTerm, sortBy, isAscending },
    });
    return response.data;
  }

  async getAllUsers(): Promise<any[]> {
    const data = await this.getUsers(1, 100);
    return data.data ?? [];
  }

  async getUserById(id: string): Promise<any> {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  }

  async creditUser(dto: { userId: string; amount: number; increaseBalanceId?: string }): Promise<void> {
    await api.post('/admin/increase-balance', dto);
  }

  async getPendingBalanceIncreases(page = 1, pageSize = 10): Promise<any> {
    const response = await api.get('/admin/pending-balance-increase', {
      params: { page, pageSize }
    });
    return response.data;
  }

  async updateUserStatus(id: string, isBlocked: boolean): Promise<void> {
    await api.patch(`/admin/users/${id}/status`, isBlocked, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async suspendUser(id: string): Promise<void> {
    await this.updateUserStatus(id, true);
  }

  async activateUser(id: string): Promise<void> {
    await this.updateUserStatus(id, false);
  }

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  }

  async bulkUserAction(payload: { ids: string[]; action: string }): Promise<void> {
    await api.post('/admin/users/bulk', payload);
  }

  async getRoles(): Promise<any[]> {
    const response = await api.get<any[]>('/admin/roles');
    return response.data ?? [];
  }

  async setUserRoles(userId: string, roles: string[]): Promise<void> {
    await api.post(`/admin/users/${userId}/roles`, roles);
  }

  // ── Reports ────────────────────────────────────────────────────────────────

  async getAdReports(page = 1, pageSize = 10, status?: any): Promise<any> {
    const response = await api.get('/admin/reports/ad', {
      params: { page, pageSize, status },
    });
    return response.data;
  }

  async getStoreReports(page = 1, pageSize = 10, status?: any): Promise<any> {
    const response = await api.get('/admin/reports/store', {
      params: { page, pageSize, status },
    });
    return response.data;
  }

  async updateAdReportStatus(id: string, status: number): Promise<void> {
    await api.patch(`/admin/reports/ad/${id}/status`, status, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async updateStoreReportStatus(id: string, status: number): Promise<void> {
    await api.patch(`/admin/reports/store/${id}/status`, status, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async deleteAdReport(id: string): Promise<void> {
    await api.delete(`/admin/reports/ad/${id}`);
  }

  async deleteStoreReport(id: string): Promise<void> {
    await api.delete(`/admin/reports/store/${id}`);
  }

  // ── Payment & System Settings ─────────────────────────────────────────────

  async updatePaymentDetail(content: string): Promise<void> {
    await api.post('/admin/payment-detail', { content });
  }

  async updateSystemSettings(minStoreBalance: number): Promise<void> {
    await api.post('/admin/system-settings', { minStoreBalance });
  }

  async getPaymentDetail(): Promise<{ content: string }> {
    const response = await api.get('/admin/payment-detail');
    return response.data;
  }
 
  async getMinStoreBalance(): Promise<number> {
    const response = await api.get<{ minBalance: number }>('/admin/system-settings');
    return response.data.minBalance;
  }

  // ── Business Packages ─────────────────────────────────────────────────────

  async getAdminBusinessPackages(): Promise<any[]> {
    const response = await api.get<any[]>('/admin/business-packages');
    return response.data ?? [];
  }

  async upsertBusinessPackage(pkg: any): Promise<void> {
    await api.post('/admin/business-packages', pkg);
  }

  async deleteBusinessPackage(id: string): Promise<void> {
    await api.delete(`/admin/business-packages/${id}`);
  }

  async getUserBusinessPackages(): Promise<any[]> {
    const response = await api.get<any[]>('/admin/user-business-packages');
    return response.data ?? [];
  }

  // ── Company Settings ──────────────────────────────────────────────────────

  async getCompanySettings(): Promise<any> {
    const response = await api.get('/admin/company-settings');
    return response.data;
  }

  async updateCompanySettings(data: any): Promise<void> {
    await api.post('/admin/company-settings', data);
  }

  // ── Seed Data ─────────────────────────────────────────────────────────────

  async getSeedDataCars(): Promise<string> {
    const response = await api.get<string>('/admin/seed-data/cars');
    return response.data;
  }

  async updateSeedDataCars(json: string): Promise<void> {
    await api.post('/admin/seed-data/cars', json, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async getSeedDataPhones(): Promise<string> {
    const response = await api.get<string>('/admin/seed-data/phones');
    return response.data;
  }

  async updateSeedDataPhones(json: string): Promise<void> {
    await api.post('/admin/seed-data/phones', json, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async syncSeedData(): Promise<void> {
    await api.post('/admin/seed-data/sync');
  }

  // ── Help Management ───────────────────────────────────────────────────────

  async upsertHelpCategory(data: any): Promise<any> {
    const response = await api.post('/admin/help/category', data);
    return response.data;
  }

  async deleteHelpCategory(id: string): Promise<void> {
    await api.delete(`/admin/help/category/${id}`);
  }

  async upsertHelpItem(categoryId: string, data: any): Promise<any> {
    const response = await api.post(`/admin/help/category/${categoryId}/item`, data);
    return response.data;
  }

  async deleteHelpItem(id: string): Promise<void> {
    await api.delete(`/admin/help/item/${id}`);
  }

  async upsertStaticPage(data: any): Promise<any> {
    const response = await api.post('/admin/help/pages', data);
    return response.data;
  }

  async deleteStaticPage(id: string): Promise<void> {
    await api.delete(`/admin/help/pages/${id}`);
  }

  async upsertLegalPolicy(data: any): Promise<any> {
    const response = await api.post('/admin/help/legal', data);
    return response.data;
  }

  async deleteLegalPolicy(id: string): Promise<void> {
    await api.delete(`/admin/help/legal/${id}`);
  }

  async upsertPrivacyPolicy(data: any): Promise<any> {
    const response = await api.post('/admin/help/privacy', data);
    return response.data;
  }

  async deletePrivacyPolicy(id: string): Promise<void> {
    await api.delete(`/admin/help/privacy/${id}`);
  }

  // ── Advertising Applications ──────────────────────────────────────────────

  async getAdApplications(page = 1, pageSize = 10, isProcessed?: boolean): Promise<any> {
    const response = await api.get('/admin/ad-applications', {
      params: { page, pageSize, isProcessed },
    });
    return response.data;
  }

  async updateAdApplicationStatus(id: string, isProcessed: boolean, adminNote?: string): Promise<void> {
    await api.patch(`/admin/ad-applications/${id}/status`, { isProcessed, adminNote });
  }

  // ── Commercial Banners ────────────────────────────────────────────────────

  async getBanners(): Promise<any[]> {
    const response = await api.get<any[]>('/admin/banners');
    return response.data ?? [];
  }

  async upsertBanner(banner: any): Promise<void> {
    const formData = new FormData();
    Object.keys(banner).forEach(key => {
      if (banner[key] !== null && banner[key] !== undefined) {
        if (key === 'imageFile' && banner[key] instanceof File) {
          formData.append('ImageFile', banner[key]);
        } else {
          formData.append(key.charAt(0).toUpperCase() + key.slice(1), banner[key]);
        }
      }
    });
    await api.post('/admin/banners', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  async deleteBanner(id: string): Promise<void> {
    await api.delete(`/admin/banners/${id}`);
  }

  // ── Categories & SubCategories ──────────────────────────────────────────

  async getAdminCategories(): Promise<any[]> {
    const response = await api.get<any[]>('/admin/categories');
    return response.data ?? [];
  }

  async upsertCategory(category: any): Promise<void> {
    const formData = new FormData();
    Object.keys(category).forEach(key => {
      if (category[key] !== null && category[key] !== undefined) {
        if (key === 'image' && category[key] instanceof File) {
          formData.append('Image', category[key]);
        } else {
          formData.append(key.charAt(0).toUpperCase() + key.slice(1), category[key]);
        }
      }
    });
    await api.post('/admin/categories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/admin/categories/${id}`);
  }

  async upsertSubCategory(subCategory: any): Promise<void> {
    const formData = new FormData();
    Object.keys(subCategory).forEach(key => {
      if (subCategory[key] !== null && subCategory[key] !== undefined) {
        if (key === 'image' && subCategory[key] instanceof File) {
          formData.append('Image', subCategory[key]);
        } else {
          formData.append(key.charAt(0).toUpperCase() + key.slice(1), subCategory[key]);
        }
      }
    });
    await api.post('/admin/subcategories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  async deleteSubCategory(id: string): Promise<void> {
    await api.delete(`/admin/subcategories/${id}`);
  }

  // ── Category Fields ───────────────────────────────────────────────────

  async getCategoryFields(categoryId: string): Promise<any[]> {
    const response = await api.get<any[]>(`/admin/categories/${categoryId}/fields`);
    return response.data ?? [];
  }

  async upsertCategoryField(field: any): Promise<void> {
    await api.post('/admin/categories/fields', field);
  }

  async deleteCategoryField(id: string): Promise<void> {
    await api.delete(`/admin/categories/fields/${id}`);
  }

  // ── Lookups ───────────────────────────────────────────────────────────────

  async getCategoryTree(): Promise<any[]> {
    const response = await api.get<any[]>('/lookup/categories');
    return response.data ?? [];
  }

  async getCities(): Promise<any[]> {
    const response = await api.get<any[]>('/lookup/cities');
    return response.data ?? [];
  }
}

export const adminService = new AdminService();
