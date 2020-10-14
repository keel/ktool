/**
 * 本地WEB服务器,同时将非GET请求代理到远程服务器,便于本地测试,单文件执行,无任何依赖;
 * 注意使用代理时需要将指向远程服务器的绝对路径改为相对路径.
 * @author Keel
 */
'use strict';
const Http = require('http');
const Fs = require('fs');
const Path = require('path');

let localPort = 13999; //自定义本地端口
let localRootPath = Path.join(__dirname, './webroot'); //自定义本地webroot
let remoteHost = 'http://47.98.43.108/'; //自定义远程host


const err404 = '<h1>404</h1> -- localWebServer';
const llog = console.log;
const lerr = console.error;

const contentTypeMap = {
  '.html': 'text/html',
  '.json': 'text/json',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/icon',
  '.zip': 'application/octet-stream',
};

const getContentType = function(filePath) {
  const ext = Path.extname(filePath).toLowerCase();
  return contentTypeMap[ext] || 'application/octet-stream';
};

const setContentType = function(cType, cValue) {
  contentTypeMap[cType] = cValue;
};

const copyRawHeaders = function(rawHeaders) {
  const newHeaders = {};
  //排除原始请求的部分header
  const exceptMap = {
    'host': 1,
    'connection': 1,
    'referer': 1,
    // 'content-length':1,
  };
  for (let i = 0, len = rawHeaders.length; i < len; i += 2) {
    if (exceptMap[rawHeaders[i].toLowerCase()]) {
      continue;
    }
    newHeaders[rawHeaders[i]] = rawHeaders[i + 1];
  }
  return newHeaders;
};

const proxy = function(req, res, localUrl) {
  const remoteUrl = new URL(remoteHost);
  const options = {
    'host': remoteUrl.host,
    'port': remoteUrl.port || '80',
    'path': Path.join(remoteUrl.path, localUrl.path),
    'method': req.method,
    'headers': copyRawHeaders(req.rawHeaders)
  };
  // llog('proxy options:', options);
  const request = Http.request(options, function(response) {
    res.statusCode = response.statusCode;
    response.pipe(res);
  }).on('error', function() {
    res.statusCode = 500;
    res.end();
  });
  req.pipe(request);
};

const webSvr = function(req, res) {
  const reqUrl = req.url;

  // llog('===> REQ: ' + reqUrl);
  const localUrl = new URL(reqUrl);
  let pathName = localUrl.pathname;
  if (Path.extname(pathName) == '') {
    pathName += '/';
  }
  if (pathName.charAt(pathName.length - 1) == '/') {
    pathName += 'index.html';
  }


  if (req.method !== 'GET') {
    //对非GET请求转发到远程服务器
    return proxy(req, res, localUrl);
  }

  const filePath = Path.join(localRootPath, pathName);

  if (Fs.existsSync(filePath)) {
    res.writeHead(200, { 'Content-Type': getContentType(filePath) });

    const stream = Fs.createReadStream(filePath, { flags: 'r', encoding: null });

    stream.on('error', function() {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(err404);
    });

    stream.pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(err404);
  }
};

const start = function(newLocalPort, newLocalPath, newRemoteHost) {
  if (newLocalPort) {
    localPort = newLocalPort;
  }
  if (newLocalPath) {
    localRootPath = newLocalPath;
  }
  if (newRemoteHost) {
    remoteHost = newRemoteHost;
  }

  const webServer = Http.createServer(webSvr);

  webServer.on('error', function(error) {
    lerr(error);
  });

  webServer.listen(localPort, function() {
    llog('localWebServer running at: http://127.0.0.1:' + localPort + '/');
    llog('Local webroot: ' + localRootPath);
  });
};

exports.setContentType = setContentType;
exports.start = start;







//