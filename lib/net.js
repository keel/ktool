/*
各类常见net操作
 */
'use strict';

var url = require('url');
var cck = require('cck');
var http = require('http');
var https = require('https');
var urlParse = require('url-parse');


var postSend = function(type, opts, data, options, callback) {
  var postType = (type === 'https') ? https : http;

  var encode = 'utf8';
  if (cck.check(options, 'function')) {
    //options参数不存在,直接认为是callback
    callback = options;
  } else {
    if (options.headers) {
      for (var h in options.headers) {
        opts.headers[h] = options.headers[h];
      }
    }
    if (options.encode) {
      encode = options.encode;
    }
  }
  // console.log('httpPost-opts:\n%j\n',opts);
  var req = postType.request(opts, function(res) {
    res.setEncoding(encode);
    var body = '';
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      // console.log('httpPost-body:\n%s\n', body);
      callback(null, body);
    });
  });
  req.on('error', function(e) {
    callback(console.error(e.stack));
  });
  req.write(data);
  req.end();
};


var httpPost = function(postUrl, data, options, callback) {
  var opts = url.parse(postUrl);
  opts.method = 'POST';
  opts.headers = {
    'Content-Type': 'application/json',
    'Content-length': (new Buffer(data)).length
  };
  postSend('http', opts, data, options, callback);
};


var httpsPost = function(postUrl, data, options, callback) {
  var urlResult = urlParse(postUrl);
  var opts = {
    'host': urlResult.host,
    'method': 'POST',
    'port': 443,
    'path': urlResult.pathname,
    'headers': {
      'Content-Length': new Buffer(data).length,
      'Content-Type': 'application/json'
    }
  };
  postSend('http', opts, data, options, callback);
};

exports.httpPost = httpPost;
exports.httpsPost = httpsPost;


// httpsPost('https://www.baidu.com/test', '{"test":"ok"}', { 'headers': { 'Content-Type': 'application/json' } }, function(err, re) {
//   if (err) {
//     console.error(err.stack);
//     return;
//   }
//   console.log('resp:\n%s', re);
// });
