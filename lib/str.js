'use strict';
var crypto = require('crypto');


var md5 = function(str, encode) {
  var out = crypto.createHash('md5').update(str, (encode || 'utf-8')).digest('hex');
  return out;
};


var sha1 = function(str, encode) {
  var out = crypto.createHash('sha1').update(str, (encode || 'utf-8')).digest('hex');
  return out;
};

var javaURLEncode = function(str) {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/~/g, '%7E');
};

/**
 * 修改key未加上引号的json数据并解析
 * @param  {string} nonFixJsonStr 在key上未能完全加上双引号的string
 * @return {string}               解析失败返回null
 */
var parseKeyFixJson = function(nonFixJsonStr) {
  var re = /([^\s{,"]+\s*):\s*((".*?")|\d+|true)/g;
  var fix = nonFixJsonStr.replace(re, '"$1":$2');
  try {
    return JSON.parse(fix);
  } catch (e) {
    return null;
  }
};

console.log(md5('程序员', 'utf-8'));

exports.md5 = md5;
exports.sha1 = sha1;
exports.parseKeyFixJson = parseKeyFixJson;
exports.javaURLEncode = javaURLEncode;
