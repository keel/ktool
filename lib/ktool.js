'use strict';

const testTool = require('./test_tool');
const random = require('./random');
const str = require('./str');
const xmlFix = require('./xmlFix');
const net = require('./net');
const path = require('path');
const portTest = require('./portTest');
const localWebServer = require('./localWebServer');
const json = require('./json');
const kconfig = require('./kconfig');
const XSSFilter = require('./xssFilter');
const timeWork = require('./timeWork');
const PROC = require('child_process');
const vlog = require('vlog').instance(__filename);

const doCmd = async function(cmd) {
  return new Promise(function(resolve, reject) {
    PROC.exec(cmd, function(err, stdout, stderr) {
      if (err) {
        return reject(err, stdout, stderr);
      }
      const re = (stderr || stdout);
      resolve(re);
    });
  });
};

const getCookie = function(headers) {
  let cookie = '';
  if (headers && headers['set-cookie']) {
    const cooArr = headers['set-cookie'];
    for (let i = 0, len = cooArr.length; i < len; i++) {
      cookie += (cooArr[i].split(';')[0] + '; ');
    }
  }
  // vlog.log('===>getCookie:' + cookie);
  return cookie;
};

const updateCookie = function(orgCookie, headers) {
  if (!headers || !headers['set-cookie']) {
    return orgCookie;
  }
  const orgArr = orgCookie.split(';');
  const cooMap = {};
  for (let i = 0, len = orgArr.length; i < len; i++) {
    const orgOneArr = orgArr[i].split('=');
    if (orgOneArr.length === 2) {
      cooMap[orgOneArr[0].trim()] = orgOneArr[1].trim();
    }
  }
  // console.log('cooMap:%j',cooMap);
  const cooArr = headers['set-cookie'];
  for (let i = 0, len = cooArr.length; i < len; i++) {
    const newOneArr = (cooArr[i].split(';')[0]).split('=');
    if (newOneArr.length === 2) {
      cooMap[newOneArr[0].trim()] = newOneArr[1].trim();
    }
  }
  // console.log('cooMap2:%j',cooMap);
  let cookie = '';
  for (const i in cooMap) {
    cookie += i + '=' + cooMap[i] + '; ';
  }
  return cookie;
};


// const orgCookie = 'b_account_username=B0KQn8ruqFPpysBNhuUsXA%3D%3D; b_account_aid=SSSCgZe8Jzk%3D; b_account_token=8f15405a4d59d4242b3beba358eb0ee6.1587101494199; b_account_salt=htZANwsrudf4fbJzhXKirg%3D%3D.1587101494199; JSESSIONID=84A69B0B48F1BF6AB9C9F84B67F5F0FC';
// const headers = {
//   'set-cookie': [
//     'JSESSIONID=32053ACCDB88B10FCF8991BBE6B84F4E; Path=/; HttpOnly'
//   ]
// };
// console.log(updateCookie(orgCookie,headers));

//将callback转成promise
//如: const re = await ktool.promi(ktool.httpGet)(getUrl);
const promi = function promi(f) {
  return function(...args) {
    // const args = Array.prototype.slice.call(arguments);
    return new Promise(function(resolve, reject) {
      // args.push(function(err, result) {
      //   if (err) {
      //     reject(err);
      //   } else {
      //     resolve(result);
      //   }
      // });
      const callback = function(...args) {
        // if ({}.toString.call(args[0]) === '[object Error]') {
        if (args[0] !== null && args[0] !== undefined) {
          return reject(args[0]);
        }
        resolve(args[1]); //注意这里直接返回第2个参数
      };
      args.push(callback);
      // f.apply(null, [...args, callback]);
      f.apply(null, args);
    });
  };
};

//将callback转成promise,支持多参数返回
//如: const re = await ktool.promis(ktool.httpGet)(getUrl)[1];
const promis = function promis(f) {
  return function(...args) {
    return new Promise(function(resolve, reject) {
      const callback = function(...args) {
        if (args[0] !== null && args[0] !== undefined) {
          return reject(args[0]);
        }
        resolve(args); //注意这里返回是包含err在内的数组
      };
      args.push(callback);
      f.apply(null, args);
    });
  };
};

/**
 * Base62算法,用于生成递增短string,如:Base62.encode(new Date().getTime());
 * @type {Object}
 */
