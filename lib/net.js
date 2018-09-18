/*
各类常见net操作
 */
'use strict';

const url = require('url');
const cck = require('cck');
const http = require('http');
const https = require('https');


const postSend = function(type, opts, data, options, callback) {
  const postType = (type === 'https') ? https : http;

  // let encode = 'utf8';
  if (cck.check(options, 'function')) {
    //options参数不存在,直接认为是callback
    callback = options;
  } else {
    if (options.headers) {
      for (const h in options.headers) {
        opts.headers[h] = options.headers[h];
      }
    }
    // if (options.encode) {
    //   encode = options.encode;
    // }
  }
  // console.log('httpPost-opts:\n%j\n',opts);
  const req = postType.request(opts, function(res) {
    // res.setEncoding(encode);
    let bodyBuf = Buffer.from('');
    res.on('data', function(chunk) {
      bodyBuf = Buffer.concat([bodyBuf, chunk]);
    });
    res.on('end', function() {
      // console.log('httpPost-body:\n%s\n', body);
      callback(null, bodyBuf, res);
    });
  });
  req.on('error', function(e) {
    callback(e);
  });
  req.write(data);
  req.end();
};



const getSend = function(type, opts, options, callback) {
  const getType = (type === 'https') ? https : http;
  // let encode = 'utf8';
  if (cck.check(options, 'function')) {
    //options参数不存在,直接认为是callback
    callback = options;
  } else {
    if (options.headers) {
      opts.headers = {};
      for (const h in options.headers) {
        opts.headers[h] = options.headers[h];
      }
    }
    // if (options.encode) {
    //   encode = options.encode;
    // }
  }
  getType.get(opts, function(res) {
    if (res.statusCode !== 200) {
      res.resume();
      return callback(new Error(type + ' get statusCode is ' + res.statusCode));
    }
    // res.setEncoding(encode);
    let bodyBuf = Buffer.from('');
    res.on('data', function(chunk) {
      bodyBuf = Buffer.concat([bodyBuf, chunk]);
    });
    res.on('end', function() {
      callback(null, bodyBuf, res);
    });
  }).on('error', function(e) {
    return callback(e);
  });
};

const httpGet = function(reqUrl, options, callback) {
  const opts = url.parse(reqUrl);
  getSend('http', opts, options, callback);
};


const httpsGet = function(reqUrl, options, callback) {
  const opts = url.parse(reqUrl);
  getSend('https', opts, options, callback);
};

const httpPost = function(postUrl, data, options, callback) {
  const opts = url.parse(postUrl);
  opts.method = 'POST';
  opts.headers = {
    'Content-Type': 'application/json',
    'Content-length': (new Buffer(data)).length
  };
  postSend('http', opts, data, options, callback);
};


const httpsPost = function(postUrl, data, options, callback) {
  const urlResult = url.parse(postUrl);
  const opts = {
    'host': urlResult.host,
    'method': 'POST',
    'port': 443,
    'path': urlResult.path,
    'headers': {
      'Content-Length': new Buffer(data).length,
      'Content-Type': 'application/json'
    }
  };
  postSend('https', opts, data, options, callback);
};

exports.httpPost = httpPost;
exports.httpsPost = httpsPost;
exports.httpGet = httpGet;
exports.httpsGet = httpsGet;

// httpsGet('https://www.baidu.com', { 'encode': 'utf8' }, function(err, re) {
//   if (err) {
//     console.error(err.stack);
//     return;
//   }
//   console.log('======= re =========\n%s', re);
// });

// httpsPost('https://www.baidu.com/test', '{"test":"ok"}', { 'headers': { 'Content-Type': 'application/json' } }, function(err, re) {
//   if (err) {
//     console.error(err.stack);
//     return;
//   }
//   console.log('resp:\n%s', re);
// });
