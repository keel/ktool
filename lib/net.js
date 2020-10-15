/*
各类常见net操作
 */
'use strict';

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
      'Host': new URL(reqUrl).hostname
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
      'Host': new URL(reqUrl).hostname
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
      opts[i] = options[i];
    }
  }
  // console.log('postSend-opts:\n%j\n', opts);
  const req = postType.request(opts, function(res) {
    let postError = null;
    if (res.statusCode !== 200) {
      postError = new Error(type + '-POST[' + opts.href + '] statusCode:[' + res.statusCode + ']');
    }
    let bodyBuf = Buffer.from('');
    res.on('data', function(chunk) {
      bodyBuf = Buffer.concat([bodyBuf, chunk]);
    });
    res.on('end', function() {
      // console.log('httpPost-body:\n%s\n', body);
      callback(postError, bodyBuf, res);
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
  }
  let getError = null;
  // console.log('getSend-opts:\n%j\n', opts);
  getType.get(opts, function(res) {
    if (res.statusCode !== 200) {
      getError = new Error(type + '-GET[' + opts.href + '] statusCode:[' + res.statusCode + ']');
    }
    let bodyBuf = Buffer.from('');
    res.on('data', function(chunk) {
      bodyBuf = Buffer.concat([bodyBuf, chunk]);
    });
    res.on('end', function() {
      callback(getError, bodyBuf, res);
    });
  }).on('error', function(e) {
    return callback(e);
  });
};

const defaultPortMap = {
  'http:': 80,
  'https:': 443,
};
const mkOpts = function(urlStr, httpType) {
  const u1 = new URL(urlStr);
  const opts = {
    'method': httpType,
    'protocol': u1.protocol,
    'host': u1.host,
    'auth': u1.username + ':' + u1.password,
    'port': u1.port || (defaultPortMap[u1.protocol] || ''),
    'path': u1.pathname,
    'href': urlStr, //用于错误输出url
  };
  return opts;
};

const httpGet = function(reqUrl, options, callback) {
  const opts = mkOpts(reqUrl, 'GET');
  if (opts.protocol === 'https:') {
    return getSend('https', opts, options, callback);
  }
  getSend('http', opts, options, callback);
};


const httpsGet = function(reqUrl, options, callback) {
  const opts = mkOpts(reqUrl, 'GET');
  getSend('https', opts, options, callback);
};

const httpPost = function(postUrl, data, options, callback) {
  const opts = mkOpts(postUrl, 'POST');
  if (opts.protocol === 'https:') {
    return httpsPost(postUrl, data, options, callback);
  }
  opts.headers = {
    'Content-Type': 'application/json',
    'Content-length': (Buffer.from(data)).length
  };
  postSend('http', opts, data, options, callback);
};


const httpsPost = function(postUrl, data, options, callback) {
  const opts = mkOpts(postUrl, 'POST');
  opts.headers = {
    'Content-Type': 'application/json',
    'Content-length': (Buffer.from(data)).length
  };
  postSend('https', opts, data, options, callback);
};

exports.httpPost = httpPost;
exports.httpsPost = httpsPost;
exports.httpGet = httpGet;
exports.httpsGet = httpsGet;
exports.proxyGet = proxyGet;
exports.proxyPost = proxyPost;


// const u = 'https://www.baidu.com/asdfasdf/dddd?aaa=bbb&ccc=ddd';
// const u1 = new URL(u);
// console.log('', u1);

// httpGet('https://ga.gametdd.com/tdCtrl/main', { 'encode': 'utf8' }, function(err, re, res) {
//   if (err) {
//     console.error(err.stack);
//     console.log('' + re);
//     console.log('statusCode:' + res.statusCode);
//     return;
//   }
//   console.log(re);
//   console.log('======= re =========\n%s', re);
//   console.log('statusCode:' + res.statusCode);
// });

// httpsPost('https://ga.gametdd.com/adCtrl/pay_mi/confirm', '{"test":"ok"}', {'headers': { 'Content-Type': 'application/json' } }, function(err, re, res) {
//   if (err) {
//     console.error(err.stack);
//     console.log('' + re);
//     console.log('statusCode:' + res.statusCode);
//     return;
//   }
//   console.log('resp:\n%s', re);
//   console.log('statusCode:' + res.statusCode);
// });