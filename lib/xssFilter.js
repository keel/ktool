/**
 * xss过滤,建议在输出到html使用xssFilter方法，不要在输入时使用，以免正常的数据受到干扰
 */
'use strict';

const xssArr = [
  [/;/g, '&#x3b;', /&#x3b;/g, ';'], //注意顺序，这几条必须先转，反之在back时必须最后
  [/:/g, '&#x3a;', /&#x3a;/g, ':'],
  [/&#/g, '&#x26;&#x23;', /&#x26;&#x23;/g, '&#'],
  [/</g, '&lt;', /&lt;/g, '<'],
  [/>/g, '&gt;', /&gt;/g, '>'],
  [/"/g, '&quot;', /&quot;/g, '"'],
  [/'/g, '&#x27;', /&#x27;/g, '\''], //&#x +ascii转16进制码
  [/`/g, '&#x60;', /&#x60;/g, '`'],
  [/\//g, '&#x2f;', /&#x2f;/g, '/'],
  [/\\/g, '&#x5c;', /&#x5c;/g, '\\'],
  // [/data:text/ig, '&#x64;ata:text', /&#x64;ata:text/ig, 'data:text'],
  // [/onerror/ig, 'on&#x65;rror', /on&#x65;rror/ig, 'onerror'], //事件太多

];



const xssFilterFn = function xssFilterFn(bodyJson) {
  if (typeof bodyJson === 'string') {
    for (let i = 0, len = xssArr.length; i < len; i++) {
      bodyJson = bodyJson.replace(xssArr[i][0], xssArr[i][1]);
    }
  }
  return bodyJson;
};

const xssFilterBackFn = function xssFilterBackFn(bodyJson) {
  if (typeof bodyJson === 'string') {
    for (let i = xssArr.length - 1, len = 0; i >= len; i--) {
      bodyJson = bodyJson.replace(xssArr[i][2], xssArr[i][3]);
    }
  }
  return bodyJson;
};



exports.xssFilterFn = xssFilterFn;
exports.xssFilterBackFn = xssFilterBackFn;


// const ktool = require('./ktool');
// const json = {
//   'adf': 0,
//   'ob': {
//     'asdfasdf': 'https://asfdsf.com',
//     'arr': ['<sdfs>sdfa', 'asdf/asfdad', 'onErRor'],
//     'adsf': {
//       'sfdasdf': {
//         'aaa': 2323,
//         'sfasdf': [2, 3, 'mdfsd:"data:text']
//       }
//     }
//   }
// };

// console.log(JSON.stringify(json));
// console.log('\n');
// const re1 = ktool.xssFilter(json);
// console.log(JSON.stringify(re1));
// console.log('\n');
// const re2 = ktool.xssFilterBack(re1);
// console.log(JSON.stringify(re2));