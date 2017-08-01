'use strict';


const expect = require('chai').expect;
const kconfig = require('../lib/kconfig');


const configFilePath = 'test/';

describe('kconfig', function() {
  // beforeEach(function() {
  //   delete process.env['KEEL_CONFIG_V'];
  // });

  describe('#readConfig', function() {
    it('should read dev OK', function() {
      // process.env.KTOOL_CONFIG_K = 'dev';
      const re = kconfig.readConfig(configFilePath + 'config.json');
      expect(1).to.be.eql(re.ver);
      expect('ktool').to.be.eql(re.project);
      expect(6379).to.be.eql(re.redisPort);
      expect('192.168.0.19').to.be.eql(re.redisIP);
    });
    it('should read product OK', function() {
      process.env.KTOOL_CONFIG_K = 'product';
      const re = kconfig.readConfig(configFilePath + 'config.json');
      expect(1).to.be.eql(re.ver);
      expect('ktool').to.be.eql(re.project);
      expect(16379).to.be.eql(re.redisPort);
      expect('10.1.1.111').to.be.eql(re.redisIP);
      process.env.KTOOL_CONFIG_K = 'dev';
    });
    it('should be failed by config file', function() {
      const re = kconfig.readConfig(configFilePath + 'configxxx.json');
      expect(null).to.be.eql(re);
    });
    it('should be failed by json', function() {
      const re = kconfig.readConfig(configFilePath + 'config1.json');
      expect(null).to.be.eql(re);
    });
    it('should be failed by ver', function() {
      const re = kconfig.readConfig(configFilePath + 'config2.json');
      expect(null).to.be.eql(re);
    });
    it('should be failed by project', function() {
      const re = kconfig.readConfig(configFilePath + 'config4.json');
      expect(null).to.be.eql(re);
    });
    it('should be failed by empty config file', function() {
      const re = kconfig.readConfig(configFilePath + 'config3.json');
      expect(null).to.be.eql(re);
    });
  });

  describe('#getConfig', function() {

    kconfig.init(configFilePath + 'config.json');

    it('should getConfig dev OK', function() {
      // process.env.KTOOL_CONFIG_K = 'dev';
      kconfig.resetReadTimes();
      const re = kconfig.getConfig();
      expect(re).not.to.be.null;
      expect(1).to.be.eql(re.ver);
      expect('ktool').to.be.eql(re.project);
      expect(6379).to.be.eql(re.redisPort);
      expect('192.168.0.19').to.be.eql(re.redisIP);
      expect(0).to.be.eql(re.__readTimes);
    });

    it('should read file only once', function() {
      // process.env.KTOOL_CONFIG_K = 'dev';
      kconfig.resetReadTimes();
      kconfig.getConfig(true);
      expect(1).to.be.eql(kconfig.getConfig().__readTimes);
      expect(1).to.be.eql(kconfig.getConfig().__readTimes);
      expect(1).to.be.eql(kconfig.getConfig().__readTimes);
      expect(1).to.be.eql(kconfig.getConfig().__readTimes);
    });

    it('should read file force when isForce is true', function() {
      // process.env.KTOOL_CONFIG_K = 'dev';
      kconfig.resetReadTimes();
      expect(1).to.be.eql(kconfig.getConfig(true).__readTimes);
      expect(2).to.be.eql(kconfig.getConfig(true).__readTimes);
      expect(3).to.be.eql(kconfig.getConfig(true).__readTimes);
      expect(4).to.be.eql(kconfig.getConfig(true).__readTimes);
    });

    it('should read file once when multi require', function() {
      // process.env.KTOOL_CONFIG_K = 'dev';
      require('../lib/kconfig').resetReadTimes();
      require('../lib/kconfig').init(configFilePath + 'config.json', true);
      expect(1).to.be.eql(require('../lib/kconfig').init(configFilePath + 'config.json').__readTimes);
      expect(1).to.be.eql(require('../lib/kconfig').init(configFilePath + 'config.json').__readTimes);
      expect(2).to.be.eql(require('../lib/kconfig').init(configFilePath + 'config.json', true).__readTimes);
      expect(2).to.be.eql(require('../lib/kconfig').init(configFilePath + 'config.json').__readTimes);
    });
  });

});
