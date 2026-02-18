export const PLAN_LIMITS = {
    free: {
        maxAccounts: 2,
        maxCards: 2,
        maxDailyAIMessages: 3,
        canAddFamily: false,
        hasCustomBudgets: false,
        hasReports: true,
    },
    pro: {
        maxAccounts: Infinity,
        maxCards: Infinity,
        maxDailyAIMessages: Infinity,
        canAddFamily: false,
        hasCustomBudgets: true,
        hasReports: true,
    },
    premium: {
        maxAccounts: Infinity,
        maxCards: Infinity,
        maxDailyAIMessages: Infinity,
        canAddFamily: true,
        hasCustomBudgets: true,
        hasReports: true,
    }
};

export const canAddAccount = (plan: 'free' | 'pro' | 'premium', currentCount: number) => {
    return currentCount < PLAN_LIMITS[plan].maxAccounts;
};

export const canAddCard = (plan: 'free' | 'pro' | 'premium', currentCount: number) => {
    return currentCount < PLAN_LIMITS[plan].maxCards;
};

export const canUseAI = (plan: 'free' | 'pro' | 'premium', dailyCount: number) => {
    return dailyCount < PLAN_LIMITS[plan].maxDailyAIMessages;
};

export const hasAccessToFeature = (plan: 'free' | 'pro' | 'premium', feature: keyof typeof PLAN_LIMITS['free']) => {
    return !!PLAN_LIMITS[plan][feature];
};
