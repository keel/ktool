/**
 * 过滤请求和返回的proxy,可以用于XXE等,参考filterProxy.test.js
 */
'use strict';

const ktool = require('./ktool');
const kconfig = ktool.kconfig;
kconfig.init();
const vlog = require('vlog').instance(__filename);
const url = require('url');
const http = require('http');
const https = require('https');
const zlib = require('zlib');




//filter返回body, 处理面向真实地址的req
const xxeFilter = function(request, bodyBuf, options, thisConf) {
  // console.log('xxeFilter');
  // if (request.headers.accept && request.headers.accept.indexOf('text/html')<0) {
  //   return bodyBuf;
  // }
  const bodyStr = '' + bodyBuf;
  if (!bodyStr) {
    return bodyBuf;
  }
  const newBody = ktool.fixXXE(bodyStr);
  // console.log('xxeFilter newBody--------:\n' + newBody + '\n---------');
  return newBody;
};


const inFillterMap = {
  'xxe': xxeFilter, //目前只支持xxe
};

const outFillterMap = {
  'test': (res, response, outBodyBuf, options, thisConf) => {
    console.log('outFillter test');
    const contentEncoding = res.headers['content-encoding'];
    let bodyStr = '';
    if (contentEncoding && contentEncoding.indexOf('gzip') >= 0) {
      bodyStr += zlib.unzipSync(outBodyBuf);
    } else {
      bodyStr += outBodyBuf;
    }
    // console.log('----- out test:'+bodyStr);
    const newStr = bodyStr.replace(/百度/g, 'X度');

    return newStr;
  }
};

const headerExceptMap = {
  'host': 1,
  'connection': 1,
  'referer': 1,
  'content-length': 1,
};


const headerFilter = function(headers) {
  const newHeaders = {};
  for (const i in headers) {
    if (headerExceptMap[i]) {
      continue;
    }
    newHeaders[i] = headers[i];
  }
  return newHeaders;
};

const proxySend = function(conf, request, response, bodyBuf) {
  // console.log('url:%j', request.url);

  //根据request的二级路径确定使用哪个配置
  const pathArr = request.url.split('/');
  if (pathArr.length < 2) {
    return response.end('ERR_PATH');
  }

  const pathKey = pathArr[1];
  const thisConf = conf.pathMap[pathKey];
  if (!thisConf) {
    return response.end('ERR_ROUTE');
  }


  const urlObject = url.parse(thisConf.url);

  let newPath = urlObject.path;
  if (newPath[newPath.length - 1] === '/') {
    newPath = newPath.substring(0, newPath.length - 1);
  }

  newPath += request.url.substring(request.url.indexOf(pathKey) + pathKey.length);
  // const newPath = request.url.substring(request.url.indexOf(pathKey) + pathKey.length);
  // console.log('newPath:' + newPath);

  const options = {
    'host': urlObject.host,
    'method': request.method,
    'path': newPath,
    'headers': headerFilter(request.headers),
  };
  if (urlObject.port) {
    options.port = urlObject.port;
  } else if (urlObject.protocol.startsWith('https')) {
    options.port = 443;
  } else {
    options.port = 80;
  }
  // console.log('urlObject:%j', urlObject);

  //** 做proxy的时候注意把headers里面host做修改!!!!!
  options.headers.host = urlObject.host;


  //前置filter处理
  if (thisConf.inFilter) {
    const inFilterFn = inFillterMap[thisConf.inFilter];
    if (inFilterFn) {
      bodyBuf = inFilterFn(request, bodyBuf, options, thisConf);
    }
  }


  const protocol = (urlObject.protocol.startsWith('https')) ? https : http;
  // vlog.log('\n--------\nproxy options:\n%j\n--------', options);
  const req = protocol.request(options, function(res) {
    // console.log('res:----\n%j\n---headers---\n%j\n------', res.statusCode, res.headers);
    response.statusCode = res.statusCode;
    for (const i in res.headers) {
      if (i == 'content-encoding') { //去掉gzip等形式的输出
        continue;
      }
      if (headerExceptMap[i]) {
        continue;
      }
      if (i === 'set-cookie') {
        for (let j = 0, len = res.headers[i].length; j < len; j++) {
          res.headers[i][j] = (res.headers[i][j] + ';').replace(/domain=([^;]*);/g, '');
        }
      }
      response.setHeader(i, res.headers[i]);
    }

    // 如果需要做内容过滤，则不用能pipe，需要使用以下方式透传body
    let outBodyBuf = Buffer.from('');
    res.on('data', function(chunk) {
      outBodyBuf = Buffer.concat([outBodyBuf, chunk]);
    });
    res.on('end', function() {
      // console.log(outBodyBuf + '');

      //在返回前进行outFilter处理
      if (thisConf.outFilter) {
        const outFilterFn = outFillterMap[thisConf.outFilter];
        if (outFilterFn) {
          outBodyBuf = outFilterFn(res, response, outBodyBuf, options, thisConf);
        }
      }
      response.end(outBodyBuf);
    });
    res.on('error', function(e) {
      vlog.eo(e, 'outResp');
      response.end('500');
    });

    // res.pipe(response, { end: true });
  });


  req.on('error', function(e) {
    vlog.eo(e, 'req');
    response.end('500');
  });
  req.write(bodyBuf);
  req.end();
};


const newServer = function(conf) {
  //本地只使用http
  const proxyServer = http.createServer(function(request, response) {

    let bodyBuf = Buffer.from('');
    request.on('data', function(chunk) {
      bodyBuf = Buffer.concat([bodyBuf, chunk]);
    });
    request.on('error', function() {
      vlog.eo(new Error('request'));
      response.end('500');
    });

    request.on('end', function() {
      proxySend(conf, request, response, bodyBuf);
    });

  });
  proxyServer.startPort = conf.port;
  return proxyServer;
};



const start = function(port, newConfig) {
  const conf = newConfig || kconfig.get('filterConf'); //传参数或配置中有filterConf节点
  const startPort = port || conf.port;
  newServer(conf).listen(startPort);
  vlog.info('======= filterProxy start:[%d] =====', startPort);
};


const setInFilter = function(filterKey, filterFn) {
  inFillterMap[filterKey] = filterFn;
};

const setOutFilter = function(filterKey, filterFn) {
  outFillterMap[filterKey] = filterFn;
};

exports.start = start;
exports.setInFilter = setInFilter;
exports.setOutFilter = setOutFilter;






//