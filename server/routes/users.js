import express from 'express';
import { supabase } from '../supabase.js';

export const usersRouter = express.Router();

/**
 * GET /api/users/:userId/purchases
 * Return array of template IDs unlocked/purchased by this user
 */
usersRouter.get('/:userId/purchases', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!supabase || !userId) {
      return res.json([]);
    }

    const { data, error } = await supabase
      .from('user_purchases')
      .select('template_id')
      .eq('user_id', userId)
      .eq('status', 'SUCCESS');

    if (error) throw error;
    const templateIds = (data || []).map((row) => row.template_id);
    return res.json(templateIds);
  } catch (error) {
    console.error('Error fetching user purchases:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/users/purchases
 * Record a manual or test purchase unlock
 */
usersRouter.post('/purchases', async (req, res) => {
  try {
    const { userId, templateId, orderId, referenceId, amount, paymentMode } = req.body;
    if (!userId || !templateId) {
      return res.status(400).json({ error: 'userId and templateId required' });
    }

    if (supabase) {
      const { data, error } = await supabase.from('user_purchases').upsert({
        id: `purchase_${userId}_${templateId}`,
        user_id: userId,
        template_id: templateId,
        order_id: orderId || `ord_${Date.now()}`,
        reference_id: referenceId || `ref_${Date.now()}`,
        amount: Number(amount || 0),
        payment_mode: paymentMode || 'Direct',
        status: 'SUCCESS'
      });
      if (error) throw error;
    }

    return res.json({ success: true, unlockedTemplateId: templateId });
  } catch (error) {
    console.error('Error recording purchase:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/:userId/boards
 * Fetch saved boards for a user
 */
usersRouter.get('/:userId/boards', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!supabase || !userId) return res.json([]);

    const { data, error } = await supabase
      .from('user_saved_boards')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return res.json(data || []);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/users/boards
 * Save or update user board design
 */
usersRouter.post('/boards', async (req, res) => {
  try {
    const { id, userId, templateId, title, values, customBgUrl } = req.body;
    if (!userId || !templateId) {
      return res.status(400).json({ error: 'userId and templateId required' });
    }

    const boardId = id || `board_${Date.now()}`;
    if (supabase) {
      const { error } = await supabase.from('user_saved_boards').upsert({
        id: boardId,
        user_id: userId,
        template_id: templateId,
        title: title || 'Custom Railway Board',
        field_values: values || {},
        custom_background_url: customBgUrl || null,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
    }

    return res.json({ success: true, id: boardId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

