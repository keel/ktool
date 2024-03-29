/*
 * 先加载default.json配置，获取project名，再从环境变量读到到配置目录,加载此目录下的[project].json配置，覆盖default.json属性
 * 注意加密属性使用s$_开头,显示全部配置内容时会将加密字段加密显示,h$_开头的属性不显示
 * 环境变量加载的文件为加密后的文件，所以需要在放置环境变量指定的配置文件时需要用encConfigFile生成一个文件
 */
'use strict';


const fs = require('fs');
const ktool = require('./ktool');
const path = require('path');
const vlog = require('vlog').instance(__filename);
const aes = require('aes-cross');

const confDirName = 'config';
const envDirName = 'KC_CONFIG';
const skipEnv = '_test_';
let defaultConfigFileName = 'default.json';
const encPre = 's$_';
const hidePre = 'h$_';
const encTxt = '******';
const initCallbacks = [];



let configObj = null;
let configFile = null;
let isInitStart = false;

const configMap = {
  'default': configObj
};


class Config {
  constructor(json) {
    if (!json) {
      throw new Error('Config: can not init by null!');
    }
    this._json = ktool.clone(json);
    this.project = json.project;
    this.ver = json.ver;
  }
  merge(newJson) {
    this._json = ktool.merge(this._json, newJson);
  }
  toString() {
    const target = ktool.clone(this._json);
    return JSON.stringify(encSecretPara(target));
  }
  get json() {
    return toString();
  }
  set json(value) {
    vlog.error('Config: setting new json value is not allowed!');
  }
  get(jsonPath) {
    return ktool.json.getSubProp(this._json, jsonPath);
  }
  // 注意set方法只能临时改变配置的值，并不能持久化，如果需要永久改变必须修改配置文件
  set(jsonPath, newVal) {
    return ktool.json.setSubProp(this._json, jsonPath, newVal);
  }
  clone() {
    return new Config(this._json);
  }
}

/**
 * 执行所有初始化传入的callback。将多个callback记入initCallbacks，从而可以在init结束后批量回调，保证只初始化一次
 */
const callbackInits = (err, re1, re2) => {
  while (initCallbacks.length > 0) {
    initCallbacks.shift()(err, re1, re2);
  }
  isInitStart = false;
};

/**
 * 首次初化,这里虽然有callback，但如果不从网络加载的话本质上是一个同步方法，执行完后初始化就结束
 * @param  {Function} callback
 * @return {}
 */
const init = function(callback) {
  reInit(false, null, null, 'default', callback);
};

/**
 * 带参数初始化,这里虽然有callback，但如果不从网络加载的话本质上是一个同步方法，执行完后初始化就结束
 * TODO 后期可从环境变量中取到URL，支持url加载
 * @param  {Boolean} isForce    强制从文件读取,可选
 * @param  {string}  localConfigFile 本地配置文件路径,可选
 * @param  {string}  envConfigFileName 环境变量的配置文件名,可选, 注意这里是文件名，不是路径
 * @param  {boolean}  isNewInstance 是否返回一个新的Config对象，主要满足同一个项目加载多个配置文件的情况
 * @param  {Function} callback
 * @return {}
 */
const reInit = function(isForce = false, localConfigFile = null, envConfigFileName = null, customConfigName = 'default', callback) {
  if (isInitStart) {
    if (callback) {
      initCallbacks.push(callback);
    }
    return;
  }
  isInitStart = true;
  if (callback) {
    initCallbacks.push(callback);
  }
  if (configMap[customConfigName] && !isForce) {
    return callbackInits(null, envConfigFileName);
  }
  if (!localConfigFile) {
    let runDir = path.join(process.cwd(), 'run');
    if (!fs.existsSync(runDir)) {
      runDir = null;
    }
    const dir = findConfigDir(runDir);
    if (!dir) {
      vlog.error('===== > config dir is not found!!');
      return callbackInits(vlog.ee(new Error('config dir is not found'), 'init', envConfigFileName));
    }
    configFile = path.join(dir, defaultConfigFileName);
    if (!fs.statSync(configFile).isFile()) {
      vlog.error('===== > config file is not found!!');
      configFile = null;
      return callbackInits(vlog.ee(new Error('config file is not found'), 'init', envConfigFileName));
    }
  } else {
    configFile = localConfigFile;
  }
  const readRe = readConfigFile(configFile);
  if (!readRe) {
    return callbackInits(vlog.ee(new Error('config file error'), 'init', envConfigFileName));
  }
  // configJson.toString = show;
  const newConfigObj = new Config(readRe);

  //载入环境变量中的配置,覆盖default.json的相关属性
  const envDir = process.env[envDirName];
  // console.log('envDir:%j, envDirName:%s ',envDir,envDirName);
  if (envDir && envConfigFileName !== skipEnv) {
    loadEnvConfig(newConfigObj, envDir, envConfigFileName);
  }
  if (customConfigName === 'default') {
    configObj = newConfigObj;
  }
  configMap[customConfigName] = newConfigObj;
  isInitStart = false;
  vlog.info('kconfig init OK! [%s] \n------\n%s\n------', customConfigName, newConfigObj.toString());
  callbackInits(null, envConfigFileName);
};

