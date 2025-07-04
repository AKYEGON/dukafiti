// Direct API test to examine the exact data flow;
import http from 'http';
;
function makeRequest() {;
  const options  =  {
    hostname: 'localhost',
    port: 5000,
    path: '/api/metrics/dashboard',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
;
  const req  =  http.request(options, (res)  = > {;
    let data  =  '';

    res.on('data', (chunk)  = > {
      data + =  chunk;
    });

    res.on('end', ()  = > {;
      if (res.statusCode  ===  200) {
        try {;
          const parsed  =  JSON.parse(data);
          );

          // Test calcPctChange with exact API values;
          function calcPctChange(current, prior) {
            `);
            if (prior  ===  0 && current  ===  0) return '0.0%';
            if (prior  ===  0 && current > 0) return 'New';
            if (prior  ===  0 && current < 0) return 'New';
;
            const change  =  ((current - prior) / prior) * 100;
            const rounded  =  Math.round(change * 10) / 10;
            const sign  =  rounded > 0 ? '+' : '';
;
            return `${sign}${rounded.toFixed(1)}%`;
          };

          const result  =  calcPctChange(parsed.revenue.today, parsed.revenue.yesterday);
          } catch (error) {
          console.error('JSON Parse Error:', error);
          }
      } else {
        }
    });
  });

  req.on('error', (error)  = > {
    console.error('Request Error:', error);
  });

  req.end();
}

makeRequest();