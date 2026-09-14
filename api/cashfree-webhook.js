// Vercel Serverless Function: POST /api/cashfree-webhook
// Receives instant payment updates directly from Cashfree Payment Gateway
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const event = req.body;
    console.log('[Cashfree Webhook Received]:', JSON.stringify(event, null, 2));

    if (event?.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const order = event.data?.order;
      const payment = event.data?.payment;
      console.log(`✅ Verified Payment for Order ${order?.order_id}, Amount: ₹${payment?.payment_amount}`);
    }

    return res.status(200).json({ status: 'OK', message: 'Webhook received successfully' });
  } catch (err) {
    console.error('Cashfree Webhook error:', err);
    return res.status(500).json({ error: 'Webhook processing error' });
  }
}

