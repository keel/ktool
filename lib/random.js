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

/**
 * 指定范围内随机int, lowerValue <= value <= upperValue
 * @param  {int} lowerValue
 * @param  {int} upperValue
 * @return {int}            随机值value
 */
const randomInt = function randomInt(lowerValue, upperValue) {
  return Math.floor(Math.random() * (upperValue - lowerValue + 1) + lowerValue);
};

/**
 * 将Array重新洗牌
 * @param  {array} arr
 * @return {array} 返回洗过的原数组
 */
const shuffle = function shuffle(arr) {
  let m = arr.length;
  let i = 0;
  while (m) {
    i = (Math.random() * m--) >>> 0;
    [arr[m], arr[i]] = [arr[i], arr[m]];
  }
  return arr;
};

const randomChoose = function randomChoose(arr) {
  const index = Math.floor((Math.random()*arr.length));
  return arr[index];
};

const randomPick = function randomPick(arr) {
  const index = Math.floor((Math.random()*arr.length));
  return arr.splice(index,1);
};

exports.randomChoose = randomChoose;
exports.randomPick = randomPick;
exports.shuffle = shuffle;
exports.randomStr = randomStr;
exports.randomInt = randomInt;


