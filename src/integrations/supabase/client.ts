// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://curqpfwrwcaekicjszcr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cnFwZndyd2NhZWtpY2pzemNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NDUzNzUsImV4cCI6MjA2ODMyMTM3NX0.uiTsydivhKcGHX8WaaMSlYx-L8SVxsYQg4GowMU6ROs";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});