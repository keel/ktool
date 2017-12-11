/*
测试服务器端口连通性
 */
'use strict';
const http = require('http');

let port = 13999;

const portServer = http.createServer(function(req, resp) {
  let bodyBuf = Buffer.from('');
  req.on('data', function(chunk) {
    bodyBuf = Buffer.concat([bodyBuf, chunk]);
  });
  req.on('end', function() {
    const reqInfo = { 'clientIP:': req.connection.remoteAddress, 'url': req.url, 'method': req.method, 'headers': req.headers, 'body': bodyBuf + '' };
    resp.writeHead(200, { 'Content-Type': 'text/plain' });
    resp.write(JSON.stringify(reqInfo));
    resp.end();
  });
});

portServer.on('clientError', function(err) {
  if (err) {
    console.err(err.stack);
    return;
  }
});

portServer.on('close', function(err) {
  if (err) {
    console.err(err.stack);
    return;
  }
  console.log('portServer closed.');
});

const start = function() {
  if (process.argv.length > 2) {
    const p = parseInt(process.argv[2]);
    if (p) {
      port = p;
    }
  }
  portServer.listen(port);
  console.log('portServer start:%d', port);
};

exports.start = start;
// start();