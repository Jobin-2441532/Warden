-- Seed script to populate demo data for Warden
-- Run this in the Supabase SQL Editor AFTER running supabase_schema.sql

-- 1. Create a demo user if one doesn't exist (Replace with your actual auth.users ID if you want to link it)
-- Note: In Supabase, you must first create a user in the Auth UI, grab their UUID, and replace it here.
-- Assuming we have a placeholder merchant_id for demo purposes. Let's insert a merchant record directly.
-- If RLS blocks this, disable RLS temporarily or use the Supabase Service Role key.

DO $$ 
DECLARE
  -- IMPORTANT: Replace the string below with the User UID from your Supabase Authentication dashboard!
  demo_merchant_id UUID := 'REPLACE_ME_WITH_COPIED_USER_UID';
  demo_mandate_id UUID := gen_random_uuid();
BEGIN

  -- Insert Demo Merchant
  INSERT INTO public.merchants (id, name, email, business_category, onboarding_status)
  VALUES (demo_merchant_id, 'Acme Electronics', 'demo@acme.com', 'Electronics', 'completed');

  -- Insert Demo Catalog
  INSERT INTO public.catalogs (merchant_id, raw_source_type, structured_json)
  VALUES (
    demo_merchant_id, 
    'json', 
    '[
      {"id": "p1", "name": "ThinkPad T14", "description": "Business Laptop", "price_inr": 85000, "category": "Electronics", "in_stock": true, "stock_quantity": 42, "policy": {"returns": "30 days", "shipping": "Free"}, "last_updated": "2024-05-01T00:00:00Z"},
      {"id": "p2", "name": "Logitech MX Master 3", "description": "Wireless Mouse", "price_inr": 8500, "category": "Accessories", "in_stock": true, "stock_quantity": 115, "policy": {"returns": "14 days", "shipping": "Standard"}, "last_updated": "2024-05-01T00:00:00Z"},
      {"id": "p3", "name": "Keychron K2", "description": "Mechanical Keyboard", "price_inr": 7500, "category": "Accessories", "in_stock": true, "stock_quantity": 10, "policy": {"returns": "14 days", "shipping": "Standard"}, "last_updated": "2024-05-01T00:00:00Z"}
    ]'::jsonb
  );

  -- Insert Demo Mandate
  INSERT INTO public.mandates (id, merchant_id, name, max_amount_per_order, max_daily_amount, velocity_limit_per_day, allowed_categories, is_active)
  VALUES (
    demo_mandate_id,
    demo_merchant_id,
    'Standard Agent Mandate',
    100000, -- 1 Lakh per order max
    500000, -- 5 Lakhs daily max
    20,
    ARRAY['Electronics', 'Accessories'],
    true
  );

  -- Insert Demo Readiness Score
  INSERT INTO public.readiness_scores (merchant_id, score, breakdown_json)
  VALUES (
    demo_merchant_id,
    92,
    '[
      {"title": "Catalog Completeness", "points": 30, "maxPoints": 30, "tip": "Excellent, all products are fully structured."},
      {"title": "Policy Clarity", "points": 20, "maxPoints": 20, "tip": "Policies are crystal clear for AI buyers."},
      {"title": "Data Freshness", "points": 15, "maxPoints": 15, "tip": "Catalog synced recently. Keep it up!"},
      {"title": "Mandate Configuration", "points": 15, "maxPoints": 15, "tip": "Active spending limits are set."},
      {"title": "Taxonomy Coverage", "points": 12, "maxPoints": 20, "tip": "Categorize 1 product correctly to gain +8 points."}
    ]'::jsonb
  );

  -- Insert Some Transactions for Control Tower
  INSERT INTO public.transactions (merchant_id, mandate_id, amount, category, status, reason_text)
  VALUES 
    (demo_merchant_id, demo_mandate_id, 8500, 'Accessories', 'approved', 'Approved: Transaction meets all mandate constraints.'),
    (demo_merchant_id, demo_mandate_id, 120000, 'Electronics', 'denied', 'Denied: Transaction amount ($120000) exceeds the per-order limit of $100000.'),
    (demo_merchant_id, demo_mandate_id, 7500, 'Accessories', 'approved', 'Approved: Transaction meets all mandate constraints.');

END $$;
