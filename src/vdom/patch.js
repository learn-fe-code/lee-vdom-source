// 不考虑hook

import htmlApi from './domUtils';
import {
    isArray, isPrimitive,isUndef
} from './utils';

import attr from './updataAttrUtils'

import VNode,{isVnode, isSameVnode} from './vnode'


/**
 * 从vdom生成真是dom *
 * @param {Object} vnode  虚拟dom
 * @returns 真是的dom
 */
function createElement(vnode) {
  let {sel,data,children,text,elm}  = vnode;
  // 如果没有选择器，则说ing这是一个文本节点
  if(isUndef(sel)){
    elm = vnode.elm = htmlApi.createTextNode(text);
  }else{
    elm = vnode.elm = analysisSel(sel);
    attr.initCreateAttr(vnode);
    // 如果存在子元素节点，递归子元素插入到elm中引用
    if (isArray(children)) {
      // analysisChildrenFun(children, elm);  
      children.forEach(c => {
        htmlApi.appendChild(elm, createElement(c))
      });
    } else if (isPrimitive(text)) {
      // 子元素是文本节点直接插入当前到vnode节点
      htmlApi.appendChild(elm, htmlApi.createTextNode(text));
    }
  }
  
 return vnode.elm;


}

/**
 * 用于挂载或者更新 DOM
 *
 * @param {*} container 
 * @param {*} vnode
 */
function patch(container, vnode) {
    let  elm, parent;
    // let insertedVnodeQueue = [];
    // 如果不是vnode，那么此时那此时以旧的 DOM 为模板构造一个空的 VNode。
    if (!isVnode(container)) {
      container = createEmptyNode(container);
    }
 // 如果 oldVnode 和 vnode 是同一个 vnode（相同的 key 和相同的选择器），
//  那么更新 oldVnode。
    if (isSameVnode(container, vnode)) {
      patchVnode(container, vnode)
    }else {
    // 新旧vnode不同，那么直接替换掉 oldVnode 对应的 DOM
      elm = container.elm;
      parent = htmlApi.parentNode(elm);
      createElement(vnode);
      if(parent !== null){
        // 如果老节点对应的dom父节点有并且有同级节点，
        // 那就在其同级节点之后插入 vnode 的对应 DOM。
        htmlApi.insertBefore(parent,vnode.elm,htmlApi.nextSibling(elm));
        // 在把 vnode 的对应 DOM 插入到 oldVnode 的父节点内后，移除 oldVnode 的对应 DOM，完成替换。
        removeVnodes(parent, [container], 0, 0);      
      }
    }   
};

/**
 *从parent dom删除vnode 数组对应的dom
 *
 * @param {Element} parentElm 父元素
 * @param {Array} vnodes  vnode数组
 * @param {Number} startIdx 要删除的对应的vnodes的开始索引
 * @param {Number} endIdx  要删除的对应的vnodes的结束索引
 */
function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
  for (; startIdx <= endIdx; ++startIdx) {
    let ch = vnodes[startIdx];
    if(ch){
      // if (ch.sel) {
      //   // 先不写事件、hook的处理

      // } else {
      //   htmlApi.removeChild(parentElm,ch.elm);
      // }
       htmlApi.removeChild(parentElm, ch.elm);
    }
  }
}
/**
 *将一个真是的dom节点转化成vnode
 * <div id="a" class="b c"></div> 转化为 
 * {sel:'div#a.b.c',data:{},children:[],text:undefined,
 * elm:<div id="a" class="b c"></div>}
 * @param {*} oldVnode
 */
function createEmptyNode(elm) {
  let id = elm.id ? '#' + elm.id : '';
  let c = elm.className ? '.'+ elm.className.split(' ').join('.'):'';
  return VNode(htmlApi.tagName(elm).toLowerCase() + id + c, {}, [], undefined, undefined, elm);
}
/**
 * 
 * 1、更新 本身对应的dom
 * 2、根据children的变化去确定是否递归 patch children里的每个vnode
 *
 * @param {Object} oldVnode 老 vnode
 * @param {Object} vnode 新 vnode
 * @param {*} insertedVnodeQueue 记录插入的 vnode
 * 
 */
