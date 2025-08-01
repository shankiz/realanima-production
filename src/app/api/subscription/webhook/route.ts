import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { XenditService } from '@/services/xendit/XenditService';

// POST /api/subscription/webhook - Handle Xendit webhook events
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-callback-token') || '';
    const webhookSecret = process.env.XENDIT_WEBHOOK_SECRET || '';
    
    const data = await req.json();
    
    // Initialize Xendit
    const xenditService = new XenditService(process.env.XENDIT_SECRET_KEY || '');
    
    // Verify webhook signature
    const isValid = xenditService.verifyWebhookSignature(data, signature, webhookSecret);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // Handle different event types
    const eventType = data.event_type;
    
    await connectToDatabase();
    
    if (eventType === 'subscription.created' || eventType === 'subscription.activated') {
      // New subscription created or activated
      const subscriptionId = data.subscription_id;
      const externalId = data.external_id;
      const userId = externalId.split('_')[1]; // Extract user ID from external_id
      
      // Get subscription details
      const subscription = await xenditService.getSubscription(subscriptionId);
      
      // Determine plan type from amount
      const amount = subscription.amount;
      let planType = 'free';
      
      if (amount === 9.99) {
        planType = 'premium';
      } else if (amount === 19.99) {
        planType = 'ultimate';
      }
      
      // Update user subscription
      const user = await User.findById(userId);
      
      if (user) {
        user.currentPlan = planType;
        user.subscriptionId = subscriptionId;
        user.subscriptionStatus = 'active';
        
        // Set message limits based on plan
        if (planType === 'premium') {
          user.messagesLeft = 100;
        } else if (planType === 'ultimate') {
          user.messagesLeft = 999999; // Unlimited
        }
        
        await user.save();
      }
    } else if (eventType === 'subscription.expired' || eventType === 'subscription.cancelled') {
      // Subscription ended
      const subscriptionId = data.subscription_id;
      
      // Find user with this subscription
      const user = await User.findOne({ subscriptionId });
      
      if (user) {
        user.currentPlan = 'free';
        user.subscriptionId = null;
        user.subscriptionStatus = 'inactive';
        user.messagesLeft = 10; // Reset to free tier
        
        await user.save();
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
