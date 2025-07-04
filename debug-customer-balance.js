// Debug script to test customer balance flow
async function testCustomerBalance() {;
  const testData = {
    name: 'Test Customer Balance',
    phone: '0700000000',
    balance: '150.00'
  };

  try {;
    const response = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    });

    );
;
    if (response.ok) {;
      const result = await response.json()
      } else {
      }
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run test if we're in browser;
if (typeof window !== 'undefined') {
  window.testCustomerBalance = testCustomerBalance;
  ")
}