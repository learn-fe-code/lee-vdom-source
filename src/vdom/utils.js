/**
 * 
 * 一些帮助工具公共方法
 */

// 是否有key，
/**
 * 
 * @param {Object} config 虚拟dom树上的属性对象
 */
function hasValidKey(config) {
    config = config || {};
    return config.key !== undefined;
}
// 是否有ref，
/**
 * 
 * @param {Object} config 虚拟dom树上的属性对象
 */
function hasValidRef(config) {
    config = config || {};
    return config.ref !== undefined;
}

/**
 * 确定是children中的是文本节点
 * @param {*} value 
 */
function isPrimitive(value) {
    const type = typeof value;
    return type === 'number' || type === 'string'
}
/**
 * 判断arr是不是数组
 * @param {Array} arr 
 */
function isArray(arr){
    return Array.isArray(arr);
}

function isFun(fun) {
    return typeof fun === 'function';
}
/**
 * 判断是都是undefined* 
 *
 */
function isUndef(val) {
  return val === undefined;
}

export  {
    hasValidKey,
    hasValidRef,
    isPrimitive,
    isArray,
    isUndef
}