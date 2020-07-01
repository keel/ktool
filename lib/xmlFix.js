'use strict';

//移除xml的CDATA转义标记
const removeCData = function(xmlNodeStr) {
  return xmlNodeStr.replace(/(<!\[CDATA\[)(.*)(]]>)/g, '$2');
};

//简单地获取xml节点内容string,注意不处理层级关系,不包含节点属性
const getXmlNode = function(xmlStr, nodeName) {
  let p1 = xmlStr.indexOf('<' + nodeName);
  if (p1 < 0) {
    return '';
  }
  p1 = p1 + nodeName.length + 2;
  const p2 = xmlStr.indexOf('</' + nodeName, p1);
  if (p2 < p1) {
    return '';
  }
  return xmlStr.substring(p1, p2);
};

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


exports.removeCData = removeCData;
exports.getXmlNode = getXmlNode;
exports.fixXXE = fixXXE;
exports.delHalfXmlNode = delHalfXmlNode;