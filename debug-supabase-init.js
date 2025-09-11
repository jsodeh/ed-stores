// Debug Supabase initialization
// Run this in your browser console

console.log('🔍 Debugging Supabase initialization...');

// Check if supabase is available globally
console.log('1️⃣ Checking global supabase:', typeof window.supabase);

// Check if we can access it from the app
if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
  console.log('✅ React DevTools available');
} else {
  console.log('❌ React DevTools not available');
}

// Try to access supabase from the app context
try {
  // This might not work depending on how the app is structured
  console.log('2️⃣ Attempting to access supabase from app context...');
  
  // Check if there's a way to access the supabase instance
  const appElement = document.querySelector('#root') || document.querySelector('[data-reactroot]');
  if (appElement) {
    console.log('✅ Found React root element');
  } else {
    console.log('❌ Could not find React root element');
  }
} catch (err) {
  console.log('❌ Error accessing app context:', err);
}

// Test basic fetch to Supabase URL
console.log('3️⃣ Testing direct fetch to Supabase...');
fetch('https://isgqdllaunoydbjweiwo.supabase.co/rest/v1/products?select=id,name&limit=1', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZ3FkbGxhdW5veWRiandlaXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0NzQ5NzQsImV4cCI6MjA1MjA1MDk3NH0.7K8Q9L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0O1P2Q3R4S5T6U7V8W9X0Y1Z2',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZ3FkbGxhdW5veWRiandlaXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0NzQ5NzQsImV4cCI6MjA1MjA1MDk3NH0.7K8Q9L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0O1P2Q3R4S5T6U7V8W9X0Y1Z2'
  }
})
.then(response => {
  console.log('✅ Direct fetch response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('✅ Direct fetch data:', data);
})
.catch(error => {
  console.error('❌ Direct fetch failed:', error);
});

console.log('💡 If direct fetch works but the app doesn\'t, there\'s an issue with the Supabase client initialization');
