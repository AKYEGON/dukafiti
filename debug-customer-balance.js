// Debug script to test customer balance flow
async function testCustomerBalance() {
  const testData = {
    name: "Test Customer Balance",
    phone: "0700000000",
    balance: "150.00"
  };
  
  console.log("=== CLIENT SIDE DEBUG ===");
  console.log("Original test data:", testData);
  console.log("Balance field:", testData.balance);
  console.log("Balance type:", typeof testData.balance);
  
  try {
    const response = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testData),
    });
    
    console.log("Request sent with body:", JSON.stringify(testData));
    
    if (response.ok) {
      const result = await response.json();
      console.log("Response received:", result);
      console.log("Balance in response:", result.balance);
    } else {
      console.log("Request failed:", response.status);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run test if we're in browser
if (typeof window !== 'undefined') {
  window.testCustomerBalance = testCustomerBalance;
  console.log("Debug function loaded. Run: testCustomerBalance()");
}