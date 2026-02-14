-- Add missing columns to inventory table for full item persistence
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS base_price INTEGER,
ADD COLUMN IF NOT EXISTS is_food BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS original_id UUID; -- Link to items table if needed

-- Drop NOT NULL constraint on item_id to allow more flexible item creation
ALTER TABLE public.inventory ALTER COLUMN item_id DROP NOT NULL;

-- Update existing records can be tricky, but since it's a new feature, we can just let it be.
