import { getDb } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = getDb();
  if (!sql) {
    return res.status(200).json([]);
  }

  try {
    if (req.method === 'GET') {
      const userId = req.query.userId;
      if (!userId) return res.json([]);

      const rows = await sql`
        SELECT template_id FROM user_purchases
        WHERE user_id = ${userId} AND status = 'SUCCESS'
      `;
      const templateIds = rows.map((r) => r.template_id);
      return res.json(templateIds);
    }

    if (req.method === 'POST') {
      const { userId, templateId, orderId, referenceId, amount, paymentMode } = req.body || {};
      if (!userId || !templateId) {
        return res.status(400).json({ error: 'userId and templateId required' });
      }

      await sql`
        INSERT INTO user_purchases (
          id, user_id, template_id, order_id, reference_id, amount, payment_mode, status
        ) VALUES (
          ${`purchase_${userId}_${templateId}`},
          ${userId},
          ${templateId},
          ${orderId || `ord_${Date.now()}`},
          ${referenceId || `ref_${Date.now()}`},
          ${Number(amount || 0)},
          ${paymentMode || 'Direct'},
          'SUCCESS'
        )
        ON CONFLICT (id) DO NOTHING;
      `;

      return res.json({ success: true, unlockedTemplateId: templateId });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Neon purchases error:', error);
    return res.status(500).json({ error: error.message });
  }
}
