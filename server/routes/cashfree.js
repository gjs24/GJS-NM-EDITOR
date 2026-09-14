import express from 'express';
import { supabase } from '../supabase.js';

export const cashfreeRouter = express.Router();

/**
 * POST /api/cashfree/create-order
 * Creates an official Cashfree order on the backend with client credentials
 */
cashfreeRouter.post('/create-order', async (req, res) => {
  try {
    const { orderId, orderAmount, customerDetails, templateId, templateName } = req.body || {};

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const env = process.env.CASHFREE_ENV || 'sandbox';

    if (!appId || !secretKey) {
      return res.status(500).json({
        error: 'Cashfree API credentials are not configured on the server.'
      });
    }

    const endpoint =
      env === 'production'
        ? 'https://api.cashfree.com/pg/orders'
        : 'https://sandbox.cashfree.com/pg/orders';

    const frontendOrigin = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173';

    const orderPayload = {
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
        return_url: `${frontendOrigin}/?order_id={order_id}`
      },
      order_tags: {
        template_id: templateId || '',
        template_name: templateName || ''
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': appId,
        'x-client-secret': secretKey
      },
      body: JSON.stringify(orderPayload)
    });

    const data = await response.json();

    // Log order attempt in Supabase if database is connected
    if (supabase) {
      supabase
        .from('cashfree_logs')
        .insert({
          order_id: orderId,
          customer_id: customerDetails?.customerId,
          customer_email: customerDetails?.customerEmail,
          amount: Number(orderAmount),
          status: response.ok ? 'ORDER_CREATED' : 'CREATION_FAILED',
          payload: data
        })
        .then();
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Error creating Cashfree order:', error);
    return res.status(500).json({ error: 'Internal server error creating order', message: error.message });
  }
});

/**
 * POST /api/cashfree/verify-payment
 * Verifies that a payment has completed successfully and records purchase in Supabase
 */
cashfreeRouter.post('/verify-payment', async (req, res) => {
  try {
    const { orderId, templateId, userId, referenceId, amount, paymentMode, templateName } = req.body || {};

    const receipt = {
      id: `rcpt_${Date.now()}`,
      user_id: userId,
      template_id: templateId,
      order_id: orderId,
      reference_id: referenceId,
      amount: Number(amount),
      payment_mode: paymentMode || 'Cashfree PG',
      status: 'SUCCESS',
      created_at: new Date().toISOString()
    };

    // Save purchase in Supabase
    if (supabase && userId && templateId) {
      await supabase.from('user_purchases').upsert({
        id: `purchase_${userId}_${templateId}`,
        user_id: userId,
        template_id: templateId,
        order_id: orderId,
        reference_id: referenceId,
        amount: Number(amount),
        payment_mode: paymentMode,
        status: 'SUCCESS'
      });

      await supabase.from('cashfree_logs').insert({
        order_id: orderId,
        reference_id: referenceId,
        customer_id: userId,
        amount: Number(amount),
        status: 'PAYMENT_VERIFIED',
        payment_mode: paymentMode,
        payload: { orderId, templateId, templateName, referenceId }
      });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Payment verified and template unlocked successfully.',
      receipt
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ error: 'Failed to verify payment', message: error.message });
  }
});

/**
 * POST /api/cashfree/webhook
 * Cashfree Server-to-Server Webhook Listener
 */
cashfreeRouter.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('🔔 [Render Backend Webhook Received]:', event?.type);

    if (supabase) {
      await supabase.from('cashfree_logs').insert({
        order_id: event?.data?.order?.order_id || 'UNKNOWN',
        reference_id: event?.data?.payment?.cf_payment_id ? String(event.data.payment.cf_payment_id) : null,
        status: event?.type || 'WEBHOOK',
        amount: event?.data?.payment?.payment_amount || 0,
        payload: event
      });
    }

    if (event?.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const order = event.data?.order;
      const payment = event.data?.payment;
      const customer = event.data?.customer_details;

      const templateId = order?.order_tags?.template_id;
      const userId = customer?.customer_id;

      if (supabase && userId && templateId) {
        await supabase.from('user_purchases').upsert({
          id: `purchase_${userId}_${templateId}`,
          user_id: userId,
          template_id: templateId,
          order_id: order.order_id,
          reference_id: String(payment?.cf_payment_id || ''),
          amount: Number(payment?.payment_amount || 0),
          status: 'SUCCESS'
        });
        console.log(`✅ [Supabase Unlocked]: Template ${templateId} for User ${userId}`);
      }
    }

    return res.status(200).json({ status: 'OK' });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: 'Webhook error' });
  }
});

/**
 * GET /api/cashfree/receipts
 * Fetch recent receipts from Supabase audit logs (Admin)
 */
cashfreeRouter.get('/receipts', async (req, res) => {
  try {
    if (!supabase) {
      return res.json([]);
    }
    const { data, error } = await supabase
      .from('user_purchases')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

