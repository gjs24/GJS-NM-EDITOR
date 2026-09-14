import { BoardTemplate, GoogleUserProfile } from '../types/template';
import { storageService } from './storageService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '';

export const apiService = {
  isBackendConfigured(): boolean {
    return Boolean(API_BASE_URL);
  },

  getBaseUrl(): string {
    return API_BASE_URL;
  },

  /**
   * Fetch templates from Render backend (backed by Supabase)
   */
  async getPublishedTemplates(): Promise<BoardTemplate[]> {
    if (!API_BASE_URL) {
      return storageService.getPublishedTemplates();
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/templates`);
      if (res.ok) {
        const cloudTemplates: BoardTemplate[] = await res.json();
        if (Array.isArray(cloudTemplates) && cloudTemplates.length > 0) {
          // Keep local storage warm with latest cloud data
          storageService.saveAllTemplates(cloudTemplates);
          return cloudTemplates;
        }
      }
    } catch (err) {
      console.warn('Backend unavailable, falling back to local templates:', err);
    }
    return storageService.getPublishedTemplates();
  },

  /**
   * Fetch all templates for Admin
   */
  async getAllTemplates(): Promise<BoardTemplate[]> {
    if (!API_BASE_URL) {
      return storageService.getAllTemplates();
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/templates/all`);
      if (res.ok) {
        const cloudTemplates: BoardTemplate[] = await res.json();
        if (Array.isArray(cloudTemplates) && cloudTemplates.length > 0) {
          storageService.saveAllTemplates(cloudTemplates);
          return cloudTemplates;
        }
      }
    } catch (err) {
      console.warn('Backend unavailable, falling back to local templates:', err);
    }
    return storageService.getAllTemplates();
  },

  /**
   * Save template to Render backend & Supabase
   */
  async saveTemplate(template: BoardTemplate): Promise<BoardTemplate> {
    // Always save locally first for instant UI response
    const local = storageService.saveTemplate(template);

    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/templates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(template)
        });
        if (res.ok) {
          const savedCloud = await res.json();
          return savedCloud;
        }
      } catch (err) {
        console.warn('Failed to sync template to Render backend:', err);
      }
    }
    return local;
  },

  /**
   * Delete template from Render backend & Supabase
   */
  async deleteTemplate(id: string): Promise<void> {
    storageService.deleteTemplate(id);

    if (API_BASE_URL) {
      try {
        await fetch(`${API_BASE_URL}/api/templates/${id}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.warn('Failed to sync template deletion to backend:', err);
      }
    }
  },

  /**
   * Sync user purchases from Supabase via Render backend
   */
  async getUserPurchases(userId: string): Promise<string[]> {
    if (!API_BASE_URL || !userId) return [];
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(userId)}/purchases`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to fetch purchases from Render backend:', err);
    }
    return [];
  },

  /**
   * Record purchase on Render backend & Supabase
   */
  async recordPurchase(userId: string, templateId: string, orderId?: string, referenceId?: string, amount?: number, paymentMode?: string) {
    if (!API_BASE_URL || !userId || !templateId) return;
    try {
      await fetch(`${API_BASE_URL}/api/users/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          templateId,
          orderId,
          referenceId,
          amount,
          paymentMode
        })
      });
    } catch (err) {
      console.warn('Failed to record purchase on Render backend:', err);
    }
  }
};

