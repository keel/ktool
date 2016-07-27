/*
各类常见net操作
 */
'use strict';

var url = require('url');
var http = require('http');
var https = require('https');

var httpPost = function(postUrl, data, addHeaders, encode, callback) {
  var postData = data;
  var options = url.parse(postUrl);
  options.method = 'POST';
  options.headers = {
    'Content-Type': 'application/json',
    'Content-length': (new Buffer(data)).length
  };
  if (addHeaders) {
    for (var h in addHeaders) {
      options.headers[h] = addHeaders[h];
    }
  }
  // console.log('httpPost-options:\n%j\n',options);
  var req = http.request(options, function(res) {
    res.setEncoding(encode || 'utf8');
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
  req.write(postData);
  req.end();
};


var httpsPost = function(postUrl, data, addHeaders, encode, callback) {
  var postData = data;
  var urlResult = url.parse(postUrl);

  // vlog.log('urlResult:%j',urlResult);
  var options = {

    'host': urlResult.host,
    'method': 'POST',
    'port': 443,
    'path': urlResult.pathname,
    'headers': {
      'Content-Length': new Buffer(data).length,
      'Content-Type': 'application/json'
    }
  };
  if (addHeaders) {
    for (var h in addHeaders) {
      options.headers[h] = addHeaders[h];
    }
  }
  // console.log('httpsPost-options:\n%j\n',options);
  var req = https.request(options, function(res) {
    res.setEncoding(encode || 'utf8');
    var body = '';
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      // console.log('httpsPost-body:\n%s\n', body);
      callback(null, body);
    });
  });
  req.on('error', function(e) {
    callback(console.error(e.stack));
  });
  // vlog.log('postData:%s',postData);
  req.write(postData);
  req.end();
};

exports.httpPost = httpPost;
exports.httpsPost = httpsPost;


// httpPost('http://www.baidu.com/test','{"test":"ok"}',{'Content-Type': 'application/json'},function(err, re) {
//   if (err) {
//     console.error(err.stack);
//     return;
//   }
//   console.log('resp:\n%s',re);
// });
