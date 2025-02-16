import { NativeModules, Platform } from 'react-native';
import RNBilling from 'react-native-billing';
import { BillingUser, SubscriptionPlan } from './ChargebeeBilling';

export class GooglePlayBilling {
  private static instance: GooglePlayBilling;
  private billing: typeof RNBilling;
  private isInitialized: boolean = false;

  private constructor() {
    this.billing = RNBilling;
  }

  public static getInstance(): GooglePlayBilling {
    if (!GooglePlayBilling.instance) {
      GooglePlayBilling.instance = new GooglePlayBilling();
    }
    return GooglePlayBilling.instance;
  }

  public async initialize(): Promise<void> {
    if (Platform.OS !== 'android') {
      throw new Error('Google Play Billing is only available on Android');
    }

    if (this.isInitialized) {
      return;
    }

    try {
      await this.billing.init();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Google Play Billing:', error);
      throw error;
    }
  }

  public async getSubscriptions(): Promise<SubscriptionPlan[]> {
    await this.ensureInitialized();
    
    try {
      const products = await this.billing.getSubscriptions();
      return products.map(product => ({
        id: product.productId,
        name: product.title,
        price: parseFloat(product.price),
        period: this.getPeriodFromProduct(product),
        features: this.getFeaturesFromDescription(product.description)
      }));
    } catch (error) {
      console.error('Failed to get subscriptions:', error);
      throw error;
    }
  }

  public async purchase(planId: string): Promise<void> {
    await this.ensureInitialized();

    try {
      await this.billing.purchase(planId);
    } catch (error) {
      console.error('Failed to make purchase:', error);
      throw error;
    }
  }

  public async validateSubscription(subscriptionId: string): Promise<boolean> {
    await this.ensureInitialized();

    try {
      const purchases = await this.billing.getPurchases();
      return purchases.some(
        purchase => 
          purchase.productId === subscriptionId && 
          purchase.purchaseState === 'purchased'
      );
    } catch (error) {
      console.error('Failed to validate subscription:', error);
      return false;
    }
  }

  public async cancelSubscription(subscriptionId: string): Promise<void> {
    // Note: Actual cancellation happens through Google Play Store
    // This method can be used to handle local state updates
    console.log('Please visit Google Play Store to manage your subscription');
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private getPeriodFromProduct(product: any): 'monthly' | 'yearly' {
    // This is a simplified example - adjust based on your actual product data
    return product.subscriptionPeriod?.includes('Y') ? 'yearly' : 'monthly';
  }

  private getFeaturesFromDescription(description: string): string[] {
    // Split description into features - adjust based on your format
    return description.split('\n').filter(line => line.trim().length > 0);
  }
}
