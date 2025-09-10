// Test script to verify sign out functionality
// Add this to your browser console to test sign out

console.log('🧪 Testing Sign Out Functionality...');

// Check if user is currently signed in
function checkAuthState() {
  // Check if there's a user in the DOM
  const userElement = document.querySelector('[data-testid="user-info"]') || 
                     document.querySelector('span:contains("Hi,")') ||
                     document.querySelector('button:contains("Sign Out")');
  
  if (userElement) {
    console.log('✅ User appears to be signed in');
    return true;
  } else {
    console.log('❌ User appears to be signed out');
    return false;
  }
}

// Test sign out button click
function testSignOut() {
  const signOutButton = document.querySelector('button:contains("Sign Out")') ||
                       Array.from(document.querySelectorAll('button')).find(btn => 
                         btn.textContent.includes('Sign Out'));
  
  if (signOutButton) {
    console.log('🔍 Found sign out button, clicking...');
    signOutButton.click();
    
    // Wait a moment and check if sign out worked
    setTimeout(() => {
      if (!checkAuthState()) {
        console.log('✅ Sign out appears to have worked');
      } else {
        console.log('❌ Sign out may not have worked - user still appears signed in');
      }
    }, 2000);
  } else {
    console.log('❌ Could not find sign out button');
  }
}

// Run the test
console.log('Current auth state:');
checkAuthState();

console.log('To test sign out, run: testSignOut()');
console.log('To check auth state again, run: checkAuthState()');