function patchVnode(oldVnode, vnode) {

  // let elm = vnode.elm = oldVnode.elm,因为vnode没有被渲染，这时的vnode.elm是undefined，
  // 新把老的给它
  let elm = vnode.elm = oldVnode.elm,
  oldCh = oldVnode.children,newCh = vnode.children;
  // 如果两个vnode完全相同，直接返回
  if (oldVnode === vnode) return;
  if(!isUndef(vnode.data)){
    // 属性的比较更新
    attr.updateAttrs(oldVnode, vnode);
  }

// 新节点不是文本节点
  if (isUndef(vnode.text)) {
    if (oldCh && newCh && oldCh.length > 0 && newCh.length > 0) {
      // 新旧节点均存在 children，且不一样时，对 children 进行 diff
      updateChildren(elm, oldCh, newCh);
     
    } else if (newCh && newCh.length > 0) {
      //如果vnode有子节点，oldvnode没子节点
      //oldvnode是text节点，则将elm的text清除,因为children和text不同同时有值
      if (!oldVnode.text) htmlApi.setTextContent(elm, '');
      //并添加vnode的children 
      addVnodes(elm, null, newCh, 0, newCh.length - 1);

    } else if (oldCh && oldCh.length > 0) {
      // 新节点不存在 children 旧节点存在 children 移除旧节点的 children
      removeVnodes(elm, oldCh, 0, oldCh.length - 1)
    }
  }  //如果oldvnode的text和vnode的text不同，则更新为vnode的text
 else  if(oldVnode.text !== vnode.text) {
    htmlApi.setTextContent(elm, vnode.text);
  }
  
}
/**
 * 比较新旧 children 并更新
 *
 * @param {Element} parentDOMElement 父 dom，children 对应的 dom 将要挂载的
 * @param {Array} oldChildren    旧 children，vnode 数组
 * @param {Array} newChildren    新 children，vnode 数组
/**
 *
 *
 * @param {*} parentDOMElement
 * @param {*} oldChildren
 * @param {*} newChildren
 */
