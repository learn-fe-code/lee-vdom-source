/** 处理属性
 * 1. class: 这里我们可以理解为动态的类名， sel上的类可以理解为静态的， 例如上面class: {
     active: true
 }
 我们可以通过控制这个变量来表示此元素是否是当前被点击
 2. style: 内联样式
 3. on: 绑定的事件类型
 4. dataset: data属性
 5. hook: 钩子函数
 6. 图片处理
 例子：
 vnode = h('div# divId.red', {
     '
     class': {
         '
         active': true
     },
     'style': {
         '
         background': '#fff'
     },
     'on': {
         '
         click': clickFn
     },
     'dataset': {
         '
         name': 'liuzj'
     },
     'hook': {
         '
         init': function () {
             console.log('init')
         },
         'create': function () {
             console.log('create')
         },
         'insert': function () {
             console.log('insert')
         },
         'prepatch': function () {
             console.log('beforePatch')
         },
         'update': function () {
             console.log('update')
         },
         'postpatch': function () {
             console.log('postPatch')
         },
         'destroy': function () {
             console.log('destroy')
         },
         'remove': function (ch, rm) {
             console.log('remove')
             rm();
         }
     }
 })

 
 */

import {
    isArray
} from './utils'

/**
 *更新style属性
 *
 * @param {Object} vnode 新的虚拟dom节点对象
 * @param {Object} oldStyle 
 * @returns
 */
function undateStyle(vnode, oldStyle = {}) {
    let doElement = vnode.elm;
    let newStyle = vnode.data.style || {};

    // 删除style
    for(let oldAttr in oldStyle){
        if (!newStyle[oldAttr]) {
            doElement.style[oldAttr] = '';
        }
    }

    for(let newAttr in newStyle){
        doElement.style[newAttr] = newStyle[newAttr];
    }
}
function filterKeys(obj) {
    return Object.keys(obj).filter(k => {
        return k !== 'style' && k !== 'id' && k !== 'class'
    })
}
/**
 *更新props属性
 * 支持 vnode 使用 props 来操作其它属性。
 * @param {Object} vnode 新的虚拟dom节点对象
 * @param {Object} oldProps 
 * @returns
 */
function undateProps(vnode, oldProps = {}) {
    let doElement = vnode.elm;
    let props = vnode.data.props || {};

    filterKeys(oldProps).forEach(key => {
        if (!props[key]) {
            delete doElement[key];
        }
     })

     filterKeys(props).forEach(key => {
         let old = oldProps[key];
         let cur = props[key];
         if (old !== cur && (key !== 'value' || doElement[key] !== cur)) {
            doElement[key] = cur;
         }
     })
}


/**
 *更新className属性 html 中的class
 * 支持 vnode 使用 props 来操作其它属性。
 * @param {Object} vnode 新的虚拟dom节点对象
 * @param {*} oldName 
 * @returns
 */
function updateClassName(vnode, oldName) {
    let doElement = vnode.elm;
    const newName = vnode.data.className;

    if (!oldName && !newName) return
    if (oldName === newName) return

    if (typeof newName === 'string' && newName) {
        doElement.className = newName.toString()
    } else if (isArray(newName)) {
        let oldList = [...doElement.classList];
        oldList.forEach(c => {
            if (!newName.indexOf(c)) {
                doElement.classList.remove(c);
            }
        })
        newName.forEach(v => {
            doElement.classList.add(v)
        })
    } else {
        // 所有不合法的值或者空值，都把 className 设为 ''
        doElement.className = ''
    }
}

function initCreateAttr(vnode) {
    updateClassName(vnode);
    undateProps(vnode);
    undateStyle(vnode);
}

function updateAttrs(oldVnode, vnode) {
    updateClassName(vnode, oldVnode.data.className);
    undateProps(vnode, oldVnode.data.props);
    undateStyle(vnode, oldVnode.data.style);
}

export const styleApis = {
    undateStyle,
    undateProps,
    updateClassName,
    initCreateAttr,
    updateAttrs
};
  export default styleApis;