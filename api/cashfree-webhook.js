// Vercel Serverless Function: POST /api/cashfree-webhook
// Receives instant payment updates from Cashfree and unlocks in Neon PostgreSQL
import { getDb } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const event = req.body;
    console.log('[Cashfree Webhook Received]:', event?.type);

    const sql = getDb();
    if (sql) {
      // 1. Log transaction audit trail in Neon
      await sql`
        INSERT INTO cashfree_logs (
          order_id, reference_id, customer_id, amount, status, payload
        ) VALUES (
          ${event?.data?.order?.order_id || 'UNKNOWN'},
          ${String(event?.data?.payment?.cf_payment_id || '')},
          ${event?.data?.customer_details?.customer_id || null},
          ${Number(event?.data?.payment?.payment_amount || 0)},
          ${event?.type || 'WEBHOOK'},
          ${JSON.stringify(event)}
        )
      `;

      // 2. Unlock template for user upon payment success
      if (event?.type === 'PAYMENT_SUCCESS_WEBHOOK') {
        const order = event.data?.order;
        const payment = event.data?.payment;
        const customer = event.data?.customer_details;

        const templateId = order?.order_tags?.template_id;
        const userId = customer?.customer_id;

        if (userId && templateId) {
          await sql`
            INSERT INTO user_purchases (
              id, user_id, template_id, order_id, reference_id, amount, payment_mode, status
            ) VALUES (
              ${`purchase_${userId}_${templateId}`},
              ${userId},
              ${templateId},
              ${order.order_id},
              ${String(payment?.cf_payment_id || '')},
              ${Number(payment?.payment_amount || 0)},
              'Cashfree Webhook',
              'SUCCESS'
            )
            ON CONFLICT (id) DO NOTHING;
          `;
          console.log(`✅ [Neon Database Unlocked]: Template ${templateId} for User ${userId}`);
        }
      }
    }

    return res.status(200).json({ status: 'OK', message: 'Webhook processed successfully' });
  } catch (err) {
    console.error('Cashfree Webhook error:', err);
    return res.status(500).json({ error: 'Webhook processing error' });
  }
}
