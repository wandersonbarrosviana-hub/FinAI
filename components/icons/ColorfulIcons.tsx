import React from 'react';

interface IconProps {
    size?: number;
    className?: string;
}

export const DashboardIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="8" y="8" width="22" height="22" rx="4" fill="#3B82F6" />
        <rect x="34" y="8" width="22" height="22" rx="4" fill="#10B981" />
        <rect x="8" y="34" width="22" height="22" rx="4" fill="#F59E0B" />
        <rect x="34" y="34" width="22" height="22" rx="4" fill="#EF4444" />
        <path d="M14 14H24M14 19H20" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="45" cy="45" r="5" stroke="white" strokeWidth="2" />
    </svg>
);

export const TransactionsIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="32" cy="32" r="28" fill="#F3F4F6" />
        <path d="M18 24H46M46 24L38 16M46 24L38 32" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M46 40H18M18 40L26 48M18 40L26 32" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const InvestmentsIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M8 52L24 36L36 44L56 16" stroke="#10B981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="56" cy="16" r="6" fill="#10B981" />
        <path d="M8 56H56" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <path d="M24 36V48M36 44V48M48 24V48" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="4 4" />
    </svg>
);

export const WalletIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="8" y="16" width="48" height="32" rx="6" fill="#6366F1" />
        <path d="M8 24H56" stroke="#4F46E5" strokeWidth="2" />
        <rect x="40" y="26" width="16" height="12" rx="3" fill="#818CF8" />
        <circle cx="48" cy="32" r="2" fill="white" />
    </svg>
);

export const CreditCardIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="6" y="14" width="52" height="36" rx="6" fill="#1E293B" />
        <rect x="6" y="22" width="52" height="8" fill="#475569" />
        <rect x="12" y="38" width="12" height="6" rx="1" fill="#FBBF24" />
        <path d="M42 38H52" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
    </svg>
);

export const BudgetIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M32 32L32 4C47.464 4 60 16.536 60 32H32Z" fill="#3B82F6" />
        <path d="M32 32L4 32C4 16.536 16.536 4 32 4L32 32Z" fill="#60A5FA" />
        <path d="M32 32L60 32C60 47.464 47.464 60 32 60C16.536 60 4 47.464 4 32H32Z" fill="#1D4ED8" />
    </svg>
);

export const DebtsIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M8 56V24L32 8L56 24V56H8Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
        <rect x="16" y="32" width="8" height="8" rx="1" fill="#EF4444" fillOpacity="0.2" stroke="#EF4444" strokeWidth="2" />
        <rect x="40" y="32" width="8" height="8" rx="1" fill="#EF4444" fillOpacity="0.2" stroke="#EF4444" strokeWidth="2" />
        <rect x="28" y="44" width="8" height="12" fill="#475569" />
    </svg>
);

export const ChartsIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="10" y="34" width="10" height="22" rx="2" fill="#3B82F6" />
        <rect x="27" y="18" width="10" height="38" rx="2" fill="#10B981" />
        <rect x="44" y="26" width="10" height="30" rx="2" fill="#F59E0B" />
        <path d="M6 56H58" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const AIAssistantIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="32" cy="32" r="28" fill="#EEF2FF" stroke="#6366F1" strokeWidth="2" />
        <rect x="20" y="24" width="24" height="20" rx="4" fill="#6366F1" />
        <circle cx="28" cy="32" r="2" fill="white" />
        <circle cx="36" cy="32" r="2" fill="white" />
        <path d="M28 40C28 40 30 42 32 42C34 42 36 40 36 40" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M32 12V24M16 34H20M44 34H48" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const RetirementIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="32" cy="36" r="16" fill="#F59E0B" />
        <path d="M32 10V20M48 16L42 24M60 36H50M48 56L42 48M32 62V52M16 56L22 48M4 36H14M16 16L22 24" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
        <path d="M4 52C4 52 14 44 32 44C50 44 60 52 60 52" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
    </svg>
);

export const CategoriesIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 12H36L56 32L36 52H12L12 12Z" fill="#10B981" />
        <circle cx="20" cy="24" r="4" fill="white" />
        <path d="M12 12H36L32 16H16V48L12 52V12Z" fill="#059669" />
    </svg>
);

export const GoalsIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="32" cy="32" r="28" fill="#EF4444" fillOpacity="0.1" stroke="#EF4444" strokeWidth="2" />
        <circle cx="32" cy="32" r="20" stroke="#EF4444" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="32" cy="32" r="10" fill="#EF4444" />
        <path d="M32 8V12M32 52V56M8 32H12M52 32H56" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const AdminIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M32 6L54 14V30C54 44 44 56 32 60C20 56 10 44 10 30V14L32 6Z" fill="#1E293B" />
        <path d="M32 20V44M24 32H40" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
    </svg>
);

export const ReportsIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M14 6H40L54 20V58H14V6Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
        <path d="M40 6V20H54" stroke="#94A3B8" strokeWidth="2" />
        <path d="M22 34H42M22 42H42M22 50H32" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

export const PlansIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M32 4L58 18V46L32 60L6 46V18L32 4Z" fill="#F59E0B" fillOpacity="0.1" stroke="#F59E0B" strokeWidth="2" />
        <path d="M32 16L36 28H48L38 36L42 48L32 40L22 48L26 36L16 28H28L32 16Z" fill="#F59E0B" />
    </svg>
);
