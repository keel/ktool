'use strict';
const kconfig = require('./kconfig');
const ktool = require('./ktool');
const vlog = require('vlog').instance(__filename);

kconfig.init();
// kconfig.init((err, re) => {
//   if (err) {
//     return vlog.eo(err, '');
//   }
//   console.log('init DONE:%s', re);
//   // kconfig.init();
//   // const res = kconfig.encConfigFile('/Users/keel/dev/nodeProject/ktool/config/product.json');
//   // console.log('encConfigFile:%j', res);


//   const res = kconfig.loadEnvConfig('/Users/keel/dev/nodeProject/ktool/config');
//   console.log('loadEnvConfig:%j',res);
//   console.log('loadEnvConfig:%s',kconfig.show());
//   // console.log('GET:%j',kconfig.get('aaa.bbb.s!_aaa'));
//   // console.log('show:%s',kconfig.show());
// });