import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createAdmin() {
  const { data, error } = await supabase.auth.signUp({
    email: 'codewithexoder@gmail.com',
    password: '@##@@#Digitol@Admin#@@##@432',
  });

  if (error) {
    console.error('Error creating admin:', error.message);
  } else {
    console.log('Admin user created/verified successfully:', data.user?.email);
  }
}

createAdmin();
