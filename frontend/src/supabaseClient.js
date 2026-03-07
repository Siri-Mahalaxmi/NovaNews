// import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = "https://vndancjcrtayhhbfivkq.supabase.co"
// const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuZGFuY2pjcnRheWhoYmZpdmtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzgxMzEsImV4cCI6MjA4MDk1NDEzMX0.luVfCnr7XNfHTy4hrFkMUyWUzS1WPtPDsZKZRQFXXSE"

// export const supabase = createClient(supabaseUrl, supabaseAnonKey)

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase env vars!", { supabaseUrl, supabaseAnonKey });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  }
});