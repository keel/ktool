'use strict';
const kconfig = require('./kconfig');
const ktool = require('./ktool');
const vlog = require('vlog').instance(__filename);

kconfig.init();
//如果不走网络,本质上是同步执行,所以这句写在下面是安全的
console.log('show:%s',kconfig.show());


//异步的情况
kconfig.init((err, re) => {
  if (err) {
    return vlog.eo(err, '');
  }
  console.log('init DONE:%s', re);
  // kconfig.init();
  // const res = kconfig.encConfigFile('/Users/keel/dev/nodeProject/ktool/config/product.json');
  // console.log('encConfigFile:%j', res);


  // const res = kconfig.loadEnvConfig('/Users/keel/dev/nodeProject/ktool/config');
  // console.log('loadEnvConfig:%j',res);
  // console.log('loadEnvConfig:%s',kconfig.show());
  console.log('GET:%j',kconfig.get('aaa.bbb.s!_aaa'));
  console.log('GET ROOT:%j',kconfig.get());
  console.log('show:%s',kconfig.show());
});