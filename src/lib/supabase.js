import { createClient } from '@supabase/supabase-js'

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

// Automatically sanitize URL in case /rest/v1 or trailing slash was included
supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
