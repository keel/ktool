'use strict';
const crypto = require('crypto');


const md5 = function(str, encode) {
  const out = crypto.createHash('md5').update(str, (encode || 'utf-8')).digest('hex');
  return out;
};


const sha1 = function(str, encode) {
  const out = crypto.createHash('sha1').update(str, (encode || 'utf-8')).digest('hex');
  return out;
};

const hmacSha1Base64 = function(data, keyStr) {
  const keyBuffer = Buffer.from(keyStr, 'utf-8');
  const hmac = crypto.createHmac('sha1', keyBuffer).update(data).digest().toString('base64');
  return hmac;
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
exports.parseKeyFixJson = parseKeyFixJson;
exports.javaURLEncode = javaURLEncode;
exports.javaURLDecode = javaURLDecode;


