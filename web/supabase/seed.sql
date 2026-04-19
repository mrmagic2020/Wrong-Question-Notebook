-- Seed data for local development
-- Runs automatically on `npx supabase db reset`
--
-- Test accounts:
--   test@example.com  / password123  (regular user)
--   admin@example.com / password123  (admin user)

-- =====================================================
-- Test user (regular)
-- =====================================================
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"testuser","first_name":"Test","last_name":"User"}',
  false
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'sub', '00000000-0000-0000-0000-000000000001',
    'email', 'test@example.com'
  ),
  'email',
  '00000000-0000-0000-0000-000000000001',
  now(), now(), now()
);

-- The handle_new_user trigger auto-creates the user_profiles row.

-- =====================================================
-- Admin user
-- =====================================================
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000002',
  'authenticated', 'authenticated',
  'admin@example.com',
  crypt('password123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"admin","first_name":"Admin","last_name":"User"}',
  false
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000002',
  jsonb_build_object(
    'sub', '00000000-0000-0000-0000-000000000002',
    'email', 'admin@example.com'
  ),
  'email',
  '00000000-0000-0000-0000-000000000002',
  now(), now(), now()
);

-- Promote to admin (trigger creates profile with default 'user' role)
UPDATE public.user_profiles
SET user_role = 'admin'
WHERE id = '00000000-0000-0000-0000-000000000002';
