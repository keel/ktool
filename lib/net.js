/*
各类常见net操作
 */
'use strict';

const URL = require('url').URL;
const cck = require('cck');
const http = require('http');
const https = require('https');
const vlog = require('vlog').instance(__filename); // eslint-disable-line

const mkOpts = function(urlStr, httpType) {
  const u1 = new URL(urlStr);
  const opts = {
    'method': httpType,
    'protocol': u1.protocol,
    'host': u1.host.replace(/:.*/, ''),
    // 'auth': u1.username + ':' + u1.password, //不能在此设置默认值
    // 'port': u1.port || (defaultPortMap[u1.protocol] || ''), //port不设置，使其用默认值
    'path': u1.pathname + u1.search,
    'href': urlStr, //用于错误输出url
  };
  if (u1.username && u1.password) {
    opts.auth = u1.username + ':' + u1.password;
  }
  if (u1.port) {
    opts.port = u1.port;
  }
  // console.log('mkOpts out:%j',opts);
  return opts;
};

const httpSend = function(opts, data, options, callback) {
  const httpType = (opts.protocol === 'https:') ? https : http;
  if (cck.check(options, 'function')) {
    //options参数为function,直接认为是callback
    callback = options;
  } else {
    for (const i in options) {
      if (i === 'headers') {
        //opts如有headers配置,使用options参数覆盖
        if (opts.headers) {
          for (const h in options.headers) {
            opts.headers[h] = options.headers[h];
          }
        } else {
          opts.headers = options.headers;
        }
      } else {
        opts[i] = options[i];
      }
    }
  }
  // console.log('httpSend-opts:\n%j\n', opts);
  // console.log('httpSend-body:\n%s\n', data);
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
      if (outError) {
        outError.body = bodyBuf;
        outError.res = res;
      }
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

const httpReq = function(reqUrl, httpType, data, options, callback) {
  const opts = mkOpts(reqUrl, httpType);
  httpSend(opts, data, options, callback);
};


const httpPost = function(postUrl, data, options, callback) {
  const opts = mkOpts(postUrl, 'POST');
  opts.headers = {
    'Content-Type': 'application/json',
    'Content-length': (Buffer.from(data)).length
  };
  httpSend(opts, data, options, callback);
};







// const pathConf = {
//   'GET': {
//     '*': {
//       'act': defaultAct,
//     },
//   },
//   'POST': {
//     '/': {
//       'act': defaultAct,
//     },
//     '/subUser': {
//       'act': defaultAct,
//     },
//   },
// };
const createApiServer = function(serverName, pathConf) {

  const httpRe = function(resp, stateCode, respTxt) {
    resp.writeHead(stateCode, { 'Content-Type': 'application/json' });
    resp.write(respTxt);
    resp.end();
  };

  if (!pathConf.OPTIONS) {
    pathConf.OPTIONS = {
      '*': {
        'act': (req, resp, callback) => {
          httpRe(resp, 204, '');
          callback(null, null, true);
        }
      }
    };
  }

  const apiServer = http.createServer(function(req, resp) {
    const urlObj = new URL(req.url, 'http://' + req.headers.host);
    // console.log('pathname:%j', urlObj.pathname, req.method);
    // console.log(req.headers);
    let bodyBuf = Buffer.from(''); //只支持string, 不支持二进制
    req.on('data', function(chunk) {
      bodyBuf = Buffer.concat([bodyBuf, chunk]);
    });
    req.on('end', function() {
      const reqMethod = req.method;
      const reqPath = urlObj.pathname;
      const methodAction = pathConf[reqMethod];
      if (!methodAction) {
        return httpRe(resp, 404, '{"code":404001}');
      }
      const pathAction = methodAction[reqPath] || methodAction['*'];
      if (!pathAction) {
        return httpRe(resp, 404, '{"code":404002}');
      }
      const action = pathAction.act;
      if (!action) {
        return httpRe(resp, 404, '{"code":404003}');
      }
      req.body = '' + bodyBuf;
      action(req, resp, function(err, respStr, isEnded) {
        if (err) {
          vlog.eo(err, 'apiServer[' + serverName + '] req error');
        }
        if (isEnded) {
          return;
        }
        //!! 无论是否错误,respObj保证有值,必须返回
        respStr = respStr || '{"code":500001}';
        httpRe(resp, 200, respStr);
      });
    });
  });
  apiServer.on('clientError', function(err) {
    if (err) {
      vlog.eo(err, serverName + '_server clientError');
      return;
    }
  });
  apiServer.on('close', function(err) {
    if (err) {
      vlog.eo(err, 'close');
      return;
    }
    vlog.log(serverName + '_server closed. ' + cck.msToTimeWithMs());
  });
  apiServer.name = serverName;
  apiServer.start = (port = 15001) => {
    apiServer.port = port;
    apiServer.listen(port);
    vlog.info('=== [' + serverName + '_server] === start:[%d] -- %s', port, cck.msToTimeWithMs());
  };
  apiServer.stop = () => {
    apiServer.close();
  };
  return apiServer;
};

exports.httpPost = httpPost;
exports.httpReq = httpReq;
exports.httpsPost = httpPost;
exports.httpGet = httpGet;
exports.httpsGet = httpGet;
exports.proxyGet = proxyGet;
exports.proxyPost = proxyPost;
exports.createApiServer = createApiServer;



// const defaultAct = function(req, resp, callback) {
//   callback(null, 'hi');
// };
// const pathConf = {
//   'GET': {
//     '*': {
//       'act': defaultAct,
//     },
//   },
//   'POST': {
//     '/': {
//       'act': defaultAct,
//     },
//     '/subUser': {
//       'act': defaultAct,
//     },
//   },
// };
// createApiServer('qq_submsg', pathConf).start(15002);





// const u = 'https://www.baidu.com:999/asdfasdf/dddd?aaa=bbb&ccc=ddd';
// const u1 = new URL(u);
// console.log('', u1);
// console.log(u1.path);
// console.log(require('url').parse(u));

// let url = 'https://ga.gametdd.com/tdCtrl/login';
// // url = 'https://ga.gametdd.com/tdCtrl/main';
// // url = 'https://ga.gametdd.com/tdCtrl/mainaaa';
// // url = 'http://www.baidu.com';

// // httpGet(url, { 'encode': 'utf8' }, function(err, re, res) {
// httpGet(url, function(err, re, res) {
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

// const url = 'https://ga.gametdd.com/adCtrl/pay_mi/confirm';

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