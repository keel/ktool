/*
各类常见net操作
 */
'use strict';

var url = require('url');
var vlog = require('vlog').instance(__filename);
var http = require('http');
// var cck = require('cck');
// var crypto = require('crypto');

var httpPost = function(postUrl, data, addHeaders, callback) {
  var postData = data; //querystring.stringify(datas);
  var options = url.parse(postUrl);
  options.method = 'POST';
  options.headers = {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  };
  if (addHeaders) {
    for(var h  in addHeaders){
      options.headers[h] = addHeaders[h];
    }
  }
  vlog.log('httpPost-options:%j',options);
  var req = http.request(options, function(res) {
    res.setEncoding('utf8');
    var body = '';
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      vlog.log('httpPost-body:%s', body);
      callback(null, 'ok');
    });
  });
  req.on('error', function(e) {
    callback(vlog.ee(e, 'httpPost', 'http'));
  });
  req.write(postData);
  req.end();
};


exports.httpPost = httpPost;


// httpPost('http://127.0.0.1:13999/test','{"test":"ok"}',{'Content-Type': 'application/json'},function(err, re) {
//   if (err) {
//     vlog.eo(err, '');
//     return;
//   }
//   vlog.log('re:%j',re);
// });

