-- Run this in the Supabase SQL Editor

-- 1. Create tables
CREATE TABLE merchants (
  id UUID REFERENCES auth.users(id) PRIMARY KEY, -- link directly to Supabase auth user
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  business_category TEXT,
  onboarding_status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) NOT NULL,
  raw_source_type TEXT NOT NULL,
  structured_json JSONB,
  last_synced_at TIMESTAMPTZ
);

CREATE TABLE readiness_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) NOT NULL,
  score INTEGER NOT NULL,
  breakdown_json JSONB,
  computed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) NOT NULL,
  name TEXT NOT NULL,
  max_amount_per_order INTEGER,
  max_daily_amount INTEGER,
  allowed_categories TEXT[],
  velocity_limit_per_day INTEGER,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) NOT NULL,
  mandate_id UUID REFERENCES mandates(id),
  agent_session_id UUID,
  amount INTEGER NOT NULL,
  category TEXT,
  status TEXT NOT NULL, -- approved, denied, failed, completed
  reason_text TEXT,
  razorpay_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ,
  transcript_json JSONB
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Merchants can only view and update their own profile
CREATE POLICY "Merchants can view own profile" 
ON merchants FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Merchants can update own profile" 
ON merchants FOR UPDATE 
USING (auth.uid() = id);

-- Catalogs
CREATE POLICY "Merchants can view own catalogs" 
ON catalogs FOR SELECT 
USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can insert own catalogs" 
ON catalogs FOR INSERT 
WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Merchants can update own catalogs" 
ON catalogs FOR UPDATE 
USING (auth.uid() = merchant_id);

-- Readiness Scores
CREATE POLICY "Merchants can view own readiness scores" 
ON readiness_scores FOR SELECT 
USING (auth.uid() = merchant_id);

-- Mandates
CREATE POLICY "Merchants can manage own mandates" 
ON mandates FOR ALL 
USING (auth.uid() = merchant_id);

-- Transactions
CREATE POLICY "Merchants can view own transactions" 
ON transactions FOR SELECT 
USING (auth.uid() = merchant_id);

-- Agent Sessions
CREATE POLICY "Merchants can view own agent sessions" 
ON agent_sessions FOR SELECT 
USING (auth.uid() = merchant_id);

-- 4. Automatically create merchant row on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.merchants (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
