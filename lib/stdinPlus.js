/*
在stdin中进行keySelect和question,在windows下中文无乱码(readline-sync库有乱码问题)
 */
'use strict';

const readline = require('readline');
const ktool = require('./ktool');
const stdin = process.stdin;
const stdout = process.stdout;

let cancelTxt = '取消';
let selectTxt = '请选择';
let optTooMuchTxt = '[WARN]选项过多!已去除部分选项,建议拆分.'; //'Too much options in keySelect!'

const setRawOn = function() {
  readline.emitKeypressEvents(stdin);
  if (stdin.isTTY) {
    stdin.setRawMode(true);
  }
};

const setRawOff = function() {
  if (stdin.isTTY) {
    stdin.setRawMode(false);
  }
};

const resetIn = function(events) {
  setRawOff();
  if (events) {
    for (const i in events) {
      stdin.removeListener(i, events[i]);
    }
  }
  stdin.resume();
};

const optIndex = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

const getOptStr = function(optLen) {
  if (optLen > optIndex.length) {
    optLen = optIndex.length;
  }
  if (optLen > 3) {
    if (optLen < 10) {
      return ' [1, 2...' + optLen + ' / 0]:';
    }
    return ' [1, 2...a, b...' + optIndex[optLen - 1] + ' / 0]:';
  }
  let out = ' [';
  for (let i = 0; i < optLen; i++) {
    out += optIndex[i] + ', ';
  }
  out += '0]:';
  return out;
};

const keySelect = function(items, tips, callback) {
  setRawOn();
  if (typeof tips === 'function') {
    callback = tips;
    tips = selectTxt;
  }
  let options = '';
  const optMap = { '0': '1' };
  if (items.constructor.name !== 'Array') {
    items = [items];
  }
  let optLen = items.length;
  if (optLen > optIndex.length) {
    stdout.write(optTooMuchTxt);
    optLen = optIndex.length;
  }
  for (let i = 0; i < optLen; i++) {
    const index = optIndex[i];
    options += '[' + index + '] ' + items[i] + '\n';
    optMap[index] = '' + i;
  }
  options += '[0] ' + cancelTxt + '\n';
  stdout.write(options + '\n' + tips + getOptStr(optLen));
  stdin.resume();
  stdin.setEncoding('utf8');
  const pressEvent = (chunk, key) => {
    // console.log('keypress:' , key);
    if (key && key.ctrl && key.name == 'c') {
      // console.log('exit...');
      resetIn({ 'keypress': pressEvent });
      process.exit();
      return;
    }
    chunk = chunk.toLowerCase();
    const selected = optMap[chunk];
    if (!selected) {
      stdout.write('');
    } else {
      stdout.write(chunk + '\n');
      resetIn({ 'keypress': pressEvent });
      callback(null, parseInt(selected));
    }
  };
  stdin.on('keypress', pressEvent);

};


const question = function(query, callback) {
  stdout.write(query);
  stdin.resume();
  stdin.setEncoding('utf8');
  stdin.on('data', (data) => {
    callback(null, data);
  });
};

const updateTips = function(tipsMap) {
  if (tipsMap.cancelTxt) {
    cancelTxt = tipsMap.cancelTxt;
  }
  if (tipsMap.selectTxt) {
    selectTxt = tipsMap.selectTxt;
  }
  if (tipsMap.optTooMuchTxt) {
    optTooMuchTxt = tipsMap.optTooMuchTxt;
  }
};

//注意这里需要等待ktool.promi导出之后才能正确执行
const keySelectSync = ktool.promi(keySelect);
const questionSync = ktool.promi(question);

exports.keySelect = keySelect;
exports.keySelectSync = keySelectSync;
exports.question = question;
exports.questionSync = questionSync;
exports.updateTips = updateTips;


