
-- 1. Users Table Updates
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS balance BIGINT DEFAULT 10000,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS visit_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Ensure username is unique
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_username_key') THEN
        ALTER TABLE public.users ADD CONSTRAINT users_username_key UNIQUE (username);
    END IF;
END $$;

-- 2. Items Table Updates
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS base_price INTEGER,
ADD COLUMN IF NOT EXISTS is_food BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 3. Inventory Table Updates
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS item_id UUID,
ADD COLUMN IF NOT EXISTS is_cleaned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS purchase_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Add Foreign Key Constraints (if missing)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_user_id_fkey') THEN
        ALTER TABLE public.inventory ADD CONSTRAINT inventory_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_item_id_fkey') THEN
        ALTER TABLE public.inventory ADD CONSTRAINT inventory_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Chat Messages Table Updates
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS sender TEXT,
ADD COLUMN IF NOT EXISTS message_content TEXT,
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Add Foreign Key and Check Constraint
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_user_id_fkey') THEN
        ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_sender_check') THEN
        ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_sender_check CHECK (sender IN ('user', 'npc'));
    END IF;
END $$;

-- 5. User Logs Table
CREATE TABLE IF NOT EXISTS public.user_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT, -- Store username for easier tracking
    event_type TEXT NOT NULL,
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable RLS and Policies (Fix for 401 error)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_logs ENABLE ROW LEVEL SECURITY;

-- users policies: Allow public insert (registration) and selection (login check)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert on users') THEN
        CREATE POLICY "Allow public insert on users" ON public.users FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public select on users') THEN
        CREATE POLICY "Allow public select on users" ON public.users FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public update on users') THEN
        CREATE POLICY "Allow public update on users" ON public.users FOR UPDATE USING (true);
    END IF;
END $$;

-- items policies: Allow public read
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public select on items') THEN
        CREATE POLICY "Allow public select on items" ON public.items FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert on items') THEN
        CREATE POLICY "Allow public insert on items" ON public.items FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public delete on items') THEN
        CREATE POLICY "Allow public delete on items" ON public.items FOR DELETE USING (true);
    END IF;
END $$;

-- inventory policies: Allow public access for simulation
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on inventory') THEN
        CREATE POLICY "Allow public access on inventory" ON public.inventory FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- user_logs policies: Allow public insert
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert on user_logs') THEN
        CREATE POLICY "Allow public insert on user_logs" ON public.user_logs FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public select on user_logs') THEN
        CREATE POLICY "Allow public select on user_logs" ON public.user_logs FOR SELECT USING (true);
    END IF;
END $$;

-- chat_messages policies: Allow public access
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on chat_messages') THEN
        CREATE POLICY "Allow public access on chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 7. Initial Master User Setup/Update
INSERT INTO public.users (username, password, balance, is_admin)
VALUES ('master', 'master131107', 1000000, true)
ON CONFLICT (username) DO UPDATE 
SET password = EXCLUDED.password, is_admin = true;
