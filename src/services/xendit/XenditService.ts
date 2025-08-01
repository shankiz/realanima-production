import axios from 'axios';

export class XenditService {
  private apiKey: string;
  private baseUrl: string = 'https://api.xendit.co';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  /**
   * Create a payment invoice
   */
  async createInvoice(params: {
    externalId: string;
    amount: number;
    payerEmail: string;
    description: string;
    successRedirectUrl?: string;
    failureRedirectUrl?: string;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v2/invoices`,
        params,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating Xendit invoice:', error);
      throw error;
    }
  }
  
  /**
   * Get invoice details
   */
  async getInvoice(invoiceId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v2/invoices/${invoiceId}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting Xendit invoice:', error);
      throw error;
    }
  }
  
  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(requestBody: any, signature: string, webhookKey: string) {
    try {
      // In a real implementation, this would validate the signature
      // using the webhook key and request body
      // For now, we'll return true as a placeholder
      return true;
    } catch (error) {
      console.error('Error verifying Xendit webhook signature:', error);
      return false;
    }
  }
  
  /**
   * Get subscription details by ID
   */
  async getSubscription(subscriptionId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/recurring_payments/subscriptions/${subscriptionId}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting Xendit subscription:', error);
      throw error;
    }
  }
  
  /**
   * Create a subscription
   */
  async createSubscription(params: {
    externalId: string;
    payerEmail: string;
    description: string;
    amount: number;
    interval: string;
    intervalCount: number;
    successRedirectUrl?: string;
    failureRedirectUrl?: string;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/recurring_payments/subscriptions`,
        params,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating Xendit subscription:', error);
      throw error;
    }
  }
  
  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/recurring_payments/subscriptions/${subscriptionId}/cancel`,
        {},
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error canceling Xendit subscription:', error);
      throw error;
    }
  }
}
