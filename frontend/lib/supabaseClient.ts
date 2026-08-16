import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// During static builds these env vars may be undefined. Avoid throwing at import time
// so pages that import this module during prerender won't crash the build.
export const supabase: any =
	supabaseUrl && supabaseKey
		? createClient(supabaseUrl, supabaseKey)
		: {
				// Minimal shim for storage usage in the app — methods return errors at runtime
				storage: {
					from: (_: string) => ({
						upload: async () => ({ error: { message: "Supabase not configured" } }),
						getPublicUrl: (_p: string) => ({ data: { publicUrl: "" } }),
					}),
				},
			};