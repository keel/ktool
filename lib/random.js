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
const randomInt = function(lowerValue, upperValue) {
  return Math.floor(Math.random() * (upperValue - lowerValue + 1) + lowerValue);
};

/**
 * 按概率配置抽卡: randomDraw({'item1':0.1,'item2':0.2,'item3':0.7})
 * @param {probabilityConf} 如: {'item1':0.1,'item2':0.2,'item3':0.7}
 */
const randomDraw = function(probabilityConf) {
  const r = Math.random();
  let areaLimit = 0;
  for(const i in probabilityConf){
    if (r > areaLimit && r < areaLimit + probabilityConf[i]) {
      return i;
    }
    areaLimit += probabilityConf[i];
  }
};


/**
 * 将Array重新洗牌
 * @param  {array} arr
 * @return {array} 返回洗过的原数组
 */
const shuffle = function(arr) {
  let m = arr.length;
  let i = 0;
  while (m) {
    i = (Math.random() * m--) >>> 0;
    [arr[m], arr[i]] = [arr[i], arr[m]];
  }
  return arr;
};

/**
 * 从数组中随机取n个,不影响原数组
 * @param  {array} arr
 * @param  {int} num
 * @return {array}
 */
const randomChoose = function(arr, num) {
  if (!num || num === 1) {
    return [arr[Math.floor((Math.random() * arr.length))]];
  }
  //方法1
  // const shuffledArr = shuffle(arr.slice(0));
  // return shuffledArr.slice(0, num);
  //方法2
  const shuffled = arr.slice(0);
  if (num > arr.length) {
    return shuffled;
  }
  let temp = 0;
  let index = 0;
  let i = arr.length;
  const min = i - num;
  while (i-- > min) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(min);
};


/**
 * 从数组中随机提取出n个,注意原数组会减少n个,效率比randomChoose略高
 * @param  {array} arr
 * @param  {int} num
 * @return {array}
 */
const randomPick = function(arr, num) {
  if (!num || num === 1) {
    return arr.splice(Math.floor((Math.random() * arr.length)), 1);
  }
  if (num > arr.length) {
    return arr;
  }
  const out = [];
  for (let i = 0; i < num; i++) {
    const index = Math.floor((Math.random() * arr.length));
    out.push(arr.splice(index, 1)[0]);
  }
  return out;
};


exports.randomDraw = randomDraw;
exports.randomChoose = randomChoose;
exports.randomPick = randomPick;
exports.shuffle = shuffle;
exports.randomStr = randomStr;
exports.randomInt = randomInt;