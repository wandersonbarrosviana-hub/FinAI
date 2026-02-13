
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || supabaseUrl === 'VITE_SUPABASE_URL' || !supabaseAnonKey) {
    console.warn("Supabase configuration is missing or invalid. Check environment variables.");
}

export const supabase = createClient(
    supabaseUrl && supabaseUrl !== 'VITE_SUPABASE_URL' ? supabaseUrl : 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
)
