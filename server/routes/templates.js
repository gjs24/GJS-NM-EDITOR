import express from 'express';
import { supabase } from '../supabase.js';

export const templatesRouter = express.Router();

/**
 * Convert snake_case Supabase row to camelCase BoardTemplate
 */
function mapFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    aspectRatio: row.aspect_ratio,
    baseWidth: row.base_width,
    baseHeight: row.base_height,
    backgroundColor: row.background_color,
    backgroundType: row.background_type,
    backgroundImageUrl: row.background_image_url,
    backgroundSecondaryColor: row.background_secondary_color,
    borderColor: row.border_color,
    borderWidth: row.border_width,
    borderRadius: row.border_radius,
    showBolts: row.show_bolts,
    innerBorder: row.inner_border,
    innerBorderColor: row.inner_border_color,
    innerBorderPadding: row.inner_border_padding,
    isTextureSheet: row.is_texture_sheet,
    textureResolution: row.texture_resolution,
    published: row.published,
    isPaid: row.is_paid,
    price: Number(row.price || 0),
    currency: row.currency || 'INR',
    fields: row.fields || [],
    fixedGraphics: row.fixed_graphics || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Convert camelCase BoardTemplate to snake_case Supabase row
 */
function mapToDb(t) {
  return {
    id: t.id,
    name: t.name,
    category: t.category || 'LED Texture Sheet',
    description: t.description || '',
    aspect_ratio: t.aspectRatio || '1:1',
    base_width: Number(t.baseWidth || 1024),
    base_height: Number(t.baseHeight || 1024),
    background_color: t.backgroundColor || '#0c0f12',
    background_type: t.backgroundType || 'transparent',
    background_image_url: t.backgroundImageUrl || null,
    background_secondary_color: t.backgroundSecondaryColor || null,
    border_color: t.borderColor || 'transparent',
    border_width: Number(t.borderWidth || 0),
    border_radius: Number(t.borderRadius || 0),
    show_bolts: Boolean(t.showBolts),
    inner_border: Boolean(t.innerBorder),
    inner_border_color: t.innerBorderColor || null,
    inner_border_padding: Number(t.innerBorderPadding || 6),
    is_texture_sheet: Boolean(t.isTextureSheet),
    texture_resolution: Number(t.textureResolution || 1024),
    published: t.published !== false,
    is_paid: Boolean(t.isPaid),
    price: Number(t.price || 0),
    currency: t.currency || 'INR',
    fields: t.fields || [],
    fixed_graphics: t.fixedGraphics || [],
    updated_at: new Date().toISOString()
  };
}

/**
 * GET /api/templates
 * Retrieve all published templates for regular users
 */
templatesRouter.get('/', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(200).json([]);
    }

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('published', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    const formatted = (data || []).map(mapFromDb);
    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching published templates:', error);
    return res.status(500).json({ error: 'Failed to fetch templates', message: error.message });
  }
});

/**
 * GET /api/templates/all
 * Retrieve all templates (including drafts and hidden ones) for Admin
 */
templatesRouter.get('/all', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(200).json([]);
    }

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    const formatted = (data || []).map(mapFromDb);
    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching all templates:', error);
    return res.status(500).json({ error: 'Failed to fetch all templates', message: error.message });
  }
});

/**
 * POST /api/templates
 * Save or update a template (Admin only)
 */
templatesRouter.post('/', async (req, res) => {
  try {
    const template = req.body;
    if (!template?.id || !template?.name) {
      return res.status(400).json({ error: 'Missing template ID or name.' });
    }

    if (!supabase) {
      return res.json(template);
    }

    const dbPayload = mapToDb(template);
    const { data, error } = await supabase
      .from('templates')
      .upsert(dbPayload)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json(mapFromDb(data));
  } catch (error) {
    console.error('Error saving template to Supabase:', error);
    return res.status(500).json({ error: 'Failed to save template', message: error.message });
  }
});

/**
 * DELETE /api/templates/:id
 * Delete a template (Admin only)
 */
templatesRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing template ID.' });

    if (supabase) {
      const { error } = await supabase.from('templates').delete().eq('id', id);
      if (error) throw error;
    }

    return res.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting template:', error);
    return res.status(500).json({ error: 'Failed to delete template', message: error.message });
  }
});

