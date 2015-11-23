'use strict';
var crypto = require('crypto');

/**
 * 默认范围为A-z0-9
 * @type {String}
 */
var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
/**
 * create a random string
 * @param  {int} len     需要的随机string长度
 * @param  {char array|string} charArr char范围
 * @return {string}
 */
function randomStr(len, charArr) {
  var charTable = charArr || chars;
  var charTableLen = charTable.length;
  var randomBytes = crypto.randomBytes(len);
  var result = new Array(len);
  var cursor = 0;
  for (var i = 0; i < len; i++) {
    cursor += randomBytes[i];
    result[i] = charTable[cursor % charTableLen];
  }
  return result.join('');
}



exports.randomStr = randomStr;
