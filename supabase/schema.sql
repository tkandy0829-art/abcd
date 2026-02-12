-- Supabase Schema for Convenience Store Game

-- Enable uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL, -- Added username as it's common for logins
    password TEXT NOT NULL,
    balance BIGINT DEFAULT 10000,
    is_admin BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    visit_history JSONB DEFAULT '[]'::jsonb, -- To store timestamps or visit logs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Items Table
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    base_price INTEGER NOT NULL,
    is_food BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Inventory Table (Relationship between Users and Items)
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
    is_cleaned BOOLEAN DEFAULT FALSE,
    purchase_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    sender TEXT CHECK (sender IN ('user', 'npc')) NOT NULL,
    message_content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) - Optional but recommended
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Simple Policy Example: Users can read items
CREATE POLICY "Allow public read access on items" ON public.items FOR SELECT USING (true);

-- 5. Initial Master User Setup
-- master / master131107
INSERT INTO public.users (username, password, balance, is_admin)
VALUES ('master', 'master131107', 1000000, true)
ON CONFLICT (username) DO UPDATE 
SET password = EXCLUDED.password, is_admin = true;
