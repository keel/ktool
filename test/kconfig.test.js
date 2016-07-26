'use strict';


var expect = require('chai').expect;
var kconfig = require('../lib/kconfig');


describe('kconfig', function() {
  var configFilePath = 'test/';
  var projectName = 'testProj';

  describe('#readConfig', function() {
    it('should read dev OK', function() {
      var re = kconfig.readConfig(projectName, configFilePath + 'config.json');
      expect(1).to.be.eql(re.ver);
      expect(6379).to.be.eql(re.redisPort);
      expect('192.168.0.19').to.be.eql(re.redisIP);
    });
    it('should read product OK', function() {
      var re = kconfig.readConfig(projectName, configFilePath + 'config.json', 'product');
      expect(1).to.be.eql(re.ver);
      expect(16379).to.be.eql(re.redisPort);
      expect('10.1.1.111').to.be.eql(re.redisIP);
    });
    it('should be failed by config file', function() {
      var re = kconfig.readConfig(projectName, configFilePath + 'configxxx.json', 'product');
      expect(null).to.be.eql(re);
    });
    it('should be failed by env', function() {
      var re = kconfig.readConfig(projectName, configFilePath + 'config.json', 'xxx');
      expect(null).to.be.eql(re);
    });
    it('should be failed by json', function() {
      var re = kconfig.readConfig(projectName, configFilePath + 'config1.json');
      expect(null).to.be.eql(re);
    });
    it('should be failed by ver', function() {
      var re = kconfig.readConfig(projectName, configFilePath + 'config2.json');
      expect(null).to.be.eql(re);
    });
    it('should be failed by empty config file', function() {
      var re = kconfig.readConfig(projectName, configFilePath + 'config3.json');
      expect(null).to.be.eql(re);
    });
  });

});
