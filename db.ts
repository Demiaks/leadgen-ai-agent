import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('WARNING: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are missing. Database features will be disabled.');
}

const supabase = (supabaseUrl && supabaseServiceKey) 
    ? createClient(supabaseUrl, supabaseServiceKey) 
    : null;

export const getLandings = async () => {
    if (!supabase) return {};
    const { data, error } = await supabase.from('landings').select('*');
    if (error) throw error;
    return data.reduce((acc: any, item: any) => {
        acc[item.id] = item.html;
        return acc;
    }, {});
};

export const saveLanding = async (id: string, html: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('landings').upsert({ id, html });
    if (error) throw error;
};

export const deleteLanding = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('landings').delete().eq('id', id);
    if (error) throw error;
};
