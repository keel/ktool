/*
配置读取,支持不同的环境下采用不同的配置;
除了ver,project为所有环境共有配置,其他配置都按env进行区分,返回的配置为json,带有ver,project,env,__readTimes字段;
 */
'use strict';


const fs = require('fs');
const vlog = require('vlog').instance(__filename);

/**
 * 读取配置，从本地配置文件读取json，再从project环境变量(project.toUppperCase_CONFIG_K)中
 * 读取环境(环境名称: dev,test,gray,product...,如果读不到,默认是dev)
 * @param  {configFile}   String   配置文件
 * @param  {isForce}   boolean   是否强制从文件读取
 * @param  {json} 对应的配置json
 */
const readConfig = function(configFile) {

  if (!configFile) {
    vlog.error('read config file failed.', configFile);
    return null;
  }

  try {
    const configStr = fs.readFileSync(configFile, 'utf-8');
    if (!configStr) {
      vlog.error('read config file failed.', configFile);
      return null;
    }
    const json = JSON.parse(configStr);
    if (!json) {
      vlog.error('json is null.', configFile, configStr);
      return null;
    }
    if (!json['ver']) {
      vlog.error('ver can not be found.', configFile, configStr);
      return null;
    }
    if (!json['project']) {
      vlog.error('project can not be found.', configFile, configStr);
      return null;
    }
    const env = process.env[json.project.toUpperCase() + '_CONFIG_K'] || 'dev';
    if (!json[env]) {
      vlog.error('env can not be found.', configFile, configStr);
      return null;
    }
    const out = json[env];
    out['ver'] = json['ver'];
    out['project'] = json['project'];
    out['env'] = env;
    vlog.log('kconfig loaded:%j',out);
    return out;
  } catch (e) {
    vlog.error('config file is not exist or not json.', configFile);
    return null;
  }

};

let configJson = null;
let confFile = null;
//这里标记从文件读取的次数
let readTimes = 0;
/**
 * 获取配置,注意需要在执行init以后
 * @param  {Boolean} isForce 强制读取文件配置,用于刷新配置用,可选
 * @return {json}          配置json
 */
const getConfig = function(isForce) {
  if (!isForce && configJson) {
    return configJson;
  }
  configJson = readConfig(confFile);
  if (configJson) {
    readTimes++;
    configJson['__readTimes'] = readTimes;
  }
  return configJson;
};
/**
 * 重置读取文件的次数,主要用于测试和监控
 * @return {void}
 */
const resetReadTimes = function() {
  readTimes = 0;
  if (configJson) {
    configJson['__readTimes'] = 0;
  }
};
/**
 * 初始化,并返回配置json
 * @param  {string}  configFile 配置文件路径
 * @param  {Boolean} isForce    强制从文件读取,可选
 * @return {json}             配置json
 */
const init = function(configFile, isForce) {
  confFile = configFile;
  return getConfig(isForce);
};

exports.init = init;
exports.getConfig = getConfig;
exports.resetReadTimes = resetReadTimes;
exports.readConfig = readConfig;
