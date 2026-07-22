import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

function sanitizeUrl(urlInput) {
  if (!urlInput) return 'https://placeholder.supabase.co';
  let cleaned = urlInput.toString().trim().replace(/^["']|["']$/g, '').trim();
  if (!cleaned) return 'https://placeholder.supabase.co';
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '');
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }
  try {
    return new URL(cleaned).origin;
  } catch {
    return cleaned.replace(/\/+$|\/+$/g, '');
  }
}

function sanitizeKey(keyInput) {
  if (!keyInput) return 'placeholder';
  return keyInput.toString().trim().replace(/^["']|["']$/g, '').trim() || 'placeholder';
}

export const supabaseUrl = sanitizeUrl(rawUrl);
export const supabaseAnonKey = sanitizeKey(rawKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

