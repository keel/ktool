'use strict';
const ktool = require('./ktool');

const a = {
  a: 'b',
  b: {
    c: 'c',
    x:[3,4,{xxx:'sss'}]
  },
  c:{
    as:{
      df:{
        sy:'sy2'
      }
    }
  }
};

const b = {
  d: 'd',
  d2:[3,4,{'yyy':'yyys'}
  ],
  c:3
};

ktool.merge(b, a);
console.log(JSON.stringify(b));

ktool.httpGet('http://www.baidu.com',(err, re) => {
  if (err) {
    return console.error(err.stack);
  }
  console.log(re.toString());
});
