-- Seed the internal dev test firm: is_test_firm=true, is_demo_firm=false.
-- For developer sudo accounts to test full dashboard experience with synthetic data.
-- Distinct from the public demo firm (is_demo_firm=true).

DO $$
DECLARE
  v_firm_id uuid;
  v_client1_id uuid;
  v_client2_id uuid;
BEGIN
  -- 1) Create or get dev test firm (NOT demo firm)
  SELECT id INTO v_firm_id FROM public.firms WHERE name = 'Dev Test Conveyancing LLP' AND is_demo_firm = false LIMIT 1;

  IF v_firm_id IS NULL THEN
    INSERT INTO public.firms (name, state, is_test_firm, is_demo_firm)
    VALUES ('Dev Test Conveyancing LLP', 'FL', true, false)
    RETURNING id INTO v_firm_id;
  ELSE
    UPDATE public.firms SET is_test_firm = true, is_demo_firm = false WHERE id = v_firm_id;
  END IF;

  IF v_firm_id IS NULL THEN
    RAISE EXCEPTION 'Could not create dev test firm';
  END IF;

  -- 2) Seed synthetic clients (no real personal data)
  INSERT INTO public.clients (firm_id, full_name, email, phone)
  SELECT v_firm_id, 'Test Client Alpha', 'test.alpha@dev.example.com', '+1 555 0101'
  WHERE NOT EXISTS (SELECT 1 FROM public.clients WHERE firm_id = v_firm_id AND email = 'test.alpha@dev.example.com');

  INSERT INTO public.clients (firm_id, full_name, email, phone)
  SELECT v_firm_id, 'Test Client Beta', 'test.beta@dev.example.com', '+1 555 0102'
  WHERE NOT EXISTS (SELECT 1 FROM public.clients WHERE firm_id = v_firm_id AND email = 'test.beta@dev.example.com');

  SELECT id INTO v_client1_id FROM public.clients WHERE firm_id = v_firm_id AND email = 'test.alpha@dev.example.com' LIMIT 1;
  SELECT id INTO v_client2_id FROM public.clients WHERE firm_id = v_firm_id AND email = 'test.beta@dev.example.com' LIMIT 1;

  -- 3) Seed synthetic matters
  IF v_client1_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.matters WHERE firm_id = v_firm_id AND client_id = v_client1_id AND property_address = '100 Dev Test St, Miami, FL'
  ) THEN
    INSERT INTO public.matters (firm_id, client_id, matter_type, property_address, status)
    VALUES (v_firm_id, v_client1_id, 'real_estate_purchase', '100 Dev Test St, Miami, FL', 'open');
  END IF;

  IF v_client2_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.matters WHERE firm_id = v_firm_id AND client_id = v_client2_id AND property_address = '200 Dev Test Ave, Tampa, FL'
  ) THEN
    INSERT INTO public.matters (firm_id, client_id, matter_type, property_address, status)
    VALUES (v_firm_id, v_client2_id, 'real_estate_sale', '200 Dev Test Ave, Tampa, FL', 'open');
  END IF;

  -- 4) Seed synthetic lead
  IF NOT EXISTS (SELECT 1 FROM public.leads WHERE firm_id = v_firm_id AND client_email = 'test.lead@dev.example.com') THEN
    INSERT INTO public.leads (firm_id, client_email, client_full_name, matter_type, property_address, status)
    VALUES (v_firm_id, 'test.lead@dev.example.com', 'Test Lead', 'real_estate_purchase', '300 Dev Lane, Orlando, FL', 'new');
  END IF;

  RAISE NOTICE 'Dev test firm seeded: %', v_firm_id;
END $$;
