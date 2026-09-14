// Vercel Serverless Function: POST /api/create-cashfree-order
// Securely generates Cashfree order token using server-side credentials
import { getDb } from './db.js';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { orderId, orderAmount, customerDetails, templateId, templateName } = req.body || {};

    const appId = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY || process.env.VITE_CASHFREE_SECRET_KEY;
    const env = process.env.CASHFREE_ENV || process.env.VITE_CASHFREE_ENV || 'sandbox';

    if (!appId || !secretKey) {
      return res.status(500).json({
        error: 'Cashfree credentials are not configured on the server environment.'
      });
    }

    const endpoint =
      env === 'production'
        ? 'https://api.cashfree.com/pg/orders'
        : 'https://sandbox.cashfree.com/pg/orders';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': appId,
        'x-client-secret': secretKey
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: Number(orderAmount),
        order_currency: 'INR',
        customer_details: {
          customer_id: customerDetails?.customerId || 'USR-ANON',
          customer_name: customerDetails?.customerName || 'Customer',
          customer_email: customerDetails?.customerEmail || 'customer@example.com',
          customer_phone: customerDetails?.customerPhone || '9876543210'
        },
        order_meta: {
          return_url: `${req.headers.origin || 'https://' + req.headers.host}/?order_id={order_id}`
        },
        order_tags: {
          template_id: templateId || '',
          template_name: templateName || ''
        }
      })
    });

    const data = await response.json();

    // Log to Neon PostgreSQL if connected
    const sql = getDb();
    if (sql) {
      sql`
        INSERT INTO cashfree_logs (
          order_id, customer_id, customer_email, amount, status, payload
        ) VALUES (
          ${orderId},
          ${customerDetails?.customerId || null},
          ${customerDetails?.customerEmail || null},
          ${Number(orderAmount)},
          ${response.ok ? 'ORDER_CREATED' : 'CREATION_FAILED'},
          ${JSON.stringify(data)}
        )
      `.catch(() => {});
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Serverless Cashfree order creation error:', error);
    return res.status(500).json({ error: 'Failed to create Cashfree order', details: error.message });
  }
}
