// API Key Validation and Fix Guide
console.log('🔍 Supabase API Key Validation...');

// Check the current API key
const currentKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZ3FkbGxhdW5veWRiandlaXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1MTc2MDcsImV4cCI6MjA1MzA5MzYwN30.O-w9MXPBBpMcWXUrH5dGqaorZNFzJ2jKi2LuGKmnXps";

try {
  // Decode JWT token to check if it's valid
  const parts = currentKey.split('.');
  if (parts.length !== 3) {
    console.error('❌ Invalid JWT format - should have 3 parts separated by dots');
  } else {
    console.log('✅ JWT format is valid (3 parts)');
    
    // Decode the payload
    const payload = JSON.parse(atob(parts[1]));
    console.log('📋 JWT Payload:', payload);
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    const exp = payload.exp;
    
    if (exp && exp < now) {
      console.error('❌ JWT Token has EXPIRED!');
      console.log('⏰ Expired on:', new Date(exp * 1000));
    } else if (exp) {
      console.log('✅ JWT Token is still valid');
      console.log('⏰ Expires on:', new Date(exp * 1000));
    }
    
    // Check if it's for the right project
    if (payload.ref === 'isgqdllaunoydbjweiwo') {
      console.log('✅ Token is for the correct Supabase project');
    } else {
      console.error('❌ Token is for wrong project. Expected: isgqdllaunoydbjweiwo, Got:', payload.ref);
    }
    
    // Check role
    if (payload.role === 'anon') {
      console.log('✅ Token has correct role (anon)');
    } else {
      console.error('❌ Token has wrong role. Expected: anon, Got:', payload.role);
    }
  }
} catch (error) {
  console.error('❌ Failed to decode JWT:', error);
}

console.log('\n🔧 How to Fix:');
console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
console.log('2. Select your project: ed-stores');
console.log('3. Go to Settings → API');
console.log('4. Copy the NEW "anon public" key');
console.log('5. Update your .env file with the new key');
console.log('6. Restart your development server');

console.log('\n⚠️ If the project doesn\'t exist:');
console.log('1. Create a new Supabase project');
console.log('2. Import your database schema');
console.log('3. Set up RLS policies');
console.log('4. Update .env with new URL and key');