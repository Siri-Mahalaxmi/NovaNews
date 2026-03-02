import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://vndancjcrtayhhbfivkq.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuZGFuY2pjcnRheWhoYmZpdmtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzgxMzEsImV4cCI6MjA4MDk1NDEzMX0.luVfCnr7XNfHTy4hrFkMUyWUzS1WPtPDsZKZRQFXXSE"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)