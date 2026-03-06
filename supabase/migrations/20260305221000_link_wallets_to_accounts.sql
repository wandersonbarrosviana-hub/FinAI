-- Migration: Link Wallets to Accounts
-- This migration adds account_id to wallets and wallet_assets to allow specific cash tracking per wallet.

ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS account_id UUID;

ALTER TABLE public.wallet_assets 
ADD COLUMN IF NOT EXISTS account_id UUID;

-- Optional: Add a comment to columns
COMMENT ON COLUMN public.wallets.account_id IS 'Specific investment account linked to this wallet for cash tracking.';
COMMENT ON COLUMN public.wallet_assets.account_id IS 'The account used to pay for this specific asset purchase.';
