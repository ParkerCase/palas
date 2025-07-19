import { createBrowserClient } from '@supabase/ssr'

// Global singleton client instance
let globalClient: ReturnType<typeof createBrowserClient> | null = null
let clientCreationCount = 0

// Client-side Supabase client
export function createClient() {
  clientCreationCount++
  console.log(`[SUPABASE GLOBAL] createClient called (${clientCreationCount} times)`)
  
  if (!globalClient) {
    console.log('[SUPABASE GLOBAL] Creating new global client instance')
    globalClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  } else {
    console.log('[SUPABASE GLOBAL] Reusing existing global client instance')
  }
  return globalClient
}

// For backward compatibility - alias the functions
export const createClientComponentClient = createClient

// Export the global client instance directly
export const supabase = createClient()
