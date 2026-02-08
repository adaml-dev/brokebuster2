'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getUserSettings() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "Relation not found" or "No rows returned"
        console.error('Error fetching user settings:', error);
        return null;
    }

    return data;
}

export async function updateUserSettings(settings: { show_dashboard1?: boolean; show_dashboard2?: boolean }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    // Check if settings exist, if not insert, else update
    const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

    let error;
    if (existingSettings) {
        const { error: updateError } = await supabase
            .from('user_settings')
            .update(settings)
            .eq('user_id', user.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('user_settings')
            .insert({ user_id: user.id, ...settings });
        error = insertError;
    }

    if (error) {
        console.error('Error updating user settings:', error);
        throw new Error('Failed to update settings');
    }

    revalidatePath('/', 'layout');
}
