-- Run this script in your Supabase SQL Editor to add the new columns

-- Add raw_content to catalogs table
ALTER TABLE public.catalogs 
ADD COLUMN IF NOT EXISTS raw_content TEXT;

-- Add granular rule failure data to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS failed_rule TEXT,
ADD COLUMN IF NOT EXISTS rule_value NUMERIC,
ADD COLUMN IF NOT EXISTS attempted_value NUMERIC;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
