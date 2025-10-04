import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://isgqdllaunoydbjweiwo.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUserRole() {
  try {
    const userEmail = 'jsodeh@gmail.com';
    console.log(`🔍 Checking role for user with email: ${userEmail}`);
    
    // Find the user by email
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .eq('email', userEmail)
      .single();
    
    if (userError) {
      console.error('❌ Error finding user:', userError);
      return;
    }
    
    if (!userData) {
      console.error('❌ User not found with email:', userEmail);
      return;
    }
    
    console.log('✅ User found:', userData);
    console.log('📋 User role:', userData.role);
    
    // Check if user is admin
    const isAdmin = userData.role === 'admin' || userData.role === 'super_admin';
    console.log('🔐 Is admin:', isAdmin);
    
  } catch (err) {
    console.error('❌ Error checking user role:', err);
  }
}

checkUserRole();