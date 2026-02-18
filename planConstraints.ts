
export const PLAN_LIMITS = {
    free: {
        maxMonthlyTransactions: 20,
        maxDailyAIMessages: 3,
        hasCustomBudgets: false,
        hasReports: true,
    },
    premium: {
        maxMonthlyTransactions: Infinity,
        maxDailyAIMessages: Infinity,
        hasCustomBudgets: true,
        hasReports: true,
    }
};

export const canAddTransaction = (plan: 'free' | 'premium', currentCount: number) => {
    return currentCount < PLAN_LIMITS[plan].maxMonthlyTransactions;
};

export const canUseAI = (plan: 'free' | 'premium', dailyCount: number) => {
    return dailyCount < PLAN_LIMITS[plan].maxDailyAIMessages;
};

export const hasAccessToFeature = (plan: 'free' | 'premium', feature: keyof typeof PLAN_LIMITS['free']) => {
    return !!PLAN_LIMITS[plan][feature];
};
