'use strict';
const filterProxy = require('./filterProxy');
const ktool = require('ktool');
const vlog = require('vlog').instance(__filename);
const zlib = require('zlib');


const port = 16602;
const conf = {
  'pathMap': {
    'aaa': {
      'url': 'https://www.baidu.com',
      'inFilter': 'xxe',
      'outFilter': 'test'
    },
    'bbb': {
      'url': 'https://st.gametdd.com/login',
      'inFilter': 'sss'
    },
    'ccc': {
      'url': 'https://www.baidu.com',
      'outFilter': 'ttt'
    },
  }
};

//配置新的out过滤器
filterProxy.setOutFilter('ttt', (res, response, outBodyBuf, options, thisConf) => {
  console.log('ttt out');
  const contentEncoding = res.headers['content-encoding'];
  let bodyStr = '';
  if (contentEncoding && contentEncoding.indexOf('gzip') >= 0) {
    bodyStr += zlib.unzipSync(outBodyBuf);
  } else {
    bodyStr += outBodyBuf;
  }
  // console.log('----- out test:'+bodyStr);
  const newStr = bodyStr.replace(/百度/g, 'EEE度');
  return newStr;
});

//配置新的out过滤器
filterProxy.setInFilter('sss', (request, bodyBuf, options, thisConf) => {
  console.log('sss out');
  const bodyStr = '' + bodyBuf;
  if (!bodyStr) {
    return bodyBuf;
  }
  const newBody = bodyStr.replace(/tiandou2/g, 'xxx'); //for test
  console.log('sss newBody--------:\n' + newBody + '\n---------');
  return newBody;
});

filterProxy.start(port, conf);

const test1 = function() {
  ktool.httpGet('http://localhost:' + port + '/aaa', (err, re) => {
    // ktool.httpGet('http://www.baidu.com', (err, re) => {
    if (err) {
      return vlog.eo(err, 'test1');
    }
    console.log('test1 re:' + re);
  });
};

const test2 = function() {
  ktool.httpPost('http://localhost:' + port + '/bbb/login', '{"v":"0","m":"login","a":"test_client_key","c":"10010","t":1632989617320,"req":{"loginName":"aaa","loginPwd":"tett"},"s":"db8e2ee222b0f8a794e8eba7533b8941"}', (err, re) => {
    if (err) {
      return vlog.eo(err, 'test2');
    }
    console.log('test2 re:' + re);
  });
};


const test3 = function() {
  ktool.httpGet('http://localhost:' + port + '/ccc', (err, re) => {
    // ktool.httpGet('http://www.baidu.com', (err, re) => {
    if (err) {
      return vlog.eo(err, 'test3');
    }
    console.log('test3 re:' + re);
  });
};




setTimeout(test2, 2000);






//