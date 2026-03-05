-- Add purchase_date to wallet_assets
ALTER TABLE public.wallet_assets 
ADD COLUMN purchase_date TIMESTAMPTZ DEFAULT now();

-- Update existing records to have purchase_date equal to created_at
UPDATE public.wallet_assets 
SET purchase_date = created_at 
WHERE purchase_date IS NULL OR purchase_date = now();
