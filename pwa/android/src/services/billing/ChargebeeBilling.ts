import { chargebee } from '@chargebee/chargebee-js';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
}

export interface BillingUser {
  id: string;
  email: string;
  subscriptionId?: string;
  planId?: string;
  status: 'active' | 'inactive' | 'cancelled';
}

export class ChargebeeBilling {
  private static instance: ChargebeeBilling;
  private chargebee: any;

  private constructor() {
    this.chargebee = chargebee.init({
      site: process.env.REACT_APP_CHARGEBEE_SITE || '',
      publishableKey: process.env.REACT_APP_CHARGEBEE_PUBLISHABLE_KEY || '',
    });
  }

  public static getInstance(): ChargebeeBilling {
    if (!ChargebeeBilling.instance) {
      ChargebeeBilling.instance = new ChargebeeBilling();
    }
    return ChargebeeBilling.instance;
  }

  public async createPortalSession(customerId: string): Promise<string> {
    try {
      const result = await this.chargebee.createPortalSession({
        customer: { id: customerId },
      });
      return result.portal_session.access_url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }

  public async createCheckoutSession(planId: string): Promise<string> {
    try {
      const result = await this.chargebee.openCheckout({
        hostedPage: {
          subscription: {
            planId: planId,
          },
        },
      });
      return result.hosted_page.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  public async validateSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const result = await fetch(
        `/api/validate-subscription?subscriptionId=${subscriptionId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await result.json();
      return data.isValid;
    } catch (error) {
      console.error('Error validating subscription:', error);
      return false;
    }
  }
}