//合并一个新的env到原已有的env中
const reInitEnvByEnv = function(isForce = false, oldEnvConfigName = null, otherEnvConfigFileName = null, customConfigName = 'default', callback) {
  if (isInitStart) {
    if (callback) {
      initCallbacks.push(callback);
    }
    return;
  }
  isInitStart = true;
  if (callback) {
    initCallbacks.push(callback);
  }
  if (configMap[customConfigName] && !isForce) {
    return callbackInits(null, otherEnvConfigFileName);
  }
  if (!configMap[oldEnvConfigName]) {
    vlog.error('=====> reInitByOtherEnv oldEnv is not exists:%s', oldEnvConfigName);
    return callbackInits(vlog.ee(new Error('config dir is not found'), 'init', otherEnvConfigFileName));
  }

  const newConfigObj = configMap[oldEnvConfigName].clone();

  //载入环境变量中的配置,覆盖default.json的相关属性
  const envDir = process.env[envDirName];
  // console.log('envDir:%j, envDirName:%s ',envDir,envDirName);
  if (envDir && otherEnvConfigFileName !== skipEnv) {
    loadEnvConfig(newConfigObj, envDir, otherEnvConfigFileName);
  }
  if (customConfigName === 'default') {
    configObj = newConfigObj;
  }
  configMap[customConfigName] = newConfigObj;
  isInitStart = false;
  vlog.info('kconfig init(ebe) OK! [%s] \n------\n%s\n------', customConfigName, newConfigObj.toString());
  callbackInits(null, otherEnvConfigFileName);
};

const readEncConfigFile = function(localConfigObj, filePath) {
  try {
    let configStr = fs.readFileSync(filePath, 'utf-8');
    if (!configStr) {
      vlog.error('readEncConfigFile,read config file failed.', path.basename(filePath));
      return null;
    }
    const hKey = localConfigObj.get('h$_key');
    if (hKey) {
      const keyBuf = Buffer.from(ktool.md5(hKey + localConfigObj.project)).slice(0, 16);
      configStr = aes.decText(configStr, keyBuf);
    }
    const json = configStrToJson(configStr, true);
    if (!json) {
      vlog.error('readEncConfigFile,configStrToJson failed:%j', path.basename(filePath));
      return null;
    }
    return json;
  } catch (e) {
    vlog.eo(e, 'readEncConfigFile,config file is not exist or not json.', path.basename(filePath));
    return null;
  }
};

const loadEnvConfig = function(localConfigObj, envDir, envConfigFileName) {
  const thisConfig = localConfigObj || configObj;
  if (!thisConfig) {
    vlog.error('===== > loadEnvConfig, thisConfig is null!!');
    return null;
  }
  const envFile = path.join(envDir, (envConfigFileName || thisConfig.project + '.json'));
  try {
    if (!fs.statSync(envFile).isFile()) {
      vlog.error('===== > env config file is not found!!', path.basename(envFile));
      return thisConfig;
    }
  } catch (e) {
    vlog.error('===== > read env config file failed!', path.basename(envFile));
    return thisConfig;
  }
  const readRe = readEncConfigFile(localConfigObj, envFile);
  if (readRe) {
    thisConfig.merge(readRe);
  }
  return thisConfig;
};

