import { createClient } from '@supabase/supabase-js';

// NOTA: Reemplaza estas constantes con las de tu proyecto en Supabase (Settings -> API)
// Idealmente, estas deberían estar en un archivo .env, pero para este entorno las definimos aquí o las leemos de process.env
export const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://nhiturntlkazwoixxlqa.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaXR1cm50bGthendvaXh4bHFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MTIzOTYsImV4cCI6MjA4NjA4ODM5Nn0.Wa47A2r4dFGV-Z6HYgF45t1cWrCVijowm03Kr_02Tc8';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);