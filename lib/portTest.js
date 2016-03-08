/*
测试服务器端口连通性
 */
'use strict';
var vlog = require('vlog').instance(__filename);
var http = require('http');
var cck = require('cck');

var port = 13999;

var portServer = http.createServer(function(req, resp) {
  var body = '';
  req.on('data', function(chunk) {
    body += chunk;
  });
  req.on('end', function() {
    var reqInfo = { 'url': req.url, 'method': req.method, 'headers': req.headers, 'body': body };
    resp.writeHead(200, { 'Content-Type': 'text/plain' });
    resp.write(JSON.stringify(reqInfo));
    resp.end();
  });
});

portServer.on('clientError', function(err) {
  if (err) {
    vlog.eo(err, 'portServer:clientError');
    return;
  }
});

portServer.on('close', function(err) {
  if (err) {
    vlog.eo(err, 'portServer:close');
    return;
  }
  vlog.log('portServer closed.');
});

var start = function() {
  // vlog.log('process.argv:%j', process.argv);
  if (process.argv.length > 2) {
    var p = parseInt(process.argv[2]);
    if (cck.check(p,'int')) {
      port = p;
    }
  }
  portServer.listen(port);
  vlog.log('portServer start:%d', port);
};

exports.start = start;
// start();