const Base62 = {
  arr: ['3', 'd', 'h', 'i', 'a', 's', 'c', 'k', 'o', 'R', 'Z', 'w', 'u', '7', 'P', '5', '0', 'L', '6', 'S', '4', 'I', 'X', 'Q', 'j', 'G', 'x', 'W', 'F', 'E', 'e', 'M', 'f', 'p', '2', 'l', 'g', 'q', 'D', 'U', 'n', 'v', 'B', 'b', 'O', 'K', 'T', 'N', 'V', 'y', 'Y', '9', 'm', 'z', '1', 'H', 'C', 'A', '8', 't', 'r', 'J'],
  'log10': function(x) {
    return Math.log(x) / Math.log(10);
  },
  //将原数组重新打乱并生成一个新对象
  'instance': function() {
    const n = Object.assign({}, Base62);
    n.arr = random.shuffle(['3', 'd', 'h', 'i', 'a', 's', 'c', 'k', 'o', 'R', 'Z', 'w', 'u', '7', 'P', '5', '0', 'L', '6', 'S', '4', 'I', 'X', 'Q', 'j', 'G', 'x', 'W', 'F', 'E', 'e', 'M', 'f', 'p', '2', 'l', 'g', 'q', 'D', 'U', 'n', 'v', 'B', 'b', 'O', 'K', 'T', 'N', 'V', 'y', 'Y', '9', 'm', 'z', '1', 'H', 'C', 'A', '8', 't', 'r', 'J']);
    return n;
  },
  'encode': function(numbers) {
    let out = '';
    for (let t = Math.floor(this.log10(numbers) / this.log10(62)); t >= 0; t--) {
      const a = Math.floor(numbers / Math.pow(62, t));
      out += this.arr[a];
      numbers = numbers - (a * Math.pow(62, t));
    }
    return out;
  },
  'decode': function(numbers) {
    let out = 0;
    const len = numbers.length - 1;
    for (let t = 0; t <= len; t++) {
      out = out + this.arr.indexOf(numbers.substr(t, 1)) * Math.pow(62, len - t);
    }
    return out;
  }
};

/**
 * 将用,号分隔的string转成array，会对每项进行trim操作
 * @param  {string} inputStr
 * @return {array}          如果为空则返回[]空array
 */
const strToArr = function strToArr(inputStr) {
  const value = inputStr.trim();
  if (!value) {
    return [];
  }
  const arr = value.split(',');
  return arr.map(function(item) {
    return item.trim();
  });
};


//对json遍历操作，注意默认不会对key执行fn, fn(val, key)
const jsonFilter = function jsonFilter(json, fn, key = null, isIncludeKey = false) {
  if (Array.isArray(json)) {
    for (let i = 0, len = json.length; i < len; i++) {
      json[i] = jsonFilter(json[i], fn, key, isIncludeKey);
    }
    return json;
  }
  if (Object.prototype.toString.call(json) === '[object Object]') {
    for (const i in json) {
      let _key = i;
      const _val = json[i];
      if (isIncludeKey) {
        delete json[_key];
        _key = jsonFilter(_key, fn, '__@key@__'); //这里用特定key表示对key的方法
      }
      json[_key] = jsonFilter(_val, fn, _key, isIncludeKey);
    }
    return json;
  }
  return fn(json, key);
};

/*
const cacheTable = function(p1, p2 = 3, callback = defaultCallback) {
  console.log('cacheTable:%j, 2:%j', p1, p2);
  callback(vlog.ee(new Error('cacheType error'),'eeefff', p1, p2));
};

cacheTable(2, 4);
//------------
const cacheTable = function(p1, p2 = 3, callback = defaultCallback(null,__filename)) {
  console.log('cacheTable:%j, 2:%j', p1, p2);
  callback(vlog.ee(new Error('cacheType error'),'eeefff', p1, p2));
};

cacheTable(2, 4);
 */
const defaultCallback = (err, fromFile, fnName) => {
  if (err) {
    vlog.eo(err, 'defaultCallback');
  }
  if (fromFile) {
    return (err) => {
      if (err) {
        vlog.eo(err, '[' + path.basename(fromFile) + ']:' + (fnName || 'defaultCallback'));
      }
    };
  }
};

