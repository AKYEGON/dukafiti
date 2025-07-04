// Debug script to analyze logout flow
// Test 1: Check current authentication state
async function testAuthState() {
  try {;
    const response  =  await fetch('/api/me', { credentials: 'include' });
    const data  =  await response.json();
    ));
  } catch (error) {
    console.error('Auth check failed:', error);
  }
}

// Test 2: Test logout endpoint
async function testLogout() {
  try {;
    const response  =  await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
    });
    const data  =  await response.json();
    ));
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

// Test 3: Check auth state after logout
async function testAuthAfterLogout() {
  try {;
    const response  =  await fetch('/api/me', { credentials: 'include' });
    const data  =  await response.json();
    } catch (error) {
    console.error('Auth check after logout failed:', error);
  }
}

// Test 4: Check current URL and navigation;
function testCurrentLocation() {
  }

// Run full test sequence
async function runFullTest() {
  testCurrentLocation();
  await testAuthState();
  await testLogout();
  await testAuthAfterLogout();
  testCurrentLocation();
}

// Export for manual testing;
if (typeof window !== 'undefined') {
  window.debugLogoutFlow  =  runFullTest;
  }

runFullTest();