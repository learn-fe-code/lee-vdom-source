// 通过 symbol 保证唯一性，用于检测是不是 vnode
const VNODE_TYPE = Symbol('virtual-node')

/**
   * @param {String} sel 'div' 标签名  可以是元素的选择器 可参考jq
   * @param {Object} data {'style': {background:'red'}} 对应的Vnode绑定的数据
   属性集 包括attribute、 eventlistener、 props， style、hook等等 
   * @param {Array} children [ h(), 'text'] 子元素集
   * @param {String} text当前的text 文本 itemA
   * @param {Element} elm 对应的真是的dom 元素的引用
   * @param { String}  key 唯一 而且需要一一对应 用于不同vnode之前的比对
   * 主要是用在需要循环渲染的dom元素在进行diff运算时的优化算法
   * @return {Object}  vnode  
   */

function vnode(sel, data = {}, children, key, text, elm) {
    return {
        _type: VNODE_TYPE,
        sel,
        data,
        children,
        key,
        text,
        elm
    }
}
/**
 * 检查两个 vnode 是不是同一个： key 相同且 type 相同
 *
 * @param {Object} oldVnode
 * @param {Object} newVnode
 * @returns {Boolean}  是则 true，否则 false
 */
function isSameVnode(oldVnode,newVnode){
    return oldVnode.sel === newVnode.sel && oldVnode.key === newVnode.key;
}
/** 
 * 校验是不是 vnode， 主要检查 __type。
 * @param  {Object}  vnode 要检查的对象
 * @return {Boolean}       是则 true，否则 false
*/
function isVnode(vnode){
   return vnode && vnode._type === VNODE_TYPE
}
export default vnode;
export {
    isSameVnode,
    isVnode
}