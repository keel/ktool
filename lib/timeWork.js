/*
定时任务处理器，仅支持单个任务，强烈建议一个定时任务一个进程，将不同定时任务分进程处理，示例见最后注释
 */
'use strict';
const ktool = require('./ktool');
const cck = require('cck');
const vlog = require('vlog').instance(__filename);

//次月的时间，如次月无此日期则为次月最后一天,注意输入毫秒数，输出date
const sameTimeNextMonth = function sameTimeNextMonth(thisTime) {
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

const sec_24Hour = 1000 * 60 * 60 * 24;
//明天的某个时间点
const nextDayWhen = function nextDayWhen(hour, minute, second, msSecond) {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + sec_24Hour);
  tomorrow.setHours(hour || 0, minute || 0, second || 0, msSecond || 0);
  return tomorrow;
};


const isMonthChanged = function(time1, time2) {
  const lastTime = new Date(time1);
  const nextTime = new Date(time2);
  if (lastTime.getMonth() !== nextTime.getMonth() || lastTime.getFullYear() !== nextTime.getFullYear()) {
    return true;
  }
  return false;
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
        callback(null, '' + out.nextDoTime + ',' + (out.lastDoTime || 0)); //如果返回 'nextDoTime(毫秒数),lastDoTime(毫秒数)'，则setNextDoTime也需要保存'nextDoTime(毫秒数),lastDoTime(毫秒数)'[但setNextDoTime的callback只能返回nextDoTime]
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
        const lastDoTime = out.lastDoTime;
        out.lastDoTime = now;
        out.workFn(lastDoTime, (err) => {
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
    if (options.lastDoTime) {
      out.lastDoTime = options.lastDoTime;
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
      out.lastDoTime = 0;
      if (!getNextDoTimeRe) {
        out.nextDoTime = 0; //如果初始nextDoTime未取到，则马上执行
      } else {
        const reArr = ('' + getNextDoTimeRe).split(',');
        out.nextDoTime = parseInt(reArr[0]);
        if (reArr.length > 1) {
          out.lastDoTime = parseInt(reArr[1]);
        }
      }
      vlog.log('===> timeWork[%s] started. at:[%j], nextDoTime:[%j], lastDoTime:[%j]', options.name || 'default', cck.msToTime(), cck.msToTime(out.nextDoTime), out.lastDoTime ? cck.msToTime(out.lastDoTime) : out.lastDoTime);
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
        const lastDoTime = out.lastDoTime;
        out.lastDoTime = now;
        out.workFn(lastDoTime, (err) => {
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

exports.nextDayWhen = nextDayWhen;
exports.isMonthChanged = isMonthChanged;
exports.sameTimeNextMonth = sameTimeNextMonth;
exports.timeRangeOfHour = timeRangeOfHour;
exports.create = create;

// const options = {
//   'name': 'test',
//   'sleep': 1000,
//   // 'nextDoTime': new Date().getTime() + 1000 * 5, //首次执行是否指定时间，如不定义此参数则立即执行
//   'setNextDoTime': function(thisTime, callback) { // 此参数为必须,callback返回下次执行时间,实际运用时需要将nextTime存入redis后返回
//     const nextTime = thisTime + 1000 * 5;
//     // redis.set('redisNextTimeKey','' + nextTime + ',' + thisTime);
//     callback(null, nextTime); //保存‘nextDoTime(毫秒数),lastDoTime(毫秒数)’，但callback只能返回nextDoTime
//   },
//   // 'getNextDoTime': function(callback) {
//   //   const nowTime = new Date().getTime();
//   //   const nextTime = nowTime + 5000;
//   //   //const nextTime = await redis.get('redisNextTimeKey');
//   //   callback(null, '' + nextTime + ',' + nowTime); //'nextDoTime(毫秒数),lastDoTime(毫秒数)'
//   //   // callback(null, nextTime); //仅返回nextDoTime
//   //   // callback(); //立即开始第1次workFn
//   // },
//   'workFn': function(lastDoTime, callback) { //实际work方法
//     console.log('TIMEWORK doing at:[%s], lastDoTime:[%s]', cck.msToTime(), (lastDoTime === 0) ? 0 : cck.msToTime(lastDoTime));
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