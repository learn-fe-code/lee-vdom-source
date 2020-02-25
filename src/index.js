
import { h,patch } from './vdom';
  //  h函数返回虚拟节点
  let vnode = h('ul', {},
    [h('li', { key: 'A' }, 'ItemA'),
    h('li', { key: 'B' }, 'ItemB'),
    h('li', { key: 'C' }, 'ItemC'),
    h('li', { key: 'D' }, 'ItemD')]
    );
    // 新增 `ABCD =>ABCDE`
  let newVnode = h('ul', {style: {'background': 'green'}} ,
    [   
    h('li', { key: 'E' }, 'ItemE'),
    h('li', { key: 'B' }, 'ItemB1'),
    h('li', { key: 'A' }, 'ItemA1'),
    h('li', { key: 'D' }, 'ItemD1'),
    h('li', { key: 'F' }, 'ItemF'),
  ]
    );

  // 属性更改

  let container = document.getElementById('app');
  patch(container, vnode);

  setTimeout(() => {
    console.log('执行改变');
    patch(vnode, newVnode);
  }, 3000);
