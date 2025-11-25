
import { createClient } from '@supabase/supabase-js';

import fs from 'fs';

// Manually parse .env.local because dotenv might not pick it up automatically or we want to be sure
const envConfig = fs.readFileSync('.env.local', 'utf8');
const env = {};
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verify() {
    console.log('Testing connection to:', supabaseUrl);
    // Try to fetch session or something public
    // Since we haven't run SQL yet, tables might not exist.
    // But we can check if we get a connection error or just a "table not found" error.
    // Or we can try to sign up a dummy user? No, that spams the auth.
    // Let's try to get the session, which should be null but successful.
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Connection failed:', error.message);
    } else {
        console.log('Connection successful! Session:', data.session);
    }
}

verify();
