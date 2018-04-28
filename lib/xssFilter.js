'use strict';

const xssArr = [
  [/</g, '&lt;', /&lt;/g, '<'],
  [/>/g, '&gt;', /&gt;/g, '>'],
  [/"/g, '&quot;', /&quot;/g, '"'],
  [/'/g, '&x27;', /&x27;/g, '\''],
  [/\//g, '&x2f;', /&x2f;/g, '/'],
  [/&#/g, '_&# _', /_&# _/g, '&#'],
  [/\\/g, '_\\_', /_\\_/g, '\\']

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
    for (let i = 0, len = xssArr.length; i < len; i++) {
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
//     'arr': ['<sdfs>sdfa', 'asdf/asfdad', 'adfsdfn'],
//     'adsf': {
//       'sfdasdf': {
//         'aaa': 2323,
//         'sfasdf': [2, 3, 'mdfsd:"sdfdf']
//       }
//     }
//   }
// };

// const re1 = ktool.xssFilter(json);
// console.log(JSON.stringify(re1));
// const re2 = ktool.xssFilterBack(re1);
// console.log(JSON.stringify(re2));