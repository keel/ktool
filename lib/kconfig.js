/*
配置读取,支持不同的环境下采用不同的配置;
除了ver,project为所有环境共有配置,其他配置都按env进行区分,返回的配置为json,带有ver和env字段;
 */
'use strict';


var fs = require('fs');
var vlog = require('vlog').instance(__filename);

/**
 * 读取配置，先从本地config.json读取，再从redis中刷新最新配置,如果redis无法连接，不报错直接返回本地配置
 * @param  {configFile}   String   配置文件
 * @param  {envType}   String   环境名称: dev,test,gray,product...,如果不传,默认是dev
 * @param  {json} 对应的配置json
 */
var readConfig = function( configFile, envType) {
  if (!configFile) {
    vlog.error('read config file failed.',  configFile, envType);
    return null;
  }

  try {
    var configStr = fs.readFileSync(configFile, 'utf-8');
    if (!configStr) {
      vlog.error('read config file failed.',  configFile, envType);
      return null;
    }
    var json = JSON.parse(configStr);
    if (!json) {
      vlog.error('json is null.',  configFile, envType, configStr);
      return null;
    }
    var env = envType || 'dev';
    if (!json[env]) {
      vlog.error('env can not be found.',  configFile, envType, configStr);
      return null;
    }
    if (!json['ver']) {
      vlog.error('ver can not be found.',  configFile, envType, configStr);
      return null;
    }
    if (!json['project']) {
      vlog.error('project can not be found.',  configFile, envType, configStr);
      return null;
    }
    var out = json[env];
    out['ver'] = json['ver'];
    out['project'] = json['project'];
    out['env'] = env;
    return out;
  } catch (e) {
    vlog.error('config file is not exist or not json.',  configFile, envType, configStr);
    return null;
  }

};

exports.readConfig = readConfig;
