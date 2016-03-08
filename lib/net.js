/*
各类常见net操作
 */
'use strict';

var url = require('url');
var http = require('http');

var httpPost = function(postUrl, data, addHeaders, callback) {
  var postData = data;
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
  console.log('httpPost-options:\n%j\n',options);
  var req = http.request(options, function(res) {
    res.setEncoding('utf8');
    var body = '';
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      console.log('httpPost-body:\n%s\n', body);
      callback(null, body);
    });
  });
  req.on('error', function(e) {
    callback(console.error(e.stack));
  });
  req.write(postData);
  req.end();
};


exports.httpPost = httpPost;


// httpPost('http://www.baidu.com/test','{"test":"ok"}',{'Content-Type': 'application/json'},function(err, re) {
//   if (err) {
//     console.error(err.stack);
//     return;
//   }
//   console.log('resp:\n%s',re);
// });

