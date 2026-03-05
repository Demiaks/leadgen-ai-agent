import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const getLandings = async () => {
    const { data, error } = await supabase.from('landings').select('*');
    if (error) throw error;
    return data.reduce((acc: any, item: any) => {
        acc[item.id] = item.html;
        return acc;
    }, {});
};

export const saveLanding = async (id: string, html: string) => {
    const { error } = await supabase.from('landings').upsert({ id, html });
    if (error) throw error;
};

export const deleteLanding = async (id: string) => {
    const { error } = await supabase.from('landings').delete().eq('id', id);
    if (error) throw error;
};
