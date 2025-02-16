export type BillingPeriod = 'monthly' | 'annual' | 'lifetime' | 'bundle';

export interface BillingFeature {
  name: string;
  description: string;
  value?: number | string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'subscription' | 'lifetime' | 'bundle';
  price: number;
  period?: BillingPeriod;
  features: BillingFeature[];
  metadata: {
    generationCredits?: number;  // For bundle plans
    isLifetime?: boolean;       // For lifetime plans
    maxConcurrentProjects?: number;
    priority?: 'standard' | 'high';
  };
}

export interface BillingUser {
  id: string;
  email: string;
  subscriptionId?: string;
  planId?: string;
  status: 'active' | 'inactive' | 'cancelled';
  credits?: {
    remaining: number;
    total: number;
    lastUpdated: string;
  };
  purchases?: {
    lifetime?: {
      purchaseId: string;
      purchaseDate: string;
    };
    bundles?: Array<{
      purchaseId: string;
      purchaseDate: string;
      totalCredits: number;
      remainingCredits: number;
    }>;
  };
}

export interface BillingQuota {
  generationsRemaining: number;
  generationsTotal: number;
  isUnlimited: boolean;
  resetDate?: string;  // For subscription plans
  quotaType: 'subscription' | 'bundle' | 'lifetime';
}
