-- Migration: Add whatsapp_number to profiles
alter table profiles add column if not exists whatsapp_number text;

-- Index for faster lookup by phone number (used by the WhatsApp bot)
create index if not exists idx_profiles_whatsapp_number on profiles(whatsapp_number);
