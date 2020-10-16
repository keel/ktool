/*
各类常见net操作
 */
'use strict';

const cck = require('cck');
const http = require('http');
const https = require('https');

const mkOpts = function(urlStr, httpType) {
  const u1 = new URL(urlStr);
  const opts = {
    'method': httpType,
    'protocol': u1.protocol,
    'host': u1.host.replace(/:.*/, ''),
    'auth': u1.username + ':' + u1.password,
    // 'port': u1.port || (defaultPortMap[u1.protocol] || ''), //port不设置，使其用默认值
    'path': u1.pathname + u1.search,
    'href': urlStr, //用于错误输出url
  };
  if (u1.port) {
    opts.port = u1.port;
  }
  // console.log('mkOpts out:%j',opts);
  return opts;
};

const httpSend = function(opts, data, options, callback) {
  const httpType = (opts.protocol === 'https:') ? https : http;
  //opts如有headers配置,使用options参数覆盖
  if (options.headers && opts.headers) {
    for (const h in options.headers) {
      opts.headers[h] = options.headers[h];
    }
    delete options.headers;
  }
  for (const i in options) {
    opts[i] = options[i];
  }
  // console.log('httpSend-opts:\n%j\n', opts);
  const req = httpType.request(opts, function(res) {
    let outError = null;
    let bodyBuf = Buffer.from('');
    if (res.statusCode !== 200) {
      outError = new Error(opts.protocol + opts.method + '[' + opts.href + '] statusCode:[' + res.statusCode + ']');
    }
    res.on('data', function(chunk) {
      bodyBuf = Buffer.concat([bodyBuf, chunk]);
    });
    res.on('end', function() {
      callback(outError, bodyBuf, res);
    });
  });
  req.on('error', function(e) {
    callback(e);
  });
  req.write(data || '');
  req.end();
};


//可用于本地抓包测试,如抓包工具支持,也支持https
const proxyPost = function(proxyConf, reqUrl, data, options, callback) {
  const opts = mkOpts(reqUrl);
  opts.host = proxyConf.host;
  opts.method = proxyConf.reqType || 'POST';
  opts.port = proxyConf.port;
  opts.path = reqUrl;
  if (proxyConf.httpType === 'https') {
    opts.protocol = 'https:';
  }
  opts.headers = {
    'Host': opts.host
  };
  if (cck.check(options, 'function')) {
    //options参数不存在,直接认为是callback
    callback = options;
  }
  httpSend(opts, data, options, callback);
};


//可用于本地抓包测试,如抓包工具支持,也支持https
const proxyGet = function(proxyConf, reqUrl, options, callback) {
  if (proxyConf.reqType) {
    proxyConf.reqType = 'GET';
  }
  proxyPost(proxyConf, reqUrl, null, options, callback);
};


const httpGet = function(reqUrl, options, callback) {
  const opts = mkOpts(reqUrl, 'GET');
  httpSend(opts, null, options, callback);
};


const httpPost = function(postUrl, data, options, callback) {
  const opts = mkOpts(postUrl, 'POST');
  opts.headers = {
    'Content-Type': 'application/json',
    'Content-length': (Buffer.from(data)).length
  };
  httpSend(opts, data, options, callback);
};



exports.httpPost = httpPost;
exports.httpsPost = httpPost;
exports.httpGet = httpGet;
exports.httpsGet = httpGet;
exports.proxyGet = proxyGet;
exports.proxyPost = proxyPost;


// const u = 'https://www.baidu.com:999/asdfasdf/dddd?aaa=bbb&ccc=ddd';
// const u1 = new URL(u);
// console.log('', u1);
// console.log(u1.path);
// console.log(require('url').parse(u));

// let url = 'https://ga.gametdd.com/tdCtrl/login';
// // url = 'https://ga.gametdd.com/tdCtrl/main';
// // url = 'https://ga.gametdd.com/tdCtrl/mainaaa';
// // url = 'http://www.baidu.com';

// httpGet(url, { 'encode': 'utf8' }, function(err, re, res) {
//   if (err) {
//     console.error(err.stack);
//     console.log('' + re);
//     console.log('headers:%j',res.headers);
//     console.log('statusCode:' + res.statusCode);
//     return;
//   }
//   console.log(re);
//   console.log('======= re =========\n%s', re);
//   console.log('statusCode:' + res.statusCode);
// });

// url = 'https://ga.gametdd.com/adCtrl/pay_mi/confirm';

// httpPost(url, '{"test":"ok"}', { 'headers': { 'Content-Type': 'application/json','aaa':'bbb' } }, function(err, re, res) {
//   if (err) {
//     console.error(err.stack);
//     console.log('' + re);
//     console.log('statusCode:' + res.statusCode);
//     return;
//   }
//   console.log('resp:\n%s', re);
//   console.log('statusCode:' + res.statusCode);
// });