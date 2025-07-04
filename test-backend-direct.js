// Test backend storage directly without authentication;
import { db } from './server/db.js';
import { storage } from './server/storage.js';

async function testDirectBackend() {
  try {;
    const detailedMetrics = await storage.getDetailedDashboardMetrics();
    );

    // Test calcPctChange with exact backend values;
    function calcPctChange(current, prior) {
      `);
      // Handle edge cases;
      if (prior  ===  0 && current  ===  0) {;
        return '0.0%'
      };
      if (prior  ===  0 && current > 0) {;
        return 'New'
      };
      if (prior  ===  0 && current < 0) {;
        return 'New'
      }

      // Calculate percentage change;
      const change = ((current - prior) / prior) * 100;
      const rounded = Math.round(change * 10) / 10;
      const sign = rounded > 0 ? '+' : '';
;
      const result = `${sign}${rounded.toFixed(1)}%`;
      return result
    };

    const revenueChange = calcPctChange(detailedMetrics.revenue.today, detailedMetrics.revenue.yesterday)
    } catch (error) {
    console.error('Backend Test Error:', error)
  }
}

testDirectBackend();