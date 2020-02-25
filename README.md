# lee-vdom-source
实现虚拟dom、dom-diff具体原理和方法
# 1、如果要我们自己去实现一个虚拟dom，可根据snabbdom.js库实现过程的以下三个核心问题处理： 

- compile，如何把真实DOM编译成vnode虚拟节点对象。（通过h函数）
- diff，通过算法，我们要如何知道oldVnode和newVnode之间有什么变化。（内部diff算法） 
- patch， 如果把这些变化用打补丁的方式更新到真实dom上去。

###### 使用snabbdom代码分析：*

h函数是构建虚拟dom，跟react中的createElement函数(createElement函数方法中第一个参数我们可能直接看到的是jsx语法（*jsx讲解部分：9.2*）），需要通过babel转化）跟h函数类似功能，以及vue中的render方法中的createElement函数。

h 函数接受是三个参数，分别代表是 DOM 元素的`标签名、属性、子节点`，最终返回一个虚拟 DOM 的对象；



patch函数分为两个阶段：

- 第一次执行是新数据第一次更新到dom中，虚拟dom的第一次渲染递的两个参数分别是放真实DOM的container和生成的vnode，此时patch函数的作用是用来将初次生成的真实DOM结构替换指定的container上面。
- 第二次是dom修改了，通过h函数先生成修改后的新的虚拟dom，通过新旧虚拟dom的diff算法比较返回一个 patches （补丁）在将这个补丁更新到真是dom中。patch函数的参数：如果第一个参数为node，则把node替换成vnode的结构；如果第一个参数为vnode，则**对比差异**后把 旧vnode 更新 为新vnode。diff算法是核心。

## 2、 虚拟dom整个原理实现流程：

- 1、根据需要的真是dom树，用JavaScript模拟dom节点，再用方法（h函数）生成虚拟节点
- 2、首次时渲染虚拟节点到指定的dom
- 3、如果有事件发生修改了虚拟dom，生成新的虚拟dom
- 4、通过diff算法，比较新旧虚拟dom节点是否有改变，
- 5、如果有改变，将这个改变的差异值即这个差异对象，渲染到真实dom树

## 3、模拟vdom的实现

我们在这边重新创建一个项目来实现，为了启动服务使用webpack来进行打包，webpack-dev-server启动.

#### 3.1 搭建开发环境，初始化项目

第一步：创建空文件夹lee-vdom,在初始化项目：`npm init -y`  ,如果你让上传git最好创建一个忽略文件来把忽略一些不必要的文件.ignore

第二步：安装依赖包

```
npm i webpack webpack-cli webpack-dev-server -D
```

第三步：配置package.json中scripts部分

```json
"scripts": {   
    "build": "webpack --mode=development",
    "dev": "webpack-dev-server --mode=development --contentBase=./dist"
  },
```

第四步：在项目根目录下新建一个src目录，在src目录下新建一个index.js文件（ps：webpack默认入口文件为src目录下的index.js,默认输出目录为项目根目录下的dist目录）

我们可以在index.js中输入测试文件输出

```javascript
console.log("测试vdom src/index.js")
```

第五步: 执行`npm run build` 打包输出，此时我们查看项目，会发现在根目录下生成一个dist目录，并在dist目录下打包输出了一个main.js,然后我们在dist目录下，新建一个index.html,器引入打包输出的main.js

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>vdom dom-diff</title>
</head>
<body>
    <div id="app"></div>
    <script src="./main.js"></script>
</body>
</html>
```

第六步：执行`npm run dev` 启动项目，然后在浏览器中输入http://localhost:8080 ,发现浏览器的控制台输出了 `测试vdom src/index.js` ,表示项目初始化成功。

#### 3.2 实现虚拟dom

我们根据上述2.3.1 的代码发现核心api：h函数和patch函数，本小节主要内容是：手写一般可以生成虚拟节点的h函数，和第一次渲染的patch函数。

回忆代码：如之前的图2.2.1

![2.2.1](C:\Users\lee\Desktop\vdom\2.2.1.png)

（图2.2.1）



（图3.2.1）

```
h('<标签名>',{...属性...},[...子元素...]) //生成vdom节点的
h('<标签名>',{...属性...},'文本结点')
patch(container,vnode) //render //打补丁渲染dom的
```

##### 第一步：新增src\vdom\index.js统一导出

我们将这些方法都写入到src下的vdom目录中，在通过src\vdom\index.js统一导出。

```
import h from './h';

// 统一对外暴露的虚拟dom实现的出口
export  {
    h
}
```

##### 第二步：创建src\vdom\h.js 

![3.2.1](C:\Users\lee\Desktop\vdom\3.2.1.png)

- 创建h函数方法，返回的是如图3.2.1的虚拟dom对象，
- 传入的参数`h('<标签名>',{...属性...},[...子元素...]) `//生成vdom节点的
  `h('<标签名>',{...属性...},'文本结点')`
- 需要注意要从属性中分离key，它是唯一值，没有的时候undefined

从图3.2.1中我们可以通过h函数方法，返回的虚拟dom对象的参数大概有：

`sel,data,children,key,text,elm`

h.js初步代码：

```javascript
import vnode from './vnode';
/**
   * @param {String} sel 'div' 标签名  可以是元素的选择器 可参考jq
   * @param {Object} data {'style': {background:'red'}} 对应的Vnode绑定的数据
   属性集 包括attribute、 eventlistener、 props， style、hook等等 
   * @param {Array} children [ h(), 'text'] 子元素集
   *  text当前的text 文本 itemA
   *  elm 对应的真是的dom 元素的引用
   *  key  唯一 用于不同vnode之前的比对
   */


function h(sel, data, ...children) {
    return vnode(sel,data,children,key,text,elm);
}
export default h;
```



##### 第三步：创建 src\vdom\vnode.js 

```javascript
// 通过 symbol 保证唯一性，用于检测是不是 vnode
const VNODE_TYPE = Symbol('virtual-node')

/**
   * @param {String} sel 'div' 标签名  可以是元素的选择器 可参考jq
   * @param {Object} data {'style': {background:'red'}} 对应的Vnode绑定的数据
   属性集 包括attribute、 eventlistener、 props， style、hook等等 
   * @param {Array} children [ h(), 'text'] 子元素集
   * @param {String} text当前的text 文本 itemA
   * @param {Element} elm 对应的真是的dom 元素的引用
   * @param {String} key  唯一 用于不同vnode之前的比对
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
export default vnode;
```

**ps：代码理解注意：**

1、构造vnode时内置的_type,值为symbol（9.3）.时利用 symbol 的唯一性来校验 vnode ，判断是不是虚拟节点的一个依据。

2、vnode的children/text 不可共存，例如：但是我们在写的时候还是`h('li',{},'itemeA')`，我们知道这个子节点itemA是作为`children`传给h函数的，但是它是文本节点`text`, 这是为什么呢？其实这只是为了方便处理，text 节点和其它类型的节点处理起来差异很大。 `h('p',123) —> <p>123</p> ` 如:`h('p,[h('h1',123),'222']) —> <p><h1>123</h1>222</p> `

- 可以这样理解，有了 text 代表该 vnode 其实是 VTextNode，仅仅是 snabbdom 没有对 vnode 区分而已。
- `elm` 用于保存 vnode 对应 DOM 节点。

##### 第四步: 完善h.js

```javascript
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
```



增加帮助js，src\vdom\utils.js

```javascript
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
```



##### 第五步：初步渲染

 增加patch，src\vdom\patch.js

```javascript
// 不考虑hook

import htmlApi from './domUtils';
import {
    isArray, isPrimitive,isUndef
} from './utils';

// 从vdom生成真是dom
function createElement(vnode) {
  let {sel,data,children,text,elm}  = vnode;
  // 如果没有选择器，则说ing这是一个文本节点
  if(isUndef(sel)){
    elm = vnode.elm = htmlApi.createTextNode(text);
  }else{
    elm = vnode.elm = analysisSel(sel);
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
function patch(container, vnode) {
    console.log(container, vnode);
    let elm = createElement( vnode);
    console.log(elm);
    container.appendChild(elm);
};

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
```

我们可以看到增加了一些关于dom操作的方法src\vdom\domUtils.js

```javascript
/** DOM 操作的方法
 * 元素/节点 的 创建、删除、判断等
 */

 function createElement(tagName){
    return document.createElement(tagName);
 }

 function createTextNode(text) {
     return document.createTextNode(text);
 }
function appendChild(node, child) {
    node.appendChild(child)
}
function isElement(node) {
    return node.nodeType === 1
}

function isText(node) {
    return node.nodeType === 3
}

export const htmlApi = {
    createElement,
    createTextNode,
    appendChild
}
 export default htmlApi;
```



##### 第六步：我们来一段测试看看：

src\index.js

```javascript
import { h,patch } from './vdom';
  //  h函数返回虚拟节点
  let vnode = h('ul#list', {}, [
      h('li.item', {}, 'itemA'),
      h('li.item', {}, 'itemB')
  ]);
  let container = document.getElementById('app');
  patch(container, vnode);
  console.log('自己写的h函数返回虚拟dom为', vnode);
```



![3.2.2](C:\Users\lee\Desktop\vdom\3.2.2.png)

（图3.2.2）

如图3.2.2，说明初步渲染成功了。

##### 第七步：处理属性

之前的代码createElement函数中我们看到没有对h函数的data属性处理，因为比较复杂，我们来先看看snabbdom中的data参数都是怎么处理的。

*主要包括几类的处理：*

1. class:这里我们可以理解为动态的类名，sel上的类可以理解为静态的，例如上面class:{active:true}我们可以通过控制这个变量来表示此元素是否是当前被点击
2. style:内联样式
3. on:绑定的事件类型
4. dataset:data属性
5. hook:钩子函数
6. 图片处理

**例子：**

```javascript
vnode = h('div#divId.red', {
    'class': {
        'active': true
    },
    'style': {
        'color': 'red'
    },
    'on': {
        'click': clickFn
    }    
}, [h('p', {}, '文本内容')])
function clickFn() {
    console.log(click')
}
vnode = patch(app, vnode);
```

新建：src\vdom\updataAttrUtils

```javascript
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
export const styleApis = {
    undateStyle,
    undateProps,
    updateClassName,
    initCreateAttr
};
  export default styleApis;
```

在patch.js中增加方法：

```
......
import attr from './updataAttrUtils'
function createElement(vnode) {
 ....
  attr.initCreateAttr(vnode); 
 ....
}
.....
```

在src\index.js增加测试代码：

```javascript
import { h,patch } from './vdom';
  //  h函数返回虚拟节点
  let vnode = h('ul#list', {}, [
      h('li.item', {style:{'color':'red'}}, 'itemA'),
      h('li.item.c1', {
        className:['c1','c2']
      }, 'itemB'),
      h('input', {
            props: {
              type: 'radio',
              name: 'test',
              value: '0',
              className:'inputClass'
        }  })
  ]);
  let container = document.getElementById('app');
  patch(container, vnode);
```

![3.3.1](C:\Users\lee\Desktop\vdom\3.3.1.png)

（图3.3.1）

## 4、diff算法实现流程原理

> diff是来比较差异的算法

### 4.1 什么是diff算法

是用来对比差异的算法，有 linux命令 `diff`（我们dos命令中执行diff 两个文件可以比较出两个文件的不同）、git命令`git diff`、可视化diff(github、gitlab...)等各种实现。

### 4.2 vdom为何用diff算法

我们上边使用snabbdom.js的案例中，patch(vnode,newVnode)就是通过这个diff算法来判断是否有改变两个虚拟dom之间，没有就不用再渲染到真实dom树上了，节约了性能。

vdom使用diff算法是为了找出需要更新的节点。vdom使用diff算法来比对两个虚拟dom的差异，以最小的代价比对2颗树的差异，在前一个颗树的基础上生成最小操作树，但是这个算法的时间复杂度为n的三次方=O(n*n*n)，当树的节点较多时，这个算法的时间代价会导致算法几乎无法工作。

### 4.3 diff算法的实现规则

diff算法是差异计算，记录差异 

#### 4.3.1、同级节点的比较，不能跨级

（网上找的图），如下图

![2.2.3](C:\Users\lee\Desktop\vdom\2.2.3.png)

（图4.3.1）

#### 4.3.2、先序深度优化、广度优先：

1、深度优先

![2.2.4](C:\Users\lee\Desktop\vdom\2.2.4.png)



（图4.3.2）

2、广度优先

 从某个顶点出发，首先访问这个顶点，然后找出这个结点的所有未被访问的邻接点，访问完后再访问这些结点中第一个邻接点的所有结点，重复此方法，直到所有结点都被访问完为止。 

### 4.4、 snabbdom和vue中dom-diff实现原理流程（重点！！！）

4.4.1、在比较之前我们发现snabbdom中是用patch同一个函数来操作的，所以我们需要判断。第一个参数传的是虚拟dom还是 HTML 元素 。

4.4.2、再看源码的时候发现snabbdom中将html元素转换为了虚拟dom在继续操作的。这是为了方便后面的更新，更新完毕后在进行挂载。

4.4.3、通过方法来判断是否是同一个节点

方法：比较新节点（newVnode）和（oldVnode）的`sel`（其他的库中可能叫`type`） key两个属性是否相等，不定义key值也没关系，因为不定义则为undefined,而undefined===undefined，如果不同（比如sel从`ul`改变为了`p`），直接用通过newVnode的dom元素替换oldVnodedom元素，因为4.3.1中介绍的一样，dom-diff是按照层级分解树的，只有同级别比较,不会跨层移动vnode。不会在比较他们的children。如果不同再具体去比较其差异性，在旧的vnode上进行’打补丁’ 。

![4.4.3](C:\Users\lee\Desktop\vdom\4.4.3.png)

(图4.4.3)

ps:其实 在用vue的时候，在没有用v-for渲染的组件的条件下，是不需要定义key值的，也不会影响其比较。

4.4.4、data 属性更新

循环老的节点的data，属性，如果跟新节点data不存在就删除，最后在都新增加到老的节点的elm上；

需要特殊处理style、class、props，其中需要排除key\id,因为会用key来进行diff比较，没有key的时候会用id,都有当前索引。

代码实现可查看----》5.2

4.4.5、**children比较（最核心重点）**

4.4.5.1、新节点的children是文本节点且oldvnode的text和vnode的text不同，则更新为vnode的text 

4.4.5.2、判断双方是只有一方有children，

   i 、如果老节点有children，新的没有，老节点children直接都删除

   ii、如果老节点的children没有，新的节点的children有，直接创建新的节点的children的dom引用到老的节点children上。  

4.4.5.3、 将旧新vnode分别放入两个数组比较（最难点）

**以下为了方便理解我们将新老节点两个数组来说明，实现流程。 用的是双指针的方法，头尾同时开始扫描；** 

 **重复下面的五种情况的对比过程，直到两个数组中任一数组的头指针（开始的索引）超过尾指针（结束索引），循环结束 :** 

oldStartIdx：老节点的数组开始索引，

oldEndIdx：老节点的数组结束索引，

newStartIdx：新节点的数组开始索引

newEndIdx：新节点的数组结束索引



oldStartVnode：老的开始节点

oldEndVnode：老的结束节点

newStartVnode：新的开始节点

newEndVnode：新的结束节点



 循环两个数组，循环条件为（oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx） 

![4.4.5.1](C:\Users\lee\Desktop\vdom\4.4.5.1.png)

(图4.4.5.1)

**首尾比较的状况**

```javascript
1、 头头对比：oldStartVnode - > newStartVnode
2、 尾尾对比：oldEndVnode - > newEndVnode
3、 老尾与新头对比： oldEndVnode- > newStartVnode
4、 老头与新尾对比：oldStartVnode- > newEndVnode
5、 利用key对比
```

情况1: 头头对比：

判断oldStartVnode、newStartVnode是否是同一个vnode： 一样：patch(oldStartVnode,newChildren[newStartIdx]);

++oldStartIdx,++oldStartIdx ，

oldStartVnode =  oldChildren[oldStartIdx]、newStartVnode = newChildren[oldStartIdx ]；

**针对一些dom的操作进行了优化**：在尾部增加或者减少了节点；

例子1：节点：`ABCD =>ABCDE`    `ABCD  => ABC`     

开始时：

```javascript
oldChildren:['A','B','C','D']
oldStartIdx:0
oldStartVnode: A虚拟dom
oldEndIdx:3
oldEndVnode:D虚拟dom
newChildren:['A','B','C','D','E']
newStartIdx:0
newStartVnode:A虚拟dom
newEndIdx:4
newEndVnode:E虚拟dom
```



![4.4.5.2](C:\Users\lee\Desktop\vdom\4.4.5.2.png)

（图4.4.5.2）

比较过后，

```javascript
oldChildren:['A','B','C','D']
oldStartIdx:4
oldStartVnode: undefined
oldEndIdx:3
oldEndVnode:D虚拟dom
newChildren:['A','B','C','D','E']
newStartIdx:4
newStartVnode:D虚拟dom
newEndIdx:4
newEndVnode:E虚拟dom
```

 `newStartIndex <= newEndIndex` ：说明循环比较完后，新节点还有数据，这时候需要将这些虚拟节点的创建真是dom新增引用到老的虚拟dom的`elm`上,且新增位置是老节点的oldStartVnode即末尾；

`newStartIndex > newEndIndex` ：说明newChildren已经全部比较了，不需要处理；

`oldStartIdx>oldEndIdx`: 说明oldChildren已经全部比较了，不需要处理；

`oldStartIdx <= oldEndIdx`  :说明循环比较完后，老节点还有数据，这时候需要将这些虚拟节点的真是dom删除；

------------------------------------代码的具体实现可查看5.3.3

情况2：尾尾对比：

判断oldEndVnode、newEndVnode是否是同一个vnode：

一样：patch(oldEndVnode、newEndVnode)；

--oldEndIdx，--newEndIdx；

oldEndVnode =  oldChildren[oldEndIdx]；newEndVnode =  newChildren[newEndIdx]，

**针对一些dom的操作进行了优化**：在头部增加或者减少了节点；

例子2：节点：`ABCD =>EFABCD`    `ABCD  => BCD`     

开始时：

```javascript
oldChildren:['A','B','C','D']
oldStartIdx:0
oldStartVnode: A虚拟dom
oldEndIdx:3
oldEndVnode:D虚拟dom
newChildren:['E','A','B','C','D']
newStartIdx:0
newStartVnode:E虚拟dom
newEndIdx:4
newEndVnode:D虚拟dom
```

![4.4.5.3](C:\Users\lee\Desktop\vdom\4.4.5.3.png)

（图4.4.5.3）

比较过后，

```javascript
oldChildren:['A','B','C','D']
oldStartIdx:0
oldStartVnode: A虚拟dom
oldEndIdx:-1
oldEndVnode: undefined
newChildren:['E','A','B','C','D']
newStartIdx:0
newStartVnode:E虚拟dom
newEndIdx:1
newEndVnode:A虚拟dom
```



情况3、老尾与新头对比：

判断oldStartVnode跟newEndVnode比较vnode是否相同：

一样：patch(oldStartVnode、newEndVnode)；

将老的oldStartVnode移动到newEndVnode的后边，

++oldStartIdx ；

--newEndIdx；

oldStartVnode = oldChildren[oldStartIdx] ；

newEndVnode =  newChildren[newEndIdx];

**针对一些dom的操作进行了优化：**在头部增加或者减少了节点；

例子3：节点：`ABCD => BCDA`      

开始时：

```javascript
oldChildren:['A','B','C','D']
oldStartIdx:0
oldStartVnode: A虚拟dom
oldEndIdx:3
oldEndVnode:D虚拟dom
newChildren:['B','C','D','A']
newStartIdx:0
newStartVnode:B虚拟dom
newEndIdx:3
newEndVnode:A虚拟dom
```

![4.4.5.4](C:\Users\lee\Desktop\vdom\4.4.5.4.png)

（图4.4.5.4）

```
['A','B','C','D']  -> ['B','C','D','A']
1：老[0] -> 新[0] 不等 
2: 老[3] -> 新[3] 不等  
3：老[0] -> 新[3] 相等  
 移动老[0].elm到老[3].elm后
++oldStartIdx;--newEndIdx;移动索引指针来比较
以下都按照情况一来比较了
4: 老[1] -> 新[0] 相等，
5：老[2] -> 新[1] 相等
6：老[3] -> 新[2] 相等
```

比较过后，

```javascript
oldChildren:['A','B','C','D']
oldStartIdx:4
oldStartVnode: undefined
oldEndIdx:3
oldEndVnode:D虚拟dom
newChildren:['B','C','D','A']
newStartIdx:3
newStartVnode:A虚拟dom
newEndIdx:2
newEndVnode:D虚拟dom
```



情况4、老头与新尾对比

将老的结束节点oldEndVnode 跟新的开始节点newStartVnode 比较，vnode是否一样，一样：

patch(oldEndVnode 、newStartVnode )；

将老的oldEndVnode移动到oldStartVnode的前边，

++newStartIdx；

--oldEndIdx；

oldEndVnode= oldChildren[oldStartIdx] ；

newStartVnode =  newChildren[newStartIdx];

**针对一些dom的操作进行了优化：**在尾部部节点移动头部；

例子4：节点：`ABCD => DABC`      

开始时：

```javascript
oldChildren:['A','B','C','D']
oldStartIdx:0
oldStartVnode: A虚拟dom
oldEndIdx:3
oldEndVnode:D虚拟dom
newChildren:['D','A','B','C']
newStartIdx:0
newStartVnode:B虚拟dom
newEndIdx:3
newEndVnode:A虚拟dom
```

过程：

![4.4.5.5](C:\Users\lee\Desktop\vdom\4.4.5.5.png)

(图4.4.5.5)

```javascript
['A','B','C','D']  -> ['D','A','B','C']
1：老[0] -> 新[0] 不等 
2: 老[3] -> 新[3] 不等
3：老[0] -> 新[3] 不等
4: 老[3] -> 新[0] 相等， 移动老[3].elm到老[0].elm前
++newStartIdx;--oldEndIdx;移动索引指针来比较
以下都按照情况一来比较了
5：老[2] -> 新[3] 相等
6：老[1] -> 新[2] 相等
7：老[0] -> 新[1] 相等
```

比较过后，

```javascript
oldChildren:['A','B','C','D']
oldStartIdx:3
oldStartVnode: D虚拟dom
oldEndIdx:2
oldEndVnode:C虚拟dom
newChildren:['B','C','D','A']
newStartIdx:4
newStartVnode: undefined
newEndIdx:3
newEndVnode:A虚拟dom
```



情况5、利用key对比

`oldKeyToIdx`：oldChildren中key及相对应的索引的map

```javascript
 oldChildren = [{key:'A'},{key:'B'},{key:'C'},{key:'D'},{key:'E'}];

oldKeyToIdx = {'A':0,'B':1,'C':2,'D':3,'E':4}
```

此时用  是老的key在oldChildren的索引map，来映射新节点的`key`在oldChildren中的索引map，通过方法创建，有助于之后通过 `key` 去拿下标 。

实现原理流程：

1、  `oldKeyToIdx`没有我们需要新创建

2、 保存`newStartVnode.key` 在 `oldKeyToIdx` 中的索引

3、 这个索引存在，新开始节点在老节点中有这个key，在判断`sel`也跟这个oldChildren[oldIdxByKeyMap]相等说明是相似的vnode，patch,将这个老节点赋值为undefined，移动这个oldChildren[oldIdxByKeyMap].elm到oldStartVnode之前

4、  这个索引不存在，那么说明 newStartVnode 是全新的 vnode，直接 创建对应的 dom 并插入  oldStartVnode.elm之前

++newStartIdx;

newStartVnode  = newChildren[newStartIdx];

案例说明：

可能的原因有

 1、此时的节点（需要比较的新节点）时新创建的，

 2、当前节点（需要比较的新节点）在原来的位置是处于中间的（oldStartIdx 和 oldEndIdx之间） 

例子5：`ABCD -> EBADF`

```javascript
oldChildren:['A','B','C','D']
oldStartIdx:0
oldStartVnode: A虚拟dom
oldEndIdx:3
oldEndVnode:D虚拟dom
newChildren:['E','B','A','D','F']
newStartIdx:0
newStartVnode:E虚拟dom
newEndIdx:4
newEndVnode:D虚拟dom
```

比较过程

1、

![4.4.5.6-1](C:\Users\lee\Desktop\vdom\4.4.5.6-1.png)

(图4.4.5.6-1)

解释：

```
、、、前面四种首尾双指针比较都不等时，、、、
创建了一个map：oldKeyToIdx= {'A':0,'B':1,'C':2,'D':3}
此时的newStartVnode.key是E 在oldKeyToIdx不存在，
说明E是需要创建的新节点，
则执行创建真是DOM的方法创建，然后这个DOM插入到oldEndVnode.elm之前；
newStartVnode = newChildren[++newStartIdx] ->即B
```

2、

![4.4.5.6-2](C:\Users\lee\Desktop\vdom\4.4.5.6-2.png)

（图4.4.5.6-2）

解释：

```
、、、前面四种首尾双指针比较都不等时，、、、
oldKeyToIdx= {'A':0,'B':1,'C':2,'D':3}
B在oldKeyToIdx存在索引为1，
在判断sel是否相同，
相同说明这个newStartVnode在oldChildren存在，
patch(oldChildren[1], newStartVnode);
oldChildren[1] = undefined;//
则移动oldChildren[1]到oldStartVnode.elm之前；
newStartVnode = newChildren[++newStartIdx] ->即A
```

3、

![4.4.5.6-3](C:\Users\lee\Desktop\vdom\4.4.5.6-3.png)

（图4.4.5.6-3）

解释：

```
第一种情况的头头相等，按照情况一逻辑走
newStartVnode = newChildren[++newStartIdx] ->D
oldStartVnode = oldChildren[++EndIdx] = undefined；->B为undefined
```

4、

![4.4.5.6-4](C:\Users\lee\Desktop\vdom\4.4.5.6-4.png)

（图4.4.5.6-4）

解释：

```
oldStartVnode是 undefined
会执行++oldStartIdx;
oldStartVnode -> C
```

5、

![4.4.5.6-5](C:\Users\lee\Desktop\vdom\4.4.5.6-5.png)

（图4.4.5.6-5）

解释：

```
5、头头不等、尾尾不等、尾头相等
执行第三种情况;
patch(oldEndVnode, newStartVnode);
oldEndVnode.elm移动到oldStartVnode.elm;
oldEndVnode = oldChildren[--oldEndIdx] -> 即C
newStartVnode = newChildren[++newStartIdx] ->F
```

6、

![4.4.5.6-6](C:\Users\lee\Desktop\vdom\4.4.5.6-6.png)

（图4.4.5.6-6）

解释：

```
五种比较都不相等
newStartVnode = newChildren[++newStartIdx] ->undefined
newStartIdx > newEndIdx跳出循环
```

最后，

![4.4.5.6-7](C:\Users\lee\Desktop\vdom\4.4.5.6-7.png)

(图4.4.5.6-7)

```
此时oldStartIdx = oldEndIdx -> 2 --- C
说明需要删除oldChildren中的这些节点元素C 
```



没有key的时候可以使用id来比较，没有id用索引来创建 `oldKeyToIdx`

