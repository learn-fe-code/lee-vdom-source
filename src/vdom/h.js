/** 
 * h函数的主要工作就是把传入的参数封装为vnode
 */

import vnode from './vnode';
import {
  hasValidKey,
  isPrimitive, isArray
} from './utils'


const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * RESERVED_PROPS 要过滤的属性的字典对象
 * 在react源码中hasValidRef和hasValidKey方法用来校验config中是否存在ref和key属性，
 *  有的话就分别赋值给key和ref变量。 
 * 然后将config.__self和config.__source分别赋值给self和source变量， 如果不存在则为null。
 * 在本代码中先忽略掉ref、 __self、 __source这几个值
 */
const RESERVED_PROPS = {
  key: true,
  __self: true,
  __source: true
}
// 将原来的props通过for in循环重新添加到props对象中，
// 且过滤掉RESERVED_PROPS里边属性值为true的值
function getProps(data) {
  let props = {};
  const keys = Object.keys(data);
  if (keys.length == 0) {
    return data;
  }
  for (let propName in data) {
    if (hasOwnProperty.call(data, propName) && !RESERVED_PROPS[propName]) {
      props[propName] = data[propName]
    }
  }
  return props;
}

/**
 * 
 * @param {String} sel 选择器
 * @param {Object} data  属性对象
 * @param  {...any} children 子节点集合
 * @returns {{
   sel,
   data,
   children,
   key,
   text,
   elm}
 }
 */
function h(sel, data, children) {
  let props = {},c,text,key; 
  // 如果存在子节点 
  if (children !== undefined) {
    // // 那么h的第二个参数就是
    props = data;    
    if (isArray(children)) {
      c = children;
    } else if (isPrimitive(children)) {
      text = children;
    }
    // 如果children
  } else if(data != undefined){ // 如果没有children，data存在，我们认为是省略了属性部分，此时的data是子节点
    // 如果是数组那么存在子节点
    if (isArray(data)) {
      c = data;
    } else if (isPrimitive(data)) {
      text = data;
    }else {
      props = data;
    }
  }
  // 获取key
  key = hasValidKey(props) ? props.key : undefined;
  props = getProps(props);
  if(isArray(c)){
    c.map(child => {
      return isPrimitive(child) ? vnode(undefined, undefined, undefined, undefined, child) : child
    })    
  } 
  // 因为children也可能是一个深层的套了好几层h函数所以需要处理扁平化
  return vnode(sel, props, c, key,text,undefined);
}
export default h;