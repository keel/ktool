/*
 * 先加载default.json配置，获取project名，再从环境变量读到到配置目录,加载此目录下的[project].json配置，覆盖default.json属性
 * 注意显示配置内容时要使用configJson的toString方法,会将加密字段加密显示
 * 环境变量加载的文件为加密后的文件，所以需要在放置环境变量指定的配置文件时需要用encConfigFile生成一个文件
 * TODO 后期可从环境变量中取到URL，支持url加载
 */
'use strict';


const fs = require('fs');
const ktool = require('./ktool');
const path = require('path');
const vlog = require('vlog').instance(__filename);
const aes = require('aes-cross');

const confDirName = 'config';
const envDirName = 'KC_CONFIG';
const defaultConfigFileName = 'default.json';
const encPre = 's!_';
const hidePre = 'h!_';
const encTxt = '******';
const initCallbacks = [];

let configJson = null;
let configFile = null;
let isInitStart = false;

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
const init = function init(callback) {
  reInit(false, null, callback);
};

/**
 * 带参数初始化,,这里虽然有callback，但如果不从网络加载的话本质上是一个同步方法，执行完后初始化就结束
 * TODO 后期可从环境变量中取到URL，支持url加载
 * @param  {Boolean} isForce    强制从文件读取,可选
 * @param  {string}  localConfigFile 本地配置文件路径,可选
 * @param  {Function} callback
 * @return {}
 */
const reInit = function(isForce = false, localConfigFile = null, callback) {
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
  if (configJson && !isForce) {
    return callbackInits(null, configFile);
  }
  if (!localConfigFile) {
    const dir = findConfigDir();
    if (!dir) {
      vlog.error('===== > config dir is not found!!');
      return callbackInits(vlog.ee(new Error('config dir is not found'), 'init', configFile));
    }
    configFile = path.join(dir, defaultConfigFileName);
    if (!fs.statSync(configFile).isFile()) {
      vlog.error('===== > config file is not found!!');
      configFile = null;
      return callbackInits(vlog.ee(new Error('config file is not found'), 'init', configFile));
    }
  } else {
    configFile = localConfigFile;
  }
  configJson = readConfigFile(configFile);
  configJson.toString = show;
  if (!configJson) {
    return callbackInits(vlog.ee(new Error('config file error'), 'init', configFile));
  }

  //载入环境变量中的配置,覆盖default.json的相关属性
  const envDir = process.env[envDirName];
  // console.log('envDir:%j, envDirName:%s',envDir,envDirName);
  if (envDir) {
    loadEnvConfig(envDir);
  }
  isInitStart = false;
  vlog.log('kconfig init OK! \n------\n%s\n------', configJson.toString());
  callbackInits(null, configFile);
};


const loadEnvConfig = function loadEnvConfig(envDir) {
  if (!configJson) {
    vlog.error('===== > loadEnvConfig, configJson is null!!');
    return configJson;
  }
  const envFile = path.join(envDir, configJson.project + '.json');
  if (!fs.statSync(envFile).isFile()) {
    vlog.error('===== > env config file is not found!!');
    return configJson;
  }
  try {
    let configStr = fs.readFileSync(envFile, 'utf-8');
    if (!configStr) {
      vlog.error('loadEnvConfig,read config file failed.', envDir);
      return null;
    }
    const hKey = configJson['h!_key'];
    if (hKey) {
      const keyBuf = Buffer.from(ktool.md5(hKey + configJson.project)).slice(0, 16);
      configStr = aes.decText(configStr, keyBuf);
    }
    const json = configStrToJson(configStr, true);
    if (!json) {
      vlog.error('loadEnvConfig,configStrToJson failed:%j', envDir);
    }
    configJson = Object.assign(configJson, json);
  } catch (e) {
    vlog.eo(e, 'loadEnvConfig,config file is not exist or not json.', envDir);
    return null;
  }
  return configJson;
};

const encConfigFile = function encConfigFile(noDefaultConfigFile) {
  if (!configJson) {
    vlog.error('===== > encConfigFile, configJson is null!!');
    return false;
  }
  if (!fs.statSync(noDefaultConfigFile).isFile()) {
    vlog.error('===== > encConfigFile config file is not found!!');
    return false;
  }
  try {
    const newConfigFile = path.join(path.dirname(noDefaultConfigFile), configJson.project + '.json');
    const hKey = configJson['h!_key'];
    if (!hKey) {
      vlog.error('===== > encConfigFile , no key');
      return false;
    }
    const configStr = fs.readFileSync(noDefaultConfigFile, 'utf-8');
    const keyBuf = Buffer.from(ktool.md5(hKey + configJson.project)).slice(0, 16);
    const envConfJson = aes.encText(configStr, keyBuf);
    fs.writeFileSync(newConfigFile, envConfJson);
    return true;
  } catch (e) {
    vlog.eo(e, 'encConfigFile', noDefaultConfigFile);
    return false;
  }
};

const findConfigDir = function findConfigDir(dir) {
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

const encSecretPara = function encSecretPara(json = configJson) {
  if (Array.isArray(json)) {
    for (let i = 0, len = json.length; i < len; i++) {
      json[i] = encSecretPara(json[i]);
    }
    return json;
  }
  if (Object.prototype.toString.call(json) === '[object Object]') {
    for (const i in json) {
      if (i.startsWith(encPre)) {
        json[i] = encTxt;
        continue;
      }
      if (i.startsWith(hidePre)) {
        json[i] = undefined;
        continue;
      }
      json[i] = encSecretPara(json[i]);
    }
    return json;
  }
  return json;
};

const show = function show(json = configJson) {
  const target = ktool.clone(json);
  return JSON.stringify(encSecretPara(target));
};

const configStrToJson = function configStrToJson(configStr, isNoCheck) {
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

const readConfigFile = function readConfigFile(filePath, isNoCheck) {
  try {
    const configStr = fs.readFileSync(filePath, 'utf-8');
    if (!configStr) {
      vlog.error('read config file failed.', filePath);
      return null;
    }
    const json = configStrToJson(configStr, isNoCheck);
    if (!json) {
      vlog.error('readConfigFile failed:%j ,isNoCheck: %j', filePath, isNoCheck);
    }
    return json;
  } catch (e) {
    vlog.eo(e, 'config file is not exist or not json.', filePath);
    return null;
  }
};


/**
 * 获取配置,注意需要在执行init以后
 * @param  {string} jsonPath
 * @return {anyType}
 */
const get = function(jsonPath) {
  return ktool.json.getSubProp(configJson, jsonPath);
};

exports.init = init;
exports.reInit = reInit;
exports.get = get;
exports.show = show;
exports.encConfigFile = encConfigFile;
exports.loadEnvConfig = loadEnvConfig;