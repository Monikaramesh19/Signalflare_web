const https = require('https');
const zlib = require('zlib');
const fs = require('fs');
const url = 'https://api.github.com/repos/Monikaramesh19/Signalflare_web/actions/jobs/98904540996/logs';

const options = {
  headers: {
    'User-Agent': 'node.js',
    'Accept': 'application/vnd.github.v3+json'
  }
};

https.get(url, options, (res) => {
  if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
    https.get(res.headers.location, options, (res2) => {
      let data = '';
      res2.on('data', chunk => data += chunk);
      res2.on('end', () => {
        fs.writeFileSync('log.txt', data);
        console.log('Log saved to log.txt');
      });
    });
  }
});
