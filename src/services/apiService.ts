import { BoardTemplate, GoogleUserProfile } from '../types/template';
import { storageService } from './storageService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '';

function getApiUrl(path: string): string {
  if (API_BASE_URL) {
    return `${API_BASE_URL}${path}`;
  }
  // When deployed on Vercel, serverless functions live on the same origin under /api/*
  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    return path;
  }
  return '';
}

export const apiService = {
  isBackendConfigured(): boolean {
    return Boolean(API_BASE_URL) || (typeof window !== 'undefined' && window.location.hostname !== 'localhost');
  },

  getBaseUrl(): string {
    return API_BASE_URL;
  },

  /**
   * Fetch templates from Cloud / Neon PostgreSQL with robust local merge
   */
  async getPublishedTemplates(): Promise<BoardTemplate[]> {
    const url = getApiUrl('/api/templates');
    if (url) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const cloudTemplates: BoardTemplate[] = await res.json();
          if (Array.isArray(cloudTemplates) && cloudTemplates.length > 0) {
            const merged = this.mergeWithLocalTemplates(cloudTemplates);
            return merged.filter((t) => t.published !== false);
          }
        }
      } catch (err) {
        console.warn('API unavailable, using local templates:', err);
      }
    }
    return storageService.getPublishedTemplates();
  },

  /**
   * Fetch all templates for Admin
   */
  async getAllTemplates(): Promise<BoardTemplate[]> {
    const url = API_BASE_URL ? `${API_BASE_URL}/api/templates/all` : getApiUrl('/api/templates?all=true');
    if (url) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const cloudTemplates: BoardTemplate[] = await res.json();
          if (Array.isArray(cloudTemplates) && cloudTemplates.length > 0) {
            return this.mergeWithLocalTemplates(cloudTemplates);
          }
        }
      } catch (err) {
        console.warn('API unavailable, using local templates:', err);
      }
    }
    return storageService.getAllTemplates();
  },

  /**
   * Helper to merge cloud templates with local changes so local edits are never lost
   */
  mergeWithLocalTemplates(cloudTemplates: BoardTemplate[]): BoardTemplate[] {
    const local = storageService.getAllTemplates();
    const localMap = new Map(local.map((t) => [t.id, t]));

    const merged: BoardTemplate[] = cloudTemplates.map((cloud) => {
      const loc = localMap.get(cloud.id);
      if (!loc) return cloud;
      localMap.delete(cloud.id);

      // Keep whichever version was updated more recently
      const locTime = new Date(loc.updatedAt || 0).getTime();
      const cloudTime = new Date(cloud.updatedAt || 0).getTime();
      return locTime > cloudTime ? loc : cloud;
    });

    // Keep any locally created templates that are not yet on the cloud
    for (const remainingLocal of localMap.values()) {
      merged.push(remainingLocal);
    }

    storageService.saveAllTemplates(merged);
    return merged;
  },

  /**
   * Save template to Neon PostgreSQL
   */
  async saveTemplate(template: BoardTemplate): Promise<BoardTemplate> {
    const local = storageService.saveTemplate(template);
    const url = getApiUrl('/api/templates');

    if (url) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(template)
        });
        if (res.ok) {
          const savedCloud = await res.json();
          return savedCloud;
        }
      } catch (err) {
        console.warn('Failed to sync template to database:', err);
      }
    }
    return local;
  },

  /**
   * Delete template from Neon PostgreSQL
   */
  async deleteTemplate(id: string): Promise<void> {
    storageService.deleteTemplate(id);
    const url = API_BASE_URL ? `${API_BASE_URL}/api/templates/${id}` : getApiUrl(`/api/templates?id=${id}`);

    if (url) {
      try {
        await fetch(url, {
          method: 'DELETE'
        });
      } catch (err) {
        console.warn('Failed to sync template deletion:', err);
      }
    }
  },

  /**
   * Sync user purchases from Neon PostgreSQL
   */
  async getUserPurchases(userId: string): Promise<string[]> {
    if (!userId) return [];
    const url = API_BASE_URL
      ? `${API_BASE_URL}/api/users/${encodeURIComponent(userId)}/purchases`
      : getApiUrl(`/api/purchases?userId=${encodeURIComponent(userId)}`);

    if (url) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Failed to fetch purchases from database:', err);
      }
    }
    return [];
  },

  /**
   * Record purchase in Neon PostgreSQL
   */
  async recordPurchase(
    userId: string,
    templateId: string,
    orderId?: string,
    referenceId?: string,
    amount?: number,
    paymentMode?: string
  ) {
    if (!userId || !templateId) return;
    const url = API_BASE_URL ? `${API_BASE_URL}/api/users/purchases` : getApiUrl('/api/purchases');

    if (url) {
      try {
        await fetch(url, {
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
        console.warn('Failed to record purchase in database:', err);
      }
    }
  }
};
