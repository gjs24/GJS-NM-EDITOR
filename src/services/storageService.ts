import { BoardTemplate, SavedUserBoard } from '../types/template';
import { DEFAULT_TEMPLATES } from '../data/defaultTemplates';

const TEMPLATES_STORAGE_KEY = 'gjs_railway_templates_v3';
const USER_BOARDS_STORAGE_KEY = 'gjs_user_saved_boards_v3';
const DELETED_IDS_STORAGE_KEY = 'gjs_deleted_template_ids_v3';

function getDeletedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_IDS_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDeletedIds(ids: Set<string>): void {
  try {
    localStorage.setItem(DELETED_IDS_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch (err) {
    console.warn('Failed to save deleted template IDs:', err);
  }
}

export const storageService = {
  // Get all templates (for admin)
  getAllTemplates(): BoardTemplate[] {
    const deletedIds = getDeletedIds();
    try {
      const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (stored) {
        const parsed: BoardTemplate[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Merge in any new default templates if not already present AND not explicitly deleted
          const ids = new Set(parsed.map((t) => t.id));
          const missingDefaults = DEFAULT_TEMPLATES.filter((d) => !ids.has(d.id) && !deletedIds.has(d.id));
          
          // Ensure default template attributes like isPaid/price are populated if missing
          const synced = parsed.map((tpl) => {
            const def = DEFAULT_TEMPLATES.find((d) => d.id === tpl.id);
            if (def && tpl.isPaid === undefined && def.isPaid !== undefined) {
              return { ...tpl, isPaid: def.isPaid, price: def.price, currency: def.currency };
            }
            return tpl;
          });

          if (missingDefaults.length > 0) {
            const merged = [...missingDefaults, ...synced];
            this.saveAllTemplates(merged);
            return merged;
          }
          return synced;
        }
      }
    } catch (err) {
      console.warn('Error reading templates from localStorage, using defaults:', err);
    }
    // Initialize default templates in storage
    const initial = DEFAULT_TEMPLATES.filter(d => !deletedIds.has(d.id));
    this.saveAllTemplates(initial);
    return initial;
  },

  // Get only published templates (for normal users)
  getPublishedTemplates(): BoardTemplate[] {
    const all = this.getAllTemplates();
    return all.filter(t => t.published !== false);
  },

  // Get single template
  getTemplateById(id: string): BoardTemplate | undefined {
    return this.getAllTemplates().find(t => t.id === id);
  },

  // Save all templates list
  saveAllTemplates(templates: BoardTemplate[]): void {
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    } catch (err) {
      console.error('Failed to save templates to localStorage:', err);
    }
  },

  // Save or update a single template (Admin only)
  saveTemplate(template: BoardTemplate): BoardTemplate {
    const templates = this.getAllTemplates();
    const index = templates.findIndex(t => t.id === template.id);
    const updatedTemplate = {
      ...template,
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
      templates[index] = updatedTemplate;
    } else {
      templates.unshift(updatedTemplate);
    }

    this.saveAllTemplates(templates);
    return updatedTemplate;
  },

  // Publish / Unpublish template (Admin only)
  setPublishedStatus(id: string, published: boolean): void {
    const templates = this.getAllTemplates();
    const target = templates.find(t => t.id === id);
    if (target) {
      target.published = published;
      target.updatedAt = new Date().toISOString();
      this.saveAllTemplates(templates);
    }
  },

  // Delete template (Admin only)
  deleteTemplate(id: string): boolean {
    const deletedIds = getDeletedIds();
    deletedIds.add(id);
    saveDeletedIds(deletedIds);

    const templates = this.getAllTemplates();
    const filtered = templates.filter(t => t.id !== id);
    if (filtered.length !== templates.length) {
      this.saveAllTemplates(filtered);
      return true;
    }
    return false;
  },

  // Reset to original factory defaults
  resetToDefaults(): BoardTemplate[] {
    saveDeletedIds(new Set());
    this.saveAllTemplates(DEFAULT_TEMPLATES);
    return DEFAULT_TEMPLATES;
  },

  // User saved customized boards
  getUserBoards(): SavedUserBoard[] {
    try {
      const stored = localStorage.getItem(USER_BOARDS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Error reading saved user boards:', e);
    }
    return [];
  },

  saveUserBoard(board: SavedUserBoard): void {
    try {
      const boards = this.getUserBoards();
      const idx = boards.findIndex(b => b.id === board.id);
      if (idx >= 0) {
        boards[idx] = board;
      } else {
        boards.unshift(board);
      }
      localStorage.setItem(USER_BOARDS_STORAGE_KEY, JSON.stringify(boards));
    } catch (e) {
      console.error('Failed to save user board:', e);
    }
  },

  deleteUserBoard(id: string): void {
    try {
      const boards = this.getUserBoards().filter(b => b.id !== id);
      localStorage.setItem(USER_BOARDS_STORAGE_KEY, JSON.stringify(boards));
    } catch (e) {
      console.error('Failed to delete user board:', e);
    }
  }
};