const encConfigFile = function(noDefaultConfigFile) {
  if (!configObj) {
    vlog.error('===== > encConfigFile, configObj is null!!');
    return false;
  }
  if (!fs.statSync(noDefaultConfigFile).isFile()) {
    vlog.error('===== > encConfigFile config file is not found!!');
    return false;
  }
  try {
    const newConfigFile = path.join(path.dirname(noDefaultConfigFile), configObj.project + '.json');
    const hKey = configObj.get('h$_key');
    if (!hKey) {
      vlog.error('===== > encConfigFile , no key');
      return false;
    }
    const configStr = fs.readFileSync(noDefaultConfigFile, 'utf-8');
    const keyBuf = Buffer.from(ktool.md5(hKey + configObj.project)).slice(0, 16);
    const envConfJson = aes.encText(configStr, keyBuf);
    fs.writeFileSync(newConfigFile, envConfJson);
    return true;
  } catch (e) {
    vlog.eo(e, 'encConfigFile', noDefaultConfigFile);
    return false;
  }
};

const findConfigDir = function(dir) {
  const curPath = dir || process.cwd();
  // vlog.log('curPath:%j',curPath);
  const files = fs.readdirSync(curPath);
  const isFoundConf = files.find(file => file === confDirName);
  if (isFoundConf && fs.statSync(path.join(curPath, confDirName)).isDirectory()) {
    return path.join(curPath, confDirName);
  }
  if (curPath === path.sep) {
    return null;
  }
  return findConfigDir(path.join(curPath, '..'));
};

const encSecretPara = function(json) {
  if (Array.isArray(json)) {
    for (let i = 0, len = json.length; i < len; i++) {
      json[i] = encSecretPara(json[i]);
    }
    return json;
  }
  if (Object.prototype.toString.call(json) === '[object Object]') {
    const arr = Object.keys(json);
    for (let i = 0, len = arr.length; i < len; i++) {
      const key = arr[i];
      if (key.startsWith(encPre)) {
        json[key] = encTxt;
        continue;
      }
      if (key.startsWith(hidePre)) {
        json[key] = undefined;
        continue;
      }
      json[key] = encSecretPara(json[key]);
    }
    return json;
  }
  return json;
};

const show = function show() {
  return configObj.toString();
};

const configStrToJson = function(configStr, isNoCheck) {
  const json = JSON.parse(configStr);
  if (!json) {
    vlog.error('json is null.');
    return null;
  }
  if (!isNoCheck) {
    if (!json['ver']) {
      vlog.error('ver can not be found.');
      return null;
    }
    if (!json['project']) {
      vlog.error('project can not be found.');
      return null;
    }
  }
  return json;
};

const readConfigFile = function(filePath, isNoCheck) {
  try {
    const configStr = fs.readFileSync(filePath, 'utf-8');
    if (!configStr) {
      vlog.error('read config file failed.', path.basename(filePath));
      return null;
    }
    const json = configStrToJson(configStr, isNoCheck);
    if (!json) {
      vlog.error('readConfigFile failed:%j ,isNoCheck: %j', path.basename(filePath), isNoCheck);
    }
    return json;
  } catch (e) {
    vlog.eo(e, 'config file is not exist or not json.', path.basename(filePath));
    return null;
  }
};


/**
 * 获取配置,注意需要在执行init以后
 * @param  {string} jsonPath
 * @param  {string} customConfigName
 * @return {anyType}
 */
const get = function(jsonPath, customConfigName = 'default') {
  const configTaget = configMap[customConfigName];
  if (!configTaget) {
    vlog.error('get config failed, need init.', jsonPath, customConfigName);
    return null;
  }
  return configTaget.get(jsonPath);
};

//为实现测试环境使用test.json作为默认配置
const setDefaultConf = function(fileName) {
  defaultConfigFileName = fileName;
};

exports.setDefaultConf = setDefaultConf;
exports.init = init;
exports.reInit = reInit;
exports.get = get;
exports.show = show;
exports.encConfigFile = encConfigFile;
exports.reInitEnvByEnv = reInitEnvByEnv;
// exports.loadEnvConfig = loadEnvConfig;