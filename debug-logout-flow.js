// Debug script to analyze logout flow
console.log("=== LOGOUT FLOW DEBUG ANALYSIS ===");

// Test 1: Check current authentication state
async function testAuthState() {
  console.log("\n1. Testing authentication state...");
  try {
    const response = await fetch('/api/me', { credentials: 'include' });
    const data = await response.json();
    console.log("Auth response:", data);
    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
  } catch (error) {
    console.error("Auth check failed:", error);
  }
}

// Test 2: Test logout endpoint
async function testLogout() {
  console.log("\n2. Testing logout endpoint...");
  try {
    const response = await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
    });
    const data = await response.json();
    console.log("Logout response:", data);
    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
  } catch (error) {
    console.error("Logout failed:", error);
  }
}

// Test 3: Check auth state after logout
async function testAuthAfterLogout() {
  console.log("\n3. Testing auth state after logout...");
  try {
    const response = await fetch('/api/me', { credentials: 'include' });
    const data = await response.json();
    console.log("Auth after logout:", data);
    console.log("Response status:", response.status);
  } catch (error) {
    console.error("Auth check after logout failed:", error);
  }
}

// Test 4: Check current URL and navigation
function testCurrentLocation() {
  console.log("\n4. Testing current location...");
  console.log("Current URL:", window.location.href);
  console.log("Current pathname:", window.location.pathname);
  console.log("Current search:", window.location.search);
  console.log("Current hash:", window.location.hash);
}

// Run full test sequence
async function runFullTest() {
  testCurrentLocation();
  await testAuthState();
  await testLogout();
  await testAuthAfterLogout();
  testCurrentLocation();
}

// Export for manual testing
if (typeof window !== 'undefined') {
  window.debugLogoutFlow = runFullTest;
  console.log("Debug functions available on window.debugLogoutFlow");
}

runFullTest();