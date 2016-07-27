'use strict';
var crypto = require('crypto');


var md5 = function(str) {
  var out = crypto.createHash('md5').update(str).digest('hex');
  return out;
};


var sha1 = function(str) {
  var out = crypto.createHash('sha1').update(str).digest('hex');
  return out;
};
exports.md5 = md5;
exports.sha1 = sha1;
