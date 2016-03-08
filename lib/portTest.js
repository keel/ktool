/*
测试服务器端口连通性
 */
'use strict';
var http = require('http');

var port = 13999;

var portServer = http.createServer(function(req, resp) {
  var body = '';
  req.on('data', function(chunk) {
    body += chunk;
  });
  req.on('end', function() {
    var reqInfo = { 'clientIP:': req.connection.remoteAddress, 'url': req.url, 'method': req.method, 'headers': req.headers, 'body': body };
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

var start = function() {
  if (process.argv.length > 2) {
    var p = parseInt(process.argv[2]);
    if (p) {
      port = p;
    }
  }
  portServer.listen(port);
  console.log('portServer start:%d', port);
};

exports.start = start;
// start();