function updateChildren(parentDOMElement, oldChildren, newChildren) {
  // 两组数据 首尾双指针比较
  let oldStartIdx = 0,oldStartVnode = oldChildren[0]; 
  let oldEndIdx = oldChildren.length - 1,oldEndVnode = oldChildren[oldEndIdx];

  let newStartIdx = 0,newStartVnode = newChildren[0]; 
  let newEndIdx = newChildren.length - 1,newEndVnode = newChildren[newEndIdx];

  // `oldKeyToIdx` 来映射新节点的`key`在oldChildren中的索引
  let oldKeyToIdx;
  // 记录当前节点key的索引通过在 oldKeyToIdx对象属性查找
  let oldIdxByKeyMap;

  let elmToMove;

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    // 先排除 vnode为空 4 个 vnode 非空，
    // 左侧的 vnode 为空就右移下标，右侧的 vnode 为空就左移 下标
    if (oldStartVnode == null) {
      oldStartVnode = oldChildren[++oldStartIdx];
    } else if (oldEndVnode == null) {
      oldEndVnode = oldChildren[--oldEndIdx];
    } else if (newStartVnode == null) {
      newStartVnode = newChildren[++newStartIdx];
    } else if (newEndVnode == null) {
      newEndVnode = newChildren[--newEndIdx];
    }
    /** oldStartVnode/oldEndVnode/newStartVnode/newEndVnode 两两比较，
     * 1、 oldStartVnode - > newStartVnode
     * 2、 oldEndVnode - > newEndVnode
     * 3、 newEndVnode - > oldStartVnode
     * 4、 newStartVnode - > oldEndVnode
     * 
     * 对上述四种情况执行对应的patch
     */
    // 1、新的开始节点跟老的开始节点相比较 是不是一样的vnode
    // oldStartVnode - > newStartVnode 比如在尾部新增、删除节点
    // 
    else if (isSameVnode(oldStartVnode, newStartVnode)) {
       patch(oldStartVnode, newStartVnode);
       oldStartVnode = oldChildren[++oldStartIdx];
       newStartVnode = newChildren[++newStartIdx];
    } 
    // 2、oldEndVnode - > newEndVnode 比如在头部新增、删除节点
    else if (isSameVnode(oldEndVnode, newEndVnode)) {
        patch(oldEndVnode, newEndVnode);
        oldEndVnode = oldChildren[--oldEndIdx];
        newEndVnode = newChildren[--newEndIdx];
    }
    // 3、newEndVnode - > oldStartVnode 将头部节点移动到尾部
    else if (isSameVnode(oldStartVnode, newEndVnode)) {
      patch(oldStartVnode, newEndVnode);
      // 把旧的开始节点插入到末尾
      htmlApi.insertBefore(parentDOMElement, oldStartVnode.elm, htmlApi.nextSibling(oldEndVnode.elm));
      oldStartVnode = oldChildren[++oldStartIdx];
      newEndVnode = newChildren[--newEndIdx];
     
    }
    // 4、oldEndVnode  -> newStartVnode 将尾部移动到头部
    else if (isSameVnode(oldEndVnode, newStartVnode)) {
      patch(oldEndVnode,newStartVnode);
      // 将老的oldEndVnode移动到oldStartVnode的前边，
      htmlApi.insertBefore(parentDOMElement, oldEndVnode.elm, oldStartVnode.elm);
      oldEndVnode = oldChildren[--oldEndIdx];
      newStartVnode = newChildren[++newStartIdx];
    }
    /** 5、4种情况都不相等
     * // 1. 从 oldChildren 数组建立 key --> index 的 map。
     // 2. 只处理 newStartVnode （简化逻辑，有循环我们最终还是会处理到所有 vnode），
     //    以它的 key 从上面的 map 里拿到 index；
     // 3. 如果 index 存在，那么说明有对应的 old vnode，patch 就好了；
     // 4. 如果 index 不存在，那么说明 newStartVnode 是全新的 vnode，直接
     //    创建对应的 dom 并插入。
     */
    else{
      
      /** 如果 oldKeyToIdx 不存在，
       * 1、创建 old children 中 vnode 的 key 到 index 的
       * 映射， 方便我们之后通过 key 去拿下标
       *  */
       if (isUndef(oldKeyToIdx)) {
        oldKeyToIdx = createOldKeyToIdx(oldChildren,oldStartIdx,oldEndIdx);
       }
       // 2、尝试通过 newStartVnode 的 key 去拿下标
       oldIdxByKeyMap = oldKeyToIdx[newStartVnode.key];
      // 4、 下标索引不存在，说明newStartVnode 是全新的 vnode
       if (oldIdxByKeyMap == null) {
        // 那么为 newStartVnode 创建 dom 并插入到 oldStartVnode.elm 的前面。
        htmlApi.insertBefore(parentDOMElement,createElement(newStartVnode),oldStartVnode.elm);
        newStartVnode = newChildren[++newStartIdx];
       }
      //  3、下标存在 说明oldChildren中有相同key的vnode
       else{
        elmToMove = oldChildren[oldIdxByKeyMap];
        // key相同还要比较sel，sel不同，需要创建 新dom
        if (elmToMove.sel !== newStartVnode.sel) {
          htmlApi.insertBefore(parentDOMElement,createElement(newStartVnode),oldStartVnode.elm);
        }
        // sel相同，key也相同，说明是一样的vnode，需要打补丁patch
        else{
          patch(elmToMove,newStartVnode);
          oldChildren[oldIdxByKeyMap] = undefined;
          htmlApi.insertBefore(parentDOMElement,elmToMove.elm,oldStartVnode.elm);
        }
        newStartVnode = newChildren[++newStartIdx];
       }
    }

  }

 // 说明循环比较完后，新节点还有数据，这时候需要将这些虚拟节点的创建真是dom
