-- Migration to add plan_type to profiles and ensure user_id is unique on user_subscriptions

-- Add plan_type to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='plan_type') THEN
        ALTER TABLE public.profiles ADD COLUMN plan_type TEXT DEFAULT 'free';
    END IF;
END
$$;

-- Add unique constraint to user_id on user_subscriptions for upserts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_subscriptions_user_id_key') THEN
        ALTER TABLE public.user_subscriptions ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);
    END IF;
END
$$;
