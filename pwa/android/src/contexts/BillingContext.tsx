import React, { createContext, useContext, useState, useEffect } from 'react';
import { BillingUser, SubscriptionPlan, BillingQuota } from '../services/billing/types';
import { UnifiedBillingService } from '../services/billing/UnifiedBillingService';

interface BillingContextType {
  user: BillingUser | null;
  plans: SubscriptionPlan[];
  quota: BillingQuota | null;
  isLoading: boolean;
  error: string | null;
  openPortal: () => Promise<void>;
  startSubscription: (planId: string) => Promise<void>;
  purchaseLifetimeLicense: (planId: string) => Promise<void>;
  purchaseGenerationBundle: (planId: string) => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
  consumeCredits: (amount?: number) => Promise<boolean>;
  checkRemainingCredits: () => Promise<number>;
  platformInstructions: string;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const BillingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<BillingUser | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [quota, setQuota] = useState<BillingQuota | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const billingService = UnifiedBillingService.getInstance();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      await billingService.initialize();
      
      // Load user data from your backend
      const userData = await fetch('/api/user').then(res => res.json());
      setUser(userData);
      
      // Load subscription plans
      const plansData = await billingService.getSubscriptionPlans();
      setPlans(plansData);

      // Load user quota if user exists
      if (userData?.id) {
        const quotaData = await billingService.getUserQuota(userData.id);
        setQuota(quotaData);
      }
    } catch (err) {
      setError('Failed to load billing data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const openPortal = async () => {
    if (!user) {
      setError('No user found');
      return;
    }

    try {
      await billingService.openBillingPortal(user.id);
    } catch (err) {
      setError('Failed to open billing portal');
      console.error(err);
    }
  };

  const startSubscription = async (planId: string) => {
    try {
      await billingService.startSubscription(planId);
      await loadInitialData(); // Refresh data after purchase
    } catch (err) {
      setError('Failed to start subscription process');
      console.error(err);
    }
  };

  const purchaseLifetimeLicense = async (planId: string) => {
    try {
      await billingService.purchaseLifetimeLicense(planId);
      await loadInitialData(); // Refresh data after purchase
    } catch (err) {
      setError('Failed to purchase lifetime license');
      console.error(err);
    }
  };

  const purchaseGenerationBundle = async (planId: string) => {
    try {
      await billingService.purchaseGenerationBundle(planId);
      await loadInitialData(); // Refresh data after purchase
    } catch (err) {
      setError('Failed to purchase generation bundle');
      console.error(err);
    }
  };

  const checkSubscriptionStatus = async () => {
    if (!user?.subscriptionId) {
      return;
    }

    try {
      const isValid = await billingService.validateSubscription(user.subscriptionId);
      if (!isValid) {
        setUser(prev => prev ? { ...prev, status: 'inactive' } : null);
      }
    } catch (err) {
      console.error('Failed to validate subscription:', err);
    }
  };

  const consumeCredits = async (amount: number = 1): Promise<boolean> => {
    if (!user?.id) {
      setError('No user found');
      return false;
    }

    try {
      const success = await billingService.consumeCredits(user.id, amount);
      if (success) {
        const newQuota = await billingService.getUserQuota(user.id);
        setQuota(newQuota);
      }
      return success;
    } catch (err) {
      console.error('Failed to consume credits:', err);
      return false;
    }
  };

  const checkRemainingCredits = async (): Promise<number> => {
    if (!user?.id) {
      return 0;
    }

    try {
      return await billingService.checkRemainingCredits(user.id);
    } catch (err) {
      console.error('Failed to check remaining credits:', err);
      return 0;
    }
  };

  const value = {
    user,
    plans,
    quota,
    isLoading,
    error,
    openPortal,
    startSubscription,
    purchaseLifetimeLicense,
    purchaseGenerationBundle,
    checkSubscriptionStatus,
    consumeCredits,
    checkRemainingCredits,
    platformInstructions: billingService.getPlatformSpecificInstructions(),
  };

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
};

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};
