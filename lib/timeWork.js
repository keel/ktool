/*
与定时任务相关
 */
'use strict';
const ktool = require('./ktool');
const cck = require('cck');
const vlog = require('vlog').instance(__filename);

//次月的时间，如次月无此日期则为次月最后一天,注意输入毫秒数，输出date
const sameDayNextMonth = function sameDayNextMonth(thisTime) {
  const startDate = new Date(thisTime);
  // console.log('startDate', cck.msToTime(thisTime));
  const year = startDate.getFullYear();
  const month = startDate.getMonth();
  let nextDate = new Date(thisTime);
  nextDate.setMonth(startDate.getMonth() + 1);
  if (nextDate.getMonth() - month > 1) {
    // console.log('下月天数少--->', nextDate);
    nextDate = new Date(year, month + 2, 0);
  }
  return nextDate;
};

//每天按小时进行时间段控制,注意输入date，输出date
const timeRangeOfHour = function timeRangeOfHour(doingDate, startHour, endHour) {
  const h = doingDate.getHours();
  if (h < startHour) {
    doingDate.setHours(startHour);
  } else if (h > endHour) {
    doingDate.setHours(endHour);
  }
  return doingDate;
};


const create = function create(options) {
  if (!options || !options.setNextDoTime) {
    vlog.error('timeWork create失败! 无options或options.setNextDoTime!');
    return null;
  }
  const out = ktool.clone(options); //继承options的所有属性
  out.init = function(options) {
    if (!options.nextDoTime) {
      out.nextDoTime = 0;
    }
    if (!options.getNextDoTime) { //建议重新定义此参数，使用redis或其他持久层获取下次执行时间来保证进程重启后仍然可用，这里使用回调形式兼容持久层
      out.getNextDoTime = function(callback) {
        callback(null, out.nextDoTime); //nextDoTime需要返回毫秒数
      };
    }
    if (!options.sleep) {
      out.sleep = 1000 * 5; //默认的检查间隔为5秒
    }
    if (!options.workFn) {
      out.workFn = function(timeWorker, callback) {
        console.log('timeWork doing... at:', cck.msToTime());
        callback();
      };
    }
    out.isRun = true;
    out.check = function() {
      if (!out.isRun) {
        return null;
      }
      const now = new Date().getTime();
      if (now < out.nextDoTime) {
        return null;
      }
      return now;
    };
    out.realWorkFn = function() {
      const now = out.check();
      if (!now) {
        return;
      }
      out.setNextDoTime(now, (err, setNextDoTimeRe) => {
        if (err) {
          return vlog.eo(err, 'setNextDoTime');
        }
        out.nextDoTime = parseInt(setNextDoTimeRe);
        out.workFn((err) => {
          if (err) {
            return vlog.eo(err, 'workFn');
          }
        });
      });
    };
  };

  out.updateOptions = function(options) {
    out.isRun = false;
    if (options.nextDoTime) {
      out.nextDoTime = options.nextDoTime;
    }
    if (options.getNextDoTime) {
      out.getNextDoTime = options.getNextDoTime;
    }
    if (options.sleep) {
      out.sleep = options.sleep;
    }
    if (options.workFn) {
      out.workFn = options.workFn;
    }
    if (options.setNextDoTime) {
      out.setNextDoTime = options.setNextDoTime;
    }
    out.isRun = true;
  };


  out.init(options);

  out.start = function() {
    out.getNextDoTime((err, getNextDoTimeRe) => {
      if (err) {
        return vlog.eo(err, 'getNextDoTime');
      }
      if (!getNextDoTimeRe) {
        out.nextDoTime = 0; //如果初始nextDoTime未取到，则马上执行
      } else {
        out.nextDoTime = parseInt(getNextDoTimeRe);
      }
      vlog.log('===> timeWork[%s] started...', options.name || 'default');
      const now = out.check(); //是否start后立即执行
      if (!now) {
        setInterval(out.realWorkFn, out.sleep);
        return;
      }
      //首次执行结束后再setInterval
      out.setNextDoTime(now, (err, setNextDoTimeRe) => {
        if (err) {
          return vlog.eo(err, 'setNextDoTime');
        }
        out.nextDoTime = parseInt(setNextDoTimeRe);
        out.workFn((err) => {
          if (err) {
            return vlog.eo(err, 'workFn');
          }
          setInterval(out.realWorkFn, out.sleep);
        });
      });
    });
    return out;
  };

  return out;
};

exports.sameDayNextMonth = sameDayNextMonth;
exports.timeRangeOfHour = timeRangeOfHour;
exports.create = create;

// const options = {
//   'name': 'test',
//   'sleep': 1000,
//   'setNextDoTime': function(thisTime, callback) {  // 此参数必须
//     callback(null, thisTime + 1000 * 5);
//   },
//   'workFn': function(callback) { //实际work方法
//     console.log('TIMEWORK doing at:', cck.msToTime());
//     callback();
//   }
// };
// const tw = create(options).start();

// setTimeout(function() {
//   tw.isRun = false;
//   console.log('--> set isRun false');
// }, 1000 * 20);

// setTimeout(function() {
//   tw.isRun = true;
//   console.log('--> set isRun true');
// }, 1000 * 30);