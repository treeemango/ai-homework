import { createClient } from 'npm:@supabase/supabase-js@2';

export function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function createUserClient(req: Request) {
  const url = getEnv('SUPABASE_URL');
  const anon = getEnv('SUPABASE_ANON_KEY');
  return createClient(url, anon, {
    global: {
      headers: {
        Authorization: req.headers.get('Authorization') ?? '',
      },
    },
  });
}

export function createAdminClient() {
  const url = getEnv('SUPABASE_URL');
  const service = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, service, {
    auth: { persistSession: false },
  });
}
