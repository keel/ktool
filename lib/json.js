/*
可获取或设置多级的json对象或Object对象属性.
例:
var testObj = {
  'top': {
    'product': {
      'productId': 'p1'
    },
    'other': 'sss'
  }
};
console.log('getSubProp:%j',getSubProp(testObj,'top.product.productId'));
console.log('getSubProp:%j',getSubProp(testObj,'top.product.xxx'));
console.log('setSubProp:%j', setSubProp(testObj, 'top.product.productId', 'xxxp1'));
console.log('setSubProp:%j', setSubProp(testObj, 'top2.product.productId', 'xxxp1'));
console.log('setSubProp:%j', setSubProp(testObj, 'top3.product.productId', 'xxxp1',false));
 */

'use strict';

var getSubProp = function(target, subPropStr) {
  if (target === null || target === undefined) {
    return null;
  }
  var objPropArr = subPropStr.split('\.');
  var objPropArrLen = objPropArr.length;
  var tempProp = target;
  for (var j = 0; j < objPropArrLen; j++) {
    if (!tempProp.hasOwnProperty(objPropArr[j])) {
      //指定路径的属性不存在,直接返回
      return null;
    }
    tempProp = tempProp[objPropArr[j]];
  }
  return tempProp;
};


var subSet = function(targetObj, propArr, newVal, isOverWrite) {
  if (!targetObj || targetObj.constructor.name !== 'Object') {
    return;
  }
  if (propArr.length === 1) {
    targetObj[propArr[0]] = newVal;
    return;
  }
  var propName = propArr.shift();
  if (!targetObj.hasOwnProperty(propName)) {
    if (isOverWrite === false) {
      return;
    }
    targetObj[propName] = {};
  }
  subSet(targetObj[propName], propArr, newVal, isOverWrite);
};

var setSubProp = function(target, subPropStr, newVal, isOverWrite) {
  var objPropArr = subPropStr.split('\.');
  subSet(target, objPropArr, newVal, isOverWrite);
  return target;
};

exports.getSubProp = getSubProp;
exports.setSubProp = setSubProp;



