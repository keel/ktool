/*
配置读取,支持不同的环境下采用不同的配置;
除了ver,project为所有环境共有配置,其他配置都按env进行区分,返回的配置为json,带有ver和env字段;
 */
'use strict';


var fs = require('fs');
var vlog = require('vlog').instance(__filename);

/**
 * 读取配置，从本地配置文件读取json，再从project环境变量(project.toUppperCase_CONFIG_K)中
 * 读取环境(环境名称: dev,test,gray,product...,如果读不到,默认是dev)
 * 读取成功后,在project.toUppperCase_CONFIG_V中保存这个json string
 * @param  {configFile}   String   配置文件
 * @param  {json} 对应的配置json
 */
var readConfig = function(configFile) {
  if (!configFile) {
    vlog.error('read config file failed.', configFile);
    return null;
  }

  try {
    var configStr = fs.readFileSync(configFile, 'utf-8');
    if (!configStr) {
      vlog.error('read config file failed.', configFile);
      return null;
    }
    var json = JSON.parse(configStr);
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
    var env = process.env[json.project.toUpperCase() + '_CONFIG_K'] || 'dev';
    if (!json[env]) {
      vlog.error('env can not be found.', configFile, configStr);
      return null;
    }
    var out = json[env];
    out['ver'] = json['ver'];
    out['project'] = json['project'];
    out['env'] = env;
    process.env[json.project.toUpperCase() + '_CONFIG_V'] = JSON.stringify(out);
    return out;
  } catch (e) {
    vlog.error('config file is not exist or not json.', configFile, configStr);
    return null;
  }

};

exports.readConfig = readConfig;
