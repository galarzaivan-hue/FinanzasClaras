import { createClient } from '@supabase/supabase-js';

// Sanear y obtener las variables de entorno (soporta VITE_SUPABASE_*, SUPABASE_*, y NEXT_PUBLIC_SUPABASE_*)
const envUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (import.meta as any).env?.SUPABASE_URL ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL;

const envKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.SUPABASE_ANON_KEY ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const defaultUrl = 'https://mgelexaouzpztealkybq.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nZWxleGFvdXpwenRlYWxreWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1ODYwODUsImV4cCI6MjEwMDE2MjA4NX0.uOjQ1-b6m4b-PXgFTmwYBhOh9q3OaHgwv6695SR4lgw';

function sanitizeSupabaseUrl(urlInput: string): string {
  if (!urlInput) return defaultUrl;
  let cleaned = urlInput.toString().trim().replace(/^["']|["']$/g, '').trim();
  if (!cleaned) return defaultUrl;

  // Remover /rest/v1 o subrutas al final antes de obtener el origin
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '');

  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }

  try {
    const parsed = new URL(cleaned);
    // URL.origin devuelve "https://dominio.supabase.co" sin barras finales ni subrutas que rompen PostgREST
    return parsed.origin;
  } catch {
    return cleaned.replace(/\/+$|\/+$/g, '');
  }
}

function sanitizeSupabaseKey(keyInput: string): string {
  if (!keyInput) return defaultKey;
  const cleaned = keyInput.toString().trim().replace(/^["']|["']$/g, '').trim();
  return cleaned || defaultKey;
}

export const supabaseUrl = sanitizeSupabaseUrl(envUrl);
export const supabaseAnonKey = sanitizeSupabaseKey(envKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


