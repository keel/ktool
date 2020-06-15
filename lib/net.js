/*
各类常见net操作
 */
'use strict';

const url = require('url');
const cck = require('cck');
const http = require('http');
const https = require('https');


//可用于本地抓包测试,如抓包工具支持,也支持https
const proxyGet = function(proxyConf, reqUrl, options, callback) {
  const opts = {
    'host': proxyConf.host, //'127.0.0.1',
    'method': proxyConf.reqType || 'GET', //'GET',
    'port': proxyConf.port, // 8888,
    'path': reqUrl,
    'headers': {
      'Host': url.parse(reqUrl).hostname
    }
  };
  // vlog.log(opts);
  if (cck.check(options, 'function')) {
    //options参数不存在,直接认为是callback
    callback = options;
  } else {
    for (const i in options) {
      if (i === 'headers') {
        for (const h in options.headers) {
          opts.headers[h] = options.headers[h];
        }
        continue;
      }
      opts[i] = options[i];
    }
  }
  http.get(opts, function(res) {
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

//可用于本地抓包测试,如抓包工具支持,也支持https
const proxyPost = function(proxyConf, reqUrl, postData, options, callback) {
  const opts = {
    'host': proxyConf.host, //'127.0.0.1',
    'method': proxyConf.reqType || 'POST', //'POST',
    'port': proxyConf.port, // 8888,
    'path': reqUrl,
    'headers': {
      'Host': url.parse(reqUrl).hostname
    }
  };
  // vlog.log(opts);
  if (cck.check(options, 'function')) {
    //options参数不存在,直接认为是callback
    callback = options;
  } else {
    for (const i in options) {
      if (i === 'headers') {
        for (const h in options.headers) {
          opts.headers[h] = options.headers[h];
        }
        continue;
      }
      opts[i] = options[i];
    }
  }
  const req = http.request(opts, function(res) {
    // res.setEncoding(encode);
    let bodyBuf = Buffer.from('');
    res.on('data', function(chunk) {
      bodyBuf = Buffer.concat([bodyBuf, chunk]);
    });
    res.on('end', function() {
      callback(null, bodyBuf, res);
    });
  });
  req.on('error', function(e) {
    callback(e);
  });
  req.write(postData);
  req.end();
};


const postSend = function(type, opts, data, options, callback) {
  const postType = (type === 'https') ? https : http;

  // let encode = 'utf8';
  if (cck.check(options, 'function')) {
    //options参数不存在,直接认为是callback
    callback = options;
  } else {
    for (const i in options) {
      if (i === 'headers') {
        for (const h in options.headers) {
          opts.headers[h] = options.headers[h];
        }
        continue;
      }
      opts[i] = options[i];
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
    for (const i in options) {
      opts[i] = options[i];
    }
    // if (options.encode) {
    //   encode = options.encode;
    // }
  }
  getType.get(opts, function(res) {
    if (res.statusCode !== 200) {
      if (res.statusCode !== 302) {
        res.resume();
      }
      return callback(new Error(type + ' get statusCode is ' + res.statusCode), res);
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
  if (opts.protocol === 'https:') {
    return getSend('https', opts, options, callback);
  }
  getSend('http', opts, options, callback);
};


const httpsGet = function(reqUrl, options, callback) {
  const opts = url.parse(reqUrl);
  getSend('https', opts, options, callback);
};

const httpPost = function(postUrl, data, options, callback) {
  const opts = url.parse(postUrl);
  if (opts.protocol === 'https:') {
    return httpsPost(postUrl, data, options, callback);
  }
  opts.method = 'POST';
  opts.headers = {
    'Content-Type': 'application/json',
    'Content-length': (Buffer.from(data)).length
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
      'Content-Length': Buffer.from(data).length,
      'Content-Type': 'application/json'
    }
  };
  postSend('https', opts, data, options, callback);
};

exports.httpPost = httpPost;
exports.httpsPost = httpsPost;
exports.httpGet = httpGet;
exports.httpsGet = httpsGet;
exports.proxyGet = proxyGet;
exports.proxyPost = proxyPost;


// httpGet('https://www.baidu.com', { 'encode': 'utf8' }, function(err, re) {
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