
import { adminDb } from '@/lib/firebase/admin';

class MessageResetService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly RESET_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes for testing
  private readonly CHECK_INTERVAL_MS = 30 * 1000; // Check every 30 seconds

  // Message limits per plan
  private readonly MESSAGE_LIMITS = {
    free: 30,
    premium: 200,
    ultimate: 500
  };

  start() {
    if (this.intervalId) {
      console.log('🔄 Message reset service already running');
      return;
    }

    console.log('🚀 Starting automated message reset service...');
    console.log(`📅 Reset interval: ${this.RESET_INTERVAL_MS / 1000} seconds`);
    console.log(`⏰ Check interval: ${this.CHECK_INTERVAL_MS / 1000} seconds`);
    console.log('💳 Credit limits:', this.MESSAGE_LIMITS);

    // Run initial check
    this.checkAndResetMessages();

    // Set up periodic checks
    this.intervalId = setInterval(() => {
      this.checkAndResetMessages();
    }, this.CHECK_INTERVAL_MS);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Message reset service stopped');
    }
  }

  private async checkAndResetMessages() {
    try {
      console.log('🔍 Checking for users needing message reset...');
      
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - this.RESET_INTERVAL_MS);

      // Get all users who need a reset (includes users without lastMessageReset field)
      const usersSnapshot = await adminDb
        .collection('users')
        .get();
      
      // Filter users who need reset (either no lastMessageReset or lastMessageReset <= cutoffTime)
      const usersNeedingReset = usersSnapshot.docs.filter(doc => {
        const userData = doc.data();
        const lastReset = userData.lastMessageReset?.toDate() || new Date(0); // Use epoch if no field
        return lastReset <= cutoffTime;
      });

      if (usersNeedingReset.length === 0) {
        console.log('✅ No users need message reset');
        return;
      }

      console.log(`📝 Found ${usersNeedingReset.length} users needing reset`);

      // Process each user
      const resetPromises = usersNeedingReset.map(async (userDoc) => {
        const userData = userDoc.data();
        const userId = userDoc.id;
        const currentPlan = userData.currentPlan || 'free';
        const messageLimit = this.MESSAGE_LIMITS[currentPlan as keyof typeof this.MESSAGE_LIMITS] || this.MESSAGE_LIMITS.free;

        try {
          await adminDb.collection('users').doc(userId).update({
            messagesLeft: messageLimit,
            lastMessageReset: now
          });

          console.log(`✅ Reset ${messageLimit} messages for user ${userId} (${currentPlan} plan)`);
        } catch (error) {
          console.error(`❌ Failed to reset messages for user ${userId}:`, error);
        }
      });

      await Promise.all(resetPromises);
      console.log(`🎉 Successfully processed ${usersNeedingReset.length} user resets`);

    } catch (error) {
      console.error('❌ Error in message reset service:', error);
    }
  }

  // Manual reset method for testing
  async manualReset(userId?: string) {
    try {
      if (userId) {
        // Reset specific user
        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (!userDoc.exists) {
          console.log(`❌ User ${userId} not found`);
          return;
        }

        const userData = userDoc.data()!;
        const currentPlan = userData.currentPlan || 'free';
        const messageLimit = this.MESSAGE_LIMITS[currentPlan as keyof typeof this.MESSAGE_LIMITS] || this.MESSAGE_LIMITS.free;

        await adminDb.collection('users').doc(userId).update({
          messagesLeft: messageLimit,
          lastMessageReset: new Date()
        });

        console.log(`✅ Manually reset ${messageLimit} messages for user ${userId} (${currentPlan} plan)`);
      } else {
        // Reset all users
        await this.checkAndResetMessages();
      }
    } catch (error) {
      console.error('❌ Error in manual reset:', error);
    }
  }

  // Force reset method for immediate testing
  async forceResetAllUsers() {
    try {
      console.log('🔧 Force resetting ALL users...');
      
      const usersSnapshot = await adminDb.collection('users').get();
      
      if (usersSnapshot.empty) {
        console.log('❌ No users found');
        return;
      }

      console.log(`📝 Force resetting ${usersSnapshot.docs.length} users`);

      const resetPromises = usersSnapshot.docs.map(async (userDoc) => {
        const userData = userDoc.data();
        const userId = userDoc.id;
        const currentPlan = userData.currentPlan || 'free';
        const messageLimit = this.MESSAGE_LIMITS[currentPlan as keyof typeof this.MESSAGE_LIMITS] || this.MESSAGE_LIMITS.free;

        try {
          await adminDb.collection('users').doc(userId).update({
            messagesLeft: messageLimit,
            lastMessageReset: new Date()
          });

          console.log(`✅ Force reset ${messageLimit} messages for user ${userId} (${currentPlan} plan)`);
        } catch (error) {
          console.error(`❌ Failed to force reset messages for user ${userId}:`, error);
        }
      });

      await Promise.all(resetPromises);
      console.log(`🎉 Successfully force reset ${usersSnapshot.docs.length} users`);

    } catch (error) {
      console.error('❌ Error in force reset:', error);
    }
  }
}

// Export singleton instance
export const messageResetService = new MessageResetService();

// Initialize function for server-side startup
export function initializeMessageResetService() {
  console.log('🚀 Initializing message reset service...');
  messageResetService.start();
}
