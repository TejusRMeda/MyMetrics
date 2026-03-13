import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Using untyped client — Supabase auto-generated types can be added later
// via: npx supabase gen types typescript --project-id <ref> > src/types/supabase.ts
export const supabase = supabaseUrl
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as ReturnType<typeof createClient>)
