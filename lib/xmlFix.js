'use strict';

/**
 * 删除包含某个位置的单节点，注意仅仅是去除包含这个位置前后的尖括号及其之内的内容
 * @param  {string} xmlStr
 * @param  {int} postionInXml 目标位置
 * @return {string}
 */
const delHalfXmlNode = function delHalfXmlNode(xmlStr, postionInXml) {
  if (postionInXml < 0 || postionInXml > xmlStr.length - 1) {
    return xmlStr;
  }
  let startPo = 0;
  const endPo = xmlStr.indexOf('>', postionInXml);
  if (xmlStr[postionInXml] === '<') {
    startPo = postionInXml;
  } else {
    startPo = xmlStr.lastIndexOf('<', postionInXml);
  }
  const out = xmlStr.substring(0, startPo) + xmlStr.substring(endPo + 1);
  // console.log(out);
  return out;
};

/**
 * 处理xml解析时的xxe漏洞
 * @param  {string} xmlStr
 * @return {string}
 */
const fixXXE = function fixXXE(xmlStr) {
  const targets = ['<!DOCTYPE', '<!ENTITY'];
  let out = xmlStr;
  for (let i = targets.length - 1; i >= 0; i--) {
    out = delHalfXmlNode(xmlStr, xmlStr.indexOf(targets[i]));
  }
  return out;
};


exports.fixXXE = fixXXE;
exports.delHalfXmlNode = delHalfXmlNode;