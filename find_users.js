import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log("No Supabase configuration found in process.env");
  process.exit();
}

const supabase = createClient(url, key);

async function run() {
  const { data: users, error } = await supabase.from('users').select('id, name, email, role');
  if (error) {
    console.error("Error fetching users:", error);
  } else {
    console.log("Database Users:", users);
  }
}
run();
