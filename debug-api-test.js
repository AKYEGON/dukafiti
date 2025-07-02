// Direct API test to examine the exact data flow
import http from 'http';

function makeRequest() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/metrics/dashboard',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('=== DIRECT API RESPONSE ===');
      console.log('Status Code:', res.statusCode);
      
      if (res.statusCode === 200) {
        try {
          const parsed = JSON.parse(data);
          console.log('Full Response:', JSON.stringify(parsed, null, 2));
          
          console.log('\n=== EXACT VALUE TESTS ===');
          console.log('Revenue today type:', typeof parsed.revenue.today);
          console.log('Revenue today value:', parsed.revenue.today);
          console.log('Revenue yesterday type:', typeof parsed.revenue.yesterday);
          console.log('Revenue yesterday value:', parsed.revenue.yesterday);
          
          // Test calcPctChange with exact API values
          function calcPctChange(current, prior) {
            console.log(`\nTesting calcPctChange(${current}, ${prior})`);
            console.log('Prior === 0:', prior === 0);
            console.log('Current > 0:', current > 0);
            
            if (prior === 0 && current === 0) return "0.0%";
            if (prior === 0 && current > 0) return "New";
            if (prior === 0 && current < 0) return "New";
            
            const change = ((current - prior) / prior) * 100;
            const rounded = Math.round(change * 10) / 10;
            const sign = rounded > 0 ? "+" : "";
            
            return `${sign}${rounded.toFixed(1)}%`;
          }
          
          const result = calcPctChange(parsed.revenue.today, parsed.revenue.yesterday);
          console.log('calcPctChange result:', result);
          console.log('Expected: New');
          console.log('Match:', result === 'New');
          
        } catch (error) {
          console.error('JSON Parse Error:', error);
          console.log('Raw Response:', data);
        }
      } else {
        console.log('Error Response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request Error:', error);
  });

  req.end();
}

makeRequest();