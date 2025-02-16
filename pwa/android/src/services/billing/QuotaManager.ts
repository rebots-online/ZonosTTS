import { BillingQuota, BillingUser, SubscriptionPlan } from './types';

export class QuotaManager {
  private static instance: QuotaManager;
  private quotaCache: Map<string, BillingQuota> = new Map();

  private constructor() {}

  public static getInstance(): QuotaManager {
    if (!QuotaManager.instance) {
      QuotaManager.instance = new QuotaManager();
    }
    return QuotaManager.instance;
  }

  public async getUserQuota(userId: string): Promise<BillingQuota> {
    const cached = this.quotaCache.get(userId);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`/api/user/${userId}/quota`);
      const quota = await response.json();
      this.quotaCache.set(userId, quota);
      return quota;
    } catch (error) {
      console.error('Failed to fetch user quota:', error);
      throw error;
    }
  }

  public async consumeCredits(userId: string, amount: number = 1): Promise<boolean> {
    try {
      const response = await fetch(`/api/user/${userId}/consume-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error('Failed to consume credits');
      }

      const result = await response.json();
      
      // Update cache
      const currentQuota = this.quotaCache.get(userId);
      if (currentQuota) {
        currentQuota.generationsRemaining -= amount;
        this.quotaCache.set(userId, currentQuota);
      }

      return result.success;
    } catch (error) {
      console.error('Failed to consume credits:', error);
      return false;
    }
  }

  public async addBundleCredits(userId: string, credits: number): Promise<boolean> {
    try {
      const response = await fetch(`/api/user/${userId}/add-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credits }),
      });

      if (!response.ok) {
        throw new Error('Failed to add bundle credits');
      }

      const result = await response.json();
      
      // Update cache
      const currentQuota = this.quotaCache.get(userId);
      if (currentQuota) {
        currentQuota.generationsRemaining += credits;
        currentQuota.generationsTotal += credits;
        this.quotaCache.set(userId, currentQuota);
      }

      return result.success;
    } catch (error) {
      console.error('Failed to add bundle credits:', error);
      return false;
    }
  }

  public calculateQuota(user: BillingUser, plan: SubscriptionPlan): BillingQuota {
    switch (plan.type) {
      case 'lifetime':
        return {
          generationsRemaining: Number.MAX_SAFE_INTEGER,
          generationsTotal: Number.MAX_SAFE_INTEGER,
          isUnlimited: true,
          quotaType: 'lifetime'
        };

      case 'bundle':
        const bundleCredits = user.credits?.remaining || 0;
        return {
          generationsRemaining: bundleCredits,
          generationsTotal: user.credits?.total || 0,
          isUnlimited: false,
          quotaType: 'bundle'
        };

      case 'subscription':
        const monthlyLimit = plan.metadata.generationCredits || Number.MAX_SAFE_INTEGER;
        const remaining = user.credits?.remaining || monthlyLimit;
        return {
          generationsRemaining: remaining,
          generationsTotal: monthlyLimit,
          isUnlimited: monthlyLimit === Number.MAX_SAFE_INTEGER,
          resetDate: this.calculateNextResetDate(plan.period || 'monthly'),
          quotaType: 'subscription'
        };

      default:
        throw new Error('Invalid plan type');
    }
  }

  private calculateNextResetDate(period: 'monthly' | 'annual'): string {
    const now = new Date();
    const resetDate = new Date(now);
    
    if (period === 'monthly') {
      resetDate.setMonth(now.getMonth() + 1);
    } else {
      resetDate.setFullYear(now.getFullYear() + 1);
    }
    
    resetDate.setDate(1);
    resetDate.setHours(0, 0, 0, 0);
    
    return resetDate.toISOString();
  }

  public clearCache(userId?: string) {
    if (userId) {
      this.quotaCache.delete(userId);
    } else {
      this.quotaCache.clear();
    }
  }
}