/**
 * 真clone对象,但不包括prototype，与Object.assign不同，其属性的引用也会clone，支持null,Array,Date,RegExp,Error等各种类型
 * @param  {Ojbect} json
 * @return {Object}
 */
const clone = function clone(json) {
  if (Array.isArray(json)) {
    const target = [];
    for (let i = 0, len = json.length; i < len; i++) {
      target.push(clone(json[i]));
    }
    return target;
  }
  if (Object.prototype.toString.call(json) === '[object Object]') {
    const target = {};
    for (const i in json) {
      target[i] = clone(json[i]);
    }
    return target;
  }
  return json;
};

/**
 * 合并对象，解决Object.assign不能对数组对象正确处理的情况，数据新属性为Array，则直接被新属性取代。注意这里不是clone，引用会保持
 * @param  {Object} orgObj
 * @param  {Object} newVal
 * @return {Object}        合并后的对象
 */
const merge = function merge(orgObj, newVal) {
  if (Array.isArray(newVal)) {
    //注意原对象为数组时将直接被newVal替代
    return newVal;
  }
  if (Object.prototype.toString.call(newVal) === '[object Object]') {
    for (const i in newVal) {
      if (Object.prototype.toString.call(orgObj[i]) !== '[object Object]') {
        orgObj[i] = newVal[i];
      } else {
        orgObj[i] = merge(orgObj[i], newVal[i]);
      }
    }
    return orgObj;
  }
  return newVal;
};



/**
 * 选择目标的子项目,使用aaa.bbb.ccc的层级方式
 * @param  {object} target 目标对象
 * @param  {string} dotStr 以点号分隔的子目标
 * @return {object}        子目标
 * 例子在下方
 *
 */
const dotSelector = function(target, dotStr) {
  const arr = dotStr.split('.');
  const dotOne = function(subTarget, dotArr) {
    const oneStr = dotArr.shift();
    const sub = subTarget[oneStr];
    if (sub === undefined) {
      return null;
    }
    if (dotArr.length === 0) {
      return sub;
    }
    return dotOne(sub, dotArr);
  };
  const re = dotOne(target, arr);
  return re;
};



/**
 * 按点分隔符为对象赋值
 * @param  {object} target
 * @param  {string} dotStr
 * @param  {object/function} setValue
 * @param  {boolean} isForce
 * @return {object}          oldValue
 */
const dotSet = function(target, dotStr, setValue, isForce) {
  const arr = dotStr.split('.');
  let setedStr = ''; //记录已经处理过的，防止dotStr中间有非Object && isForce的情况
  const setVal = function setVal(superNode, oneStr) {
    if (typeof setValue === 'function') {
      setValue(superNode, oneStr);
    } else {
      superNode[oneStr] = setValue;
    }
  };
  const dotOne = function(subTarget, dotArr) {
    if (typeof subTarget !== 'object') {
      if (isForce) {
        dotSet(target, setedStr.substring(1), {});
        return dotSet(target, dotStr, setValue, isForce);
      }
    }
    const oneStr = dotArr.shift();
    setedStr += '.' + oneStr;
    const sub = subTarget[oneStr];
    if (sub === undefined) {
      if (dotArr.length === 0) {
        setVal(subTarget, oneStr);
        return null;
      }
      subTarget[oneStr] = {};
      return dotOne(subTarget[oneStr], dotArr);
    }
    if (dotArr.length === 0) {
      const old = sub;
      setVal(subTarget, oneStr);
      return old;
    }
    return dotOne(sub, dotArr);
  };
  const re = dotOne(target, arr);
  return re;
};


// dotSet 和 dotSelector 使用例子:
// const tt = {
//   'aaa': 'aaas',
//   'bbb': {
//     's1': 's1s',
//     'ccc': { 'ddd': 'ddds' }
//   }
// };
// console.log('dotSelector: %j', dotSelector(tt, 'bbb.ccc.ddd'));
// console.dir(tt);
// console.log('dotSet: %j', dotSet(tt, 'bbb.ccc.ddd.czy', function(subTarget, oneStr) {
//   if (subTarget[oneStr] === undefined || subTarget[oneStr].constructor.name !== 'Array') {
//     console.log('===>', subTarget, oneStr, tt);
//     subTarget[oneStr] = ['aaa'];
//   } else {
//     subTarget[oneStr].push('bbb');
//   }
// }, true));
// console.log('%j', tt);

