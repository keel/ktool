'use strict';
const crypto = require('crypto');

/**
 * 默认范围为A-z0-9
 * @type {String}
 */
const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
/**
 * create a random string
 * @param  {int} len     需要的随机string长度
 * @param  {char array|string} charArr char范围
 * @return {string}
 */
function randomStr(len, charArr) {
  const charTable = charArr || chars;
  const charTableLen = charTable.length;
  const randomBytes = crypto.randomBytes(len);
  const result = new Array(len);
  let cursor = 0;
  for (let i = 0; i < len; i++) {
    cursor += randomBytes[i];
    result[i] = charTable[cursor % charTableLen];
  }
  return result.join('');
}



exports.randomStr = randomStr;
