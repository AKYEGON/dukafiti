// Debug utility to test calcPctChange function directly
function calcPctChangeTest(current, prior) {
  console.log(`Testing calcPctChange(${current}, ${prior})`);
  
  // Handle edge cases
  if (prior === 0 && current === 0) return "0.0%";
  if (prior === 0 && current > 0) return "New";
  if (prior === 0 && current < 0) return "New";
  
  // Calculate percentage change
  const change = ((current - prior) / prior) * 100;
  
  // Round to one decimal place and add proper sign
  const rounded = Math.round(change * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  
  return `${sign}${rounded.toFixed(1)}%`;
}

// Test cases
console.log("=== DIRECT FUNCTION TESTS ===");
console.log("Test 1 (0 -> 120):", calcPctChangeTest(120, 0)); // Should return "New"
console.log("Test 2 (0 -> 0):", calcPctChangeTest(0, 0)); // Should return "0.0%"
console.log("Test 3 (100 -> 120):", calcPctChangeTest(120, 100)); // Should return "+20.0%"
console.log("Test 4 (120 -> 100):", calcPctChangeTest(100, 120)); // Should return "-16.7%"