// 新增引用到老的虚拟dom的`elm`上,且新增位置是老节点的oldStartVnode即末尾；
  if (newStartIdx <= newEndIdx) {
    let before = newChildren[newEndIdx + 1] == null ? null : newChildren[newEndIdx + 1].elm;
    addVnodes(parentDOMElement, before, newChildren, newStartIdx, newEndIdx);
  }

  if (oldStartIdx <= oldEndIdx) {
     // newChildren 已经全部处理完成，而 oldChildren 还有旧的节点，需要将多余的节点移除
     removeVnodes(parentDOMElement, oldChildren, oldStartIdx, oldEndIdx);
  }
}

/**
 * 为 vnode 数组 begin～ end 下标范围内的 vnode 
 * 创建它的 key 和 下标 的映射。
 *
 * @param {Array} children
 * @param {Number} startIdx
 * @param {Number} endIdx
 * @returns {Object}  key在children中所映射的index索引对象
 * children = [{key:'A'},{key:'B'},{key:'C'},{key:'D'},{key:'E'}];
 * startIdx = 1; endIdx = 3;
 * 函数返回{'B':1,'C':2,'D':3}
 */
function createOldKeyToIdx(children, startIdx, endIdx) {
  const map = {};
  let key;
  for (let i = startIdx; i <= endIdx; ++i) {
    let ch = children[i];
    if(ch != null){
      key = ch.key;
      if(!isUndef(key)) map[key] = i;
    }
  }
  return map;
}
/**
 *添加 vnodes 数组对应的 dom 到parentElm dom
 *
 * @param {Element} parentElm  父dom
 * @param {Element} before      添加到指定的 before dom 被参照的节点（即要插在该节点之前）
 * 当传入null时， 新插入的元素将会插入到父元素的子元素列表末尾。
 * @param {Array} vnodes        需要添加的vnode数组
 * @param {Number} startIdx     vnodes 开始索引
 * @param {Number} endIdx       vnodes  结束索引
 */
function addVnodes(parentElm,before,vnodes,startIdx,endIdx){
     for(;startIdx<=endIdx;++startIdx){
        const ch = vnodes[startIdx];
        if(ch != null){
          htmlApi.insertBefore(parentElm, createElement(ch), before);
        }
     }
}


/**
 * 解析sel 因为有可能是 div# divId.divClass - > id = "divId"
 class = "divClass"
 *
 * @param {String} sel
 * @returns {Element} 元素节点
 */
function analysisSel(sel){
  if(isUndef(sel)) return;
  let elm;
  let idx = sel.indexOf('#');
  let selLength = sel.length;
  let classIdx = sel.indexOf('.', idx);
  let idIndex = idx > 0 ? idx : selLength;
  let classIndex = classIdx > 0 ? classIdx : selLength;
  let tag = (idIndex != -1 || classIndex != -1) ? sel.slice(0, Math.min(idIndex, classIndex)) : sel;
  // 创建一个DOM节点 并且在虚拟dom上elm引用
  elm = htmlApi.createElement(tag);
  // 获取id #divId -> divId
  if (idIndex < classIndex) elm.id = sel.slice(idIndex + 1, classIndex);
  // 如果sel中有多个类名 如 .a.b.c -> a b c
  if (classIdx > 0) elm.className = sel.slice(classIndex + 1).replace(/\./g, ' ');
  return elm;
}
  // 如果存在子元素节点，递归子元素插入到elm中引用
function analysisChildrenFun(children, elm) {
   children.forEach(c => {
       htmlApi.appendChild(elm, createElement(c))
   });
}


export default patch;