-- Add whatsapp_enabled column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT false;

-- Comment on column
COMMENT ON COLUMN public.user_profiles.whatsapp_enabled IS 'Whether the user receives WhatsApp notifications for orders';
