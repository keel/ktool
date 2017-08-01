'use strict';

const testTool = require('./test-tool');
const random = require('./random');
const str = require('./str');
const net = require('./net');
const portTest = require('./portTest');
const json = require('./json');
const kconfig = require('./kconfig');
const vlog = require('vlog').instance(__filename);


/*
const cacheTable = function(p1, p2 = 3, callback = defaultCallback(p1,p2)) {
  console.log('cacheTable:%j, 2:%j', p1, p2);
  callback(new Error('eeeee'));
};

cacheTable(2, 4);
 */
const defaultCallback = (...logParas) => (err) => {
  if (err) {
    logParas.unshift(err);
    vlog.eo.apply(vlog, logParas);
  }
};

/**
 * 选择目标的子项目,使用aaa.bbb.ccc的层级方式
 * @param  {object} target 目标对象
 * @param  {string} dotStr 以点号分隔的子目标
 * @return {object}        子目标
 *
 *
 const tt = {
   'aaa':'aaas',
   'bbb':{
     's1':'s1s',
     'ccc':{'ddd':'ddds'}
   }
 };
 console.log('dotSeletor: %j',dotSeletor(tt,'bbb.ccc.ddd'));
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


exports.defaultCallback = defaultCallback;
exports.dotSelector = dotSelector;
exports.timeStamp = timeStamp;
exports.testTool = testTool;
exports.timeToMS = timeToMS;
exports.msToTime = msToTime;
exports.twoInt = twoInt;
exports.msToTimeWithMs = msToTimeWithMs;
exports.timeToMS = timeToMS;
exports.randomStr = random.randomStr;
exports.md5 = str.md5;
exports.sha1 = str.sha1;
exports.httpPost = net.httpPost;
exports.httpsPost = net.httpsPost;
exports.httpGet = net.httpGet;
exports.httpsGet = net.httpsGet;
exports.portTest = portTest.start;
exports.kconfig = kconfig;
exports.json = json;
exports.parseKeyFixJson = str.parseKeyFixJson;
exports.javaURLEncode = str.javaURLEncode;
exports.javaURLDecode = str.javaURLDecode;