/**
 * to millisecond
 * @param  {int} year
 * @param  {int} month
 * @param  {int} day
 * @param  {int} [hour]
 * @param  {int} [min]
 * @param  {int} [sec]
 * @param  {int} [millisecond]
 * @return {int}
 */
const timeToMS = function(year, month, day, hour, min, sec, ms) {
  const d = new Date();
  if (!year) {
    return null;
  }
  d.setFullYear(year, month - 1, day);
  d.setHours(hour || 0, min || 0, sec || 0, ms || 0);
  return d.getTime();
};


const twoInt = function(int) {
  return (int < 10) ? '0' + int : int;
};
/**
 * millisecond to 'yyyy-MM-dd hh:mm:ss'
 * @param  {int} millSeccond
 * @return {string}
 */
const msToTime = function(millSec) {
  const d = millSec ? new Date(millSec) : new Date();
  const re = d.getFullYear() + '-' + twoInt(d.getMonth() + 1) + '-' + twoInt(d.getDate()) + ' ' + twoInt(d.getHours()) + ':' + twoInt(d.getMinutes()) + ':' + twoInt(d.getSeconds());
  return re;
};

/**
 * millisecond to 'yyyy-MM-dd hh:mm:ss:ms'
 * @param  {int} millSeccond
 * @return {string}
 */
const msToTimeWithMs = function(millSec) {
  const d = millSec ? new Date(millSec) : new Date();
  const re = d.getFullYear() + '-' + twoInt(d.getMonth() + 1) + '-' + twoInt(d.getDate()) + ' ' + twoInt(d.getHours()) + ':' + twoInt(d.getMinutes()) + ':' + twoInt(d.getSeconds()) + ':' + d.getMilliseconds();
  return re;
};

const timeStamp = function() {
  return (new Date()).getTime();
};


const xssFilter = function xssFilter(bodyJson) {
  return jsonFilter(bodyJson, XSSFilter.xssFilterFn);
};
const xssFilterBack = function xssFilterBack(bodyJson) {
  return jsonFilter(bodyJson, XSSFilter.xssFilterBackFn);
};


exports.doCmd = doCmd;
exports.getCookie = getCookie;
exports.updateCookie = updateCookie;
exports.timeWork = timeWork;
exports.promi = promi;
exports.promis = promis;
exports.randomChoose = random.randomChoose;
exports.randomPick = random.randomPick;
exports.shuffle = random.shuffle;
exports.Base62 = Base62;
exports.strToArr = strToArr;
exports.xssFilter = xssFilter;
exports.xssFilterBack = xssFilterBack;
exports.jsonFilter = jsonFilter;
exports.merge = merge;
exports.clone = clone;
exports.defaultCallback = defaultCallback;
exports.dotSet = dotSet;
exports.dotSelector = dotSelector;
exports.timeStamp = timeStamp;
exports.testTool = testTool;
exports.timeToMS = timeToMS;
exports.msToTime = msToTime;
exports.twoInt = twoInt;
exports.msToTimeWithMs = msToTimeWithMs;
exports.timeToMS = timeToMS;
exports.randomStr = random.randomStr;
exports.randomInt = random.randomInt;
exports.md5 = str.md5;
exports.sha1 = str.sha1;
exports.hmacSha1Base64 = str.hmacSha1Base64;
exports.hmacSha1 = str.hmacSha1;
exports.httpPost = net.httpPost;
exports.httpsPost = net.httpsPost;
exports.httpGet = net.httpGet;
exports.httpsGet = net.httpsGet;
exports.proxyGet = net.proxyGet;
exports.proxyPost = net.proxyPost;
exports.portTest = portTest;
exports.localWebServer = localWebServer;
exports.kconfig = kconfig;
exports.json = json;
exports.parseKeyFixJson = str.parseKeyFixJson;
exports.javaURLEncode = str.javaURLEncode;
exports.javaURLDecode = str.javaURLDecode;
exports.fixXXE = xmlFix.fixXXE;
exports.delHalfXmlNode = xmlFix.delHalfXmlNode;
exports.removeCData = xmlFix.removeCData;
exports.getXmlNode = xmlFix.getXmlNode;