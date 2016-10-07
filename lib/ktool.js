'use strict';

var testTool = require('./test-tool');
var random = require('./random');
var str = require('./str');
var net = require('./net');
var portTest = require('./portTest');
var json = require('./json');
var kconfig = require('./kconfig');



/**
 * 选择目标的子项目,使用aaa.bbb.ccc的层级方式
 * @param  {object} target 目标对象
 * @param  {string} dotStr 以点号分隔的子目标
 * @return {object}        子目标
 *
 *
 var tt = {
   'aaa':'aaas',
   'bbb':{
     's1':'s1s',
     'ccc':{'ddd':'ddds'}
   }
 };
 console.log('dotSeletor: %j',dotSeletor(tt,'bbb.ccc.ddd'));
 */
var dotSelector = function(target, dotStr) {
  var arr = dotStr.split('.');
  var dotOne = function(subTarget, dotArr) {
    var oneStr = dotArr.shift();
    var sub = subTarget[oneStr];
    if (sub === undefined) {
      return null;
    }
    if (dotArr.length === 0) {
      return sub;
    }
    return dotOne(sub, dotArr);
  };
  var re = dotOne(target, arr);
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
var timeToMS = function(year, month, day, hour, min, sec, ms) {
  var d = new Date();
  if (!year) {
    return null;
  }
  d.setFullYear(year, month - 1, day);
  d.setHours(hour || 0, min || 0, sec || 0, ms || 0);
  return d.getTime();
};


var twoInt = function(int) {
  return (int < 10) ? '0' + int : int;
};
/**
 * millisecond to 'yyyy-MM-dd hh:mm:ss'
 * @param  {int} millSeccond
 * @return {string}
 */
var msToTime = function(millSec) {
  var d = millSec ? new Date(millSec) : new Date();
  var re = d.getFullYear() + '-' + twoInt(d.getMonth() + 1) + '-' + twoInt(d.getDate()) + ' ' + twoInt(d.getHours()) + ':' + twoInt(d.getMinutes()) + ':' + twoInt(d.getSeconds());
  return re;
};

/**
 * millisecond to 'yyyy-MM-dd hh:mm:ss:ms'
 * @param  {int} millSeccond
 * @return {string}
 */
var msToTimeWithMs = function(millSec) {
  var d = millSec ? new Date(millSec) : new Date();
  var re = d.getFullYear() + '-' + twoInt(d.getMonth() + 1) + '-' + twoInt(d.getDate()) + ' ' + twoInt(d.getHours()) + ':' + twoInt(d.getMinutes()) + ':' + twoInt(d.getSeconds()) + ':' + d.getMilliseconds();
  return re;
};

var timeStamp = function() {
  return (new Date()).getTime();
};


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
exports.portTest = portTest.start;
exports.kconfig = kconfig;
exports.json = json;
exports.parseKeyFixJson = str.parseKeyFixJson;
