-- Seed demo law firm and sample data. Runs with migration privileges (bypasses RLS).
-- After this, create the demo lawyer auth user via Dashboard or re-run the seed script.

DO $$
DECLARE
  v_firm_id uuid;
  v_client1_id uuid;
  v_client2_id uuid;
BEGIN
  -- 1) Create or get demo firm
  SELECT id INTO v_firm_id FROM public.firms WHERE name = 'Demo Conveyancing LLP' LIMIT 1;

  IF v_firm_id IS NULL THEN
    INSERT INTO public.firms (name, state, is_test_firm, is_demo_firm)
    VALUES ('Demo Conveyancing LLP', 'FL', true, true)
    RETURNING id INTO v_firm_id;
  ELSE
    UPDATE public.firms SET is_demo_firm = true, is_test_firm = true WHERE id = v_firm_id;
  END IF;

  IF v_firm_id IS NULL THEN
    RAISE EXCEPTION 'Could not create demo firm';
  END IF;

  -- 2) Seed demo clients (avoid duplicates)
  INSERT INTO public.clients (firm_id, full_name, email, phone)
  SELECT v_firm_id, 'Jane Smith', 'jane.smith@example.com', '+1 305 555 0101'
  WHERE NOT EXISTS (SELECT 1 FROM public.clients WHERE firm_id = v_firm_id AND email = 'jane.smith@example.com');

  INSERT INTO public.clients (firm_id, full_name, email, phone)
  SELECT v_firm_id, 'Bob Jones', 'bob.jones@example.com', '+1 305 555 0102'
  WHERE NOT EXISTS (SELECT 1 FROM public.clients WHERE firm_id = v_firm_id AND email = 'bob.jones@example.com');

  SELECT id INTO v_client1_id FROM public.clients WHERE firm_id = v_firm_id AND email = 'jane.smith@example.com' LIMIT 1;
  SELECT id INTO v_client2_id FROM public.clients WHERE firm_id = v_firm_id AND email = 'bob.jones@example.com' LIMIT 1;

  -- 3) Seed demo matters
  IF v_client1_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.matters WHERE firm_id = v_firm_id AND client_id = v_client1_id AND property_address = '123 Demo St, Miami, FL'
  ) THEN
    INSERT INTO public.matters (firm_id, client_id, matter_type, property_address, status)
    VALUES (v_firm_id, v_client1_id, 'real_estate_purchase', '123 Demo St, Miami, FL', 'open');
  END IF;

  IF v_client1_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.matters WHERE firm_id = v_firm_id AND client_id = v_client1_id AND property_address = '456 Sandbox Ave, Tampa, FL'
  ) THEN
    INSERT INTO public.matters (firm_id, client_id, matter_type, property_address, status)
    VALUES (v_firm_id, v_client1_id, 'conveyancing', '456 Sandbox Ave, Tampa, FL', 'open');
  END IF;

  IF v_client2_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.matters WHERE firm_id = v_firm_id AND client_id = v_client2_id AND property_address = '789 Sample Dr, Orlando, FL'
  ) THEN
    INSERT INTO public.matters (firm_id, client_id, matter_type, property_address, status)
    VALUES (v_firm_id, v_client2_id, 'real_estate_sale', '789 Sample Dr, Orlando, FL', 'open');
  END IF;

  -- 4) Seed demo lead (assigned_to_user_id left null; will be set when demo lawyer exists)
  IF NOT EXISTS (SELECT 1 FROM public.leads WHERE firm_id = v_firm_id AND client_email = 'demo.client@example.com') THEN
    INSERT INTO public.leads (firm_id, client_email, client_full_name, matter_type, property_address, status)
    VALUES (v_firm_id, 'demo.client@example.com', 'Demo Client', 'real_estate_purchase', '100 Demo Lane, Miami, FL', 'new');
  END IF;

  RAISE NOTICE 'Demo firm seeded: %', v_firm_id;
END $$;
