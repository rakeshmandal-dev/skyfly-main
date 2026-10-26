// Safe Supabase client initialization with graceful fallbacks
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

// Check environment variables across Vite import.meta.env and Node process.env
const rawUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL)) ||
  '';

const rawKey =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
      import.meta.env?.VITE_SUPABASE_ANON_KEY ||
      import.meta.env?.SUPABASE_PUBLISHABLE_KEY ||
      import.meta.env?.SUPABASE_ANON_KEY)) ||
  (typeof process !== 'undefined' &&
    (process.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env?.VITE_SUPABASE_ANON_KEY ||
      process.env?.SUPABASE_PUBLISHABLE_KEY ||
      process.env?.SUPABASE_ANON_KEY)) ||
  '';

export const isSupabaseConfigured = Boolean(
  rawUrl &&
    rawKey &&
    !rawUrl.includes('placeholder-project') &&
    rawUrl.startsWith('http')
);

// Fallback dummy credentials to allow offline/demo browsing without crashing the whole application
const FALLBACK_URL = 'https://placeholder-project.supabase.co';
const FALLBACK_KEY = 'sb_publishable_eduvault_demo_placeholder_key_not_configured';

function createSupabaseClient() {
  const SUPABASE_URL = rawUrl || FALLBACK_URL;
  const SUPABASE_PUBLISHABLE_KEY = rawKey || FALLBACK_KEY;

  if (!isSupabaseConfigured) {
    console.warn(
      '[Supabase] Missing VITE_SUPABASE_URL and/or VITE_SUPABASE_PUBLISHABLE_KEY environment variables. ' +
      'Running in safe preview/demo mode. Set these environment variables in your Vercel Project Settings to enable live authentication.'
    );
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
    },
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
