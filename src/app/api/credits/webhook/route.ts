import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 PayPal webhook received');

    const body = await request.json();
    console.log('📋 Webhook data:', JSON.stringify(body, null, 2));

    const eventType = body.event_type;
    console.log('🎯 Event type:', eventType);

    if (eventType === 'CHECKOUT.ORDER.APPROVED') {
      console.log('✅ Order approved via webhook:', body.resource?.id);
      return NextResponse.json({ status: 'order_approved_logged' });
    }

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const resource = body.resource;
      const orderId = resource.supplementary_data?.related_ids?.order_id;

      console.log('💰 Payment completed for order:', orderId);

      if (!orderId) {
        console.error('❌ No order ID found in webhook');
        return NextResponse.json({ error: 'No order ID found' }, { status: 400 });
      }

      // Get order from Firestore
      const orderDoc = await adminDb.collection('orders').doc(orderId).get();

      if (!orderDoc.exists) {
        console.error('❌ Order not found:', orderId);
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      const orderData = orderDoc.data();
      console.log('📊 Order data:', orderData);

      // Update user's credits
      const userRef = adminDb.collection('users').doc(orderData.userId);
      const userDoc = await userRef.get();

      let currentCredits = 0;
      if (userDoc.exists) {
        const userData = userDoc.data();
        currentCredits = userData?.credits || 0;
      }

      const newCredits = currentCredits + orderData.credits;

      await userRef.set({
        credits: newCredits,
        messagesLeft: newCredits,
        updatedAt: new Date()
      }, { merge: true });

      // Update order status
      await adminDb.collection('orders').doc(orderId).update({
        status: 'completed',
        completedAt: new Date(),
        paypalCaptureId: resource.id,
        webhookProcessed: true
      });

      console.log('✅ Credits updated via webhook:', newCredits);

      return NextResponse.json({ status: 'processed' });
    }

    console.log('ℹ️ Webhook event not processed:', eventType);
    return NextResponse.json({ status: 'ignored' });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}