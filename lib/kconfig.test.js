'use strict';
const kconfig = require('./kconfig');
const path = require('path');
const ktool = require('./ktool');
const vlog = require('vlog').instance(__filename);

kconfig.init();
//如果不走网络,本质上是同步执行,所以这句写在下面是安全的
console.log('show:%s', kconfig.show());

//异步的情况
kconfig.init((err, re) => {
  if (err) {
    return vlog.eo(err, '');
  }
  console.log('init DONE:%s', re);
  console.log(kconfig.show());

  console.log('GET:%j', kconfig.get('aaa.bbb.s$_aaa'));
  console.log('GET ROOT:%j', kconfig.get());
});



//生成加密的环境变量所用的配置文件
const res = kconfig.encConfigFile(path.join(__dirname, '../config/product.json'));
console.log('encConfigFile:%j', res);

// 加载环境变量的配置文件
const res1 = kconfig.loadEnvConfig(null, path.join(__dirname, '../config'));
// 可自定义非project.json为环境变量配置文件
// const res1 = kconfig.loadEnvConfig(null, path.join(__dirname, '../config'),'abc.json');
console.log('loadEnvConfig:%s', res1);



//非默认配置加载
kconfig.reInit(false, path.join(__dirname, '../config/other.json'), null, 'other');
console.log(kconfig.get('ver','other'));
console.log(kconfig.get('ver'));
console.log(kconfig.get('aaa.bbb.c','other'));
console.log(kconfig.get('aaa.bbb.c'));



