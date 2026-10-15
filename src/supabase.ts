import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://imibgagqoavofdnfzgrg.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_pNkEdO7QJLJMNykimVNGmw_UjB7YVPW';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to test connection
export async function testSupabaseConnection(): Promise<{ success: boolean; message?: string }> {
  try {
    const { error } = await supabase.from('_test_connection').select('*').limit(1);
    // If the table doesn't exist (PGRST204 or 404 or 42P01), that's fine - connection itself succeeded
    if (error && error.code !== 'PGRST204' && error.code !== '42P01' && !error.message.includes('relation') && !error.message.includes('schema cache')) {
      console.warn('Supabase test ping notice:', error.message);
    }
    return { success: true };
  } catch (err: any) {
    console.error('Supabase connection error:', err);
    return { success: false, message: err?.message };
  }
}
