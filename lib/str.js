'use strict';
const crypto = require('crypto');

//将html中的16进制字符进行转换,如:"这就是&#x3a;测试",转为"这就是:测试"
const hexStr = function(htmlHex) {
  const Regex = new RegExp(/&#[x]?([\w]+);/, 'mg');
  const out = htmlHex.replace(Regex, (str, group) => {
    return String.fromCharCode(parseInt('0x' + group, 16));
  });
  return out;
};


const md5 = function(str, encode) {
  const out = crypto.createHash('md5').update(str, (encode || 'utf-8')).digest('hex');
  return out;
};


const sha1 = function(str, encode) {
  const out = crypto.createHash('sha1').update(str, (encode || 'utf-8')).digest('hex');
  return out;
};

const sha256 = function(str, encode) {
  const out = crypto.createHash('sha256').update(str, (encode || 'utf-8')).digest('hex');
  return out;
};

const hmacSha1 = function(data, keyStr, encodeStr = 'hex') {
  const keyBuffer = Buffer.from(keyStr, 'utf-8');
  const hmac = crypto.createHmac('sha1', keyBuffer).update(data).digest().toString(encodeStr);
  return hmac;
};

const hmacSha256 = function(data, keyStr, encodeStr = 'hex') {
  const keyBuffer = Buffer.from(keyStr, 'utf-8');
  const hmac = crypto.createHmac('sha256', keyBuffer).update(data).digest().toString(encodeStr);
  return hmac;
};

const hmacSha1Base64 = function(data, keyStr) {
  return hmacSha1(data, keyStr, 'base64');
};

const hmacSha256Base64 = function(data, keyStr) {
  return hmacSha256(data, keyStr, 'base64');
};

const javaURLEncode = function(str) {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/~/g, '%7E');
};


const javaURLDecode = function(str) {
  const out = str
    .replace(/\+/g, '%20')
    .replace(/%21/g, '!')
    .replace(/%27/g, '\'')
    .replace(/%28/g, '(')
    .replace(/%29/g, ')')
    .replace(/%7E/g, '~');
  return decodeURIComponent(out);
};

/**
 * 修改key未加上引号的json数据并解析
 * @param  {string} nonFixJsonStr 在key上未能完全加上双引号的string
 * @return {string}               解析失败返回null
 */
const parseKeyFixJson = function(nonFixJsonStr) {
  const re = /([^\s{,"]+\s*):\s*((".*?")|\d+|true)/g;
  const fix = nonFixJsonStr.replace(re, '"$1":$2');
  try {
    return JSON.parse(fix);
  } catch (e) {
    return null;
  }
};


exports.md5 = md5;
exports.sha1 = sha1;
exports.sha256 = sha256;
exports.hexStr = hexStr;
exports.hmacSha1Base64 = hmacSha1Base64;
exports.hmacSha1 = hmacSha1;
exports.hmacSha256Base64 = hmacSha256Base64;
exports.hmacSha256 = hmacSha256;
exports.parseKeyFixJson = parseKeyFixJson;
exports.javaURLEncode = javaURLEncode;
exports.javaURLDecode = javaURLDecode;