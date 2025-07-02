// Test backend storage directly without authentication
import { db } from './server/db.js';
import { storage } from './server/storage.js';

async function testDirectBackend() {
  console.log('=== DIRECT BACKEND STORAGE TEST ===');
  
  try {
    const detailedMetrics = await storage.getDetailedDashboardMetrics();
    console.log('Raw Backend Response:', JSON.stringify(detailedMetrics, null, 2));
    
    console.log('\n=== TYPE AND VALUE ANALYSIS ===');
    console.log('Revenue today value:', detailedMetrics.revenue.today, 'Type:', typeof detailedMetrics.revenue.today);
    console.log('Revenue yesterday value:', detailedMetrics.revenue.yesterday, 'Type:', typeof detailedMetrics.revenue.yesterday);
    
    // Test calcPctChange with exact backend values
    function calcPctChange(current, prior) {
      console.log(`\nTesting calcPctChange(${current}, ${prior})`);
      console.log('Type checks:');
      console.log('  typeof current:', typeof current);
      console.log('  typeof prior:', typeof prior);
      console.log('  prior === 0:', prior === 0);
      console.log('  current === 0:', current === 0);
      console.log('  current > 0:', current > 0);
      
      // Handle edge cases
      if (prior === 0 && current === 0) {
        console.log('  Returning: 0.0%');
        return "0.0%";
      }
      if (prior === 0 && current > 0) {
        console.log('  Returning: New');
        return "New";
      }
      if (prior === 0 && current < 0) {
        console.log('  Returning: New');
        return "New";
      }
      
      // Calculate percentage change
      const change = ((current - prior) / prior) * 100;
      const rounded = Math.round(change * 10) / 10;
      const sign = rounded > 0 ? "+" : "";
      
      const result = `${sign}${rounded.toFixed(1)}%`;
      console.log('  Returning:', result);
      return result;
    }
    
    console.log('\n=== PERCENTAGE CALCULATION TEST ===');
    const revenueChange = calcPctChange(detailedMetrics.revenue.today, detailedMetrics.revenue.yesterday);
    console.log('Final Revenue Change Result:', revenueChange);
    console.log('Expected: New');
    console.log('Match Expected:', revenueChange === 'New');
    
  } catch (error) {
    console.error('Backend Test Error:', error);
  }
}

testDirectBackend();