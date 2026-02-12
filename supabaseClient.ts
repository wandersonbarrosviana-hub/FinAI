
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log("Supabase Client Initializing...");
console.log("URL Status:", supabaseUrl && supabaseUrl !== 'VITE_SUPABASE_URL' ? "VALID FORMAT" : "MISSING/PLACEHOLDER");
console.log("Key Status:", supabaseAnonKey ? "PRESENT" : "MISSING");

if (!supabaseUrl || supabaseUrl === 'VITE_SUPABASE_URL' || !supabaseAnonKey) {
    console.error("CRITICAL: Supabase configuration is missing or invalid!");
}

// Ensure we don't pass undefined/placeholders to createClient if we want to avoid top-level crashes
// though createClient might still need something. Let's use placeholders that don't crash but fail requests.
export const supabase = createClient(
    supabaseUrl && supabaseUrl !== 'VITE_SUPABASE_URL' ? supabaseUrl : 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
)
