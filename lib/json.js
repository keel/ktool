/*
可获取或设置多级的json对象或Object对象属性.
例:
const testObj = {
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


const getSubProp = function(target, subPropStr) {
  if (target === null || target === undefined) {
    return null;
  }
  if (!subPropStr) {
    return target;
  }
  const objPropArr = subPropStr.split('.');
  const objPropArrLen = objPropArr.length;
  let tempProp = target;
  for (let j = 0; j < objPropArrLen; j++) {
    // if (!tempProp.hasOwnProperty(objPropArr[j])) {
    if (!Object.prototype.hasOwnProperty.call(tempProp, objPropArr[j])) {
      //指定路径的属性不存在,直接返回
      return null;
    }
    tempProp = tempProp[objPropArr[j]];
  }
  return tempProp;
};


const subSet = function(targetObj, propArr, newVal, isOverWrite) {
  if (!targetObj || targetObj.constructor.name !== 'Object') {
    return;
  }
  if (propArr.length === 1) {
    targetObj[propArr[0]] = newVal;
    return;
  }
  const propName = propArr.shift();
  if (!Object.prototype.hasOwnProperty.call(targetObj, propName)) {
    if (isOverWrite === false) {
      return;
    }
    targetObj[propName] = {};
  }
  subSet(targetObj[propName], propArr, newVal, isOverWrite);
};

const setSubProp = function(target, subPropStr, newVal, isOverWrite) {
  const objPropArr = subPropStr.split('.');
  subSet(target, objPropArr, newVal, isOverWrite);
  return target;
};

exports.getSubProp = getSubProp;
exports.setSubProp = setSubProp;


