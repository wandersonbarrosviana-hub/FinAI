-- Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own wallets"
    ON public.wallets
    FOR ALL
    USING (auth.uid() = user_id);

-- Create wallet_assets table
CREATE TABLE IF NOT EXISTS public.wallet_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 0,
    purchase_price NUMERIC NOT NULL DEFAULT 0,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('acao', 'fii')),
    tax NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for wallet_assets
ALTER TABLE public.wallet_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage assets in their wallets"
    ON public.wallet_assets
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.wallets
            WHERE public.wallets.id = public.wallet_assets.wallet_id
            AND public.wallets.user_id = auth.uid()
        )
    );
