import { Platform } from 'react-native';
import { ChargebeeBilling } from './ChargebeeBilling';
import { GooglePlayBilling } from './GooglePlayBilling';
import { QuotaManager } from './QuotaManager';
import { SubscriptionPlan, BillingUser, BillingQuota } from './types';

export class UnifiedBillingService {
  private static instance: UnifiedBillingService;
  private chargebeeBilling: ChargebeeBilling;
  private googlePlayBilling: GooglePlayBilling;
  private quotaManager: QuotaManager;

  private constructor() {
    this.chargebeeBilling = ChargebeeBilling.getInstance();
    this.googlePlayBilling = GooglePlayBilling.getInstance();
    this.quotaManager = QuotaManager.getInstance();
  }

  public static getInstance(): UnifiedBillingService {
    if (!UnifiedBillingService.instance) {
      UnifiedBillingService.instance = new UnifiedBillingService();
    }
    return UnifiedBillingService.instance;
  }

  public async initialize(): Promise<void> {
    if (Platform.OS === 'android') {
      await this.googlePlayBilling.initialize();
    }
  }

  public async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    if (Platform.OS === 'android') {
      return this.googlePlayBilling.getSubscriptions();
    } else {
      // For web platform, use Chargebee
      const response = await fetch('/api/subscription-plans');
      return response.json();
    }
  }

  public async startSubscription(planId: string): Promise<void> {
    if (Platform.OS === 'android') {
      await this.googlePlayBilling.purchase(planId);
    } else {
      const checkoutUrl = await this.chargebeeBilling.createCheckoutSession(planId);
      window.location.href = checkoutUrl;
    }
  }

  public async purchaseLifetimeLicense(planId: string): Promise<void> {
    if (Platform.OS === 'android') {
      await this.googlePlayBilling.purchase(planId);
    } else {
      const checkoutUrl = await this.chargebeeBilling.createCheckoutSession(planId);
      window.location.href = checkoutUrl;
    }
  }

  public async purchaseGenerationBundle(planId: string): Promise<void> {
    if (Platform.OS === 'android') {
      await this.googlePlayBilling.purchase(planId);
    } else {
      const checkoutUrl = await this.chargebeeBilling.createCheckoutSession(planId);
      window.location.href = checkoutUrl;
    }
  }

  public async validateSubscription(subscriptionId: string): Promise<boolean> {
    if (Platform.OS === 'android') {
      return this.googlePlayBilling.validateSubscription(subscriptionId);
    } else {
      return this.chargebeeBilling.validateSubscription(subscriptionId);
    }
  }

  public async validateLifetimeLicense(licenseId: string): Promise<boolean> {
    if (Platform.OS === 'android') {
      return this.googlePlayBilling.validateSubscription(licenseId);
    } else {
      const response = await fetch(`/api/validate-lifetime-license/${licenseId}`);
      return response.json().then(data => data.isValid);
    }
  }

  public async getUserQuota(userId: string): Promise<BillingQuota> {
    return this.quotaManager.getUserQuota(userId);
  }

  public async consumeCredits(userId: string, amount: number = 1): Promise<boolean> {
    return this.quotaManager.consumeCredits(userId, amount);
  }

  public async openBillingPortal(userId: string): Promise<void> {
    if (Platform.OS === 'android') {
      // Open Google Play Store subscription management
      // You'll need to implement this based on your app's package name
      console.log('Please visit Google Play Store to manage your subscription');
    } else {
      const portalUrl = await this.chargebeeBilling.createPortalSession(userId);
      window.location.href = portalUrl;
    }
  }

  public getPlatformSpecificInstructions(): string {
    if (Platform.OS === 'android') {
      return 'Subscription is managed through Google Play Store';
    } else {
      return 'Subscription is managed through our web portal';
    }
  }

  public async checkRemainingCredits(userId: string): Promise<number> {
    const quota = await this.getUserQuota(userId);
    return quota.generationsRemaining;
  }

  public async getActivePlan(userId: string): Promise<SubscriptionPlan | null> {
    try {
      const response = await fetch(`/api/user/${userId}/active-plan`);
      return response.json();
    } catch (error) {
      console.error('Failed to get active plan:', error);
      return null;
    }
  }
}
