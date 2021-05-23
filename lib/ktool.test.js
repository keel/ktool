'use strict';
const ktool = require('./ktool');

const t4 = function() {

  const stdinPlus = ktool.stdinPlus;
  (async function() {

    console.log('start....');
    stdinPlus.updateTips({ 'cancelTxt': 'CANCEL' });
    let arr = ['使用空cookie', '我已录入新cookie', '录入新', 'bbbbb', '录入新', 'bbbbb', 'ccccc', 'ddddd', '录入新s', '录入新', 'bbbbb', '录入新', 'bbbbb', 'ccccc', 'ddddd', '录入新s'];
    let index = await stdinPlus.keySelectSync(arr, '请选择一个');

    console.log('已选择:' + arr[index]);

    index = await stdinPlus.questionSync('再来?');
    console.log('又再' + index);

    arr = ['aaaaaa', 'bbbbb', '录入新', 'ddddd', 'eeeeee'];
    index = await stdinPlus.keySelectSync(arr);

    console.log('又已选择:' + arr[index]);

    index = await stdinPlus.questionSync('再来?');
    console.log('最后再' + index);

    arr = ['录入新', 'bbbbb', '录入新', 'bbbbb', 'ccccc', 'ddddd', '录入新s'];
    index = await stdinPlus.keySelectSync(arr);

    console.log('又...已选择:' + arr[index]);

  })().catch((err) => {
    console.error(err);
  });
};

// t4();

const t1 = function() {
  const a = {
    a: 'b',
    b: {
      c: 'c',
      x: [3, 4, { xxx: 'sss' }]
    },
    c: {
      as: {
        df: {
          sy: 'sy2'
        }
      }
    }
  };

  const b = {
    d: 'd',
    d2: [3, 4, { 'yyy': 'yyys' }],
    c: 3
  };

  ktool.merge(b, a);
  console.log(JSON.stringify(b));

};

const t2 = function() {
  const proxyConf = {
    'host': '127.0.0.1',
    'port': 8888
  };

  // ktool.proxyGet(proxyConf, 'https://www.baidu.com', (err, re) => {
  //   if (err) {
  //     return console.error(err.stack);
  //   }
  //   console.log('' + re);
  // });

  // ktool.proxyGet(proxyConf, 'https://www.baidu.com', 'q=xyz', (err, re) => {
  //   if (err) {
  //     return console.error(err.stack);
  //   }
  //   console.log('' + re);
  // });

};


const t3 = function() {
  // const base2 = ktool.Base62.instance();

  // const b1 = ktool.Base62.encode(2342343223);
  // const b2 = base2.encode(2342343223);
  // console.log(b1);
  // console.log(b2);
  // console.log(ktool.Base62.decode(b1));
  // console.log(base2.decode(b2));

  // const arr = [2,3,4,5,6,7,8,9];
  // ktool.shuffle(arr);
  // console.log(arr);

  const arr = [1, 3, 6, 13, 4, 9, 7];
  console.log(ktool.randomChoose(arr, 2));
  console.log(ktool.randomChoose(arr));
  console.log(arr);
  console.log(ktool.randomPick(arr));
  console.log(ktool.randomPick(arr, 2));
  console.log(arr);
};
