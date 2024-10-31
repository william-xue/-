function createRenderer(options) {
  const { unmount } = options;

  function mountElement() {
    // 挂载节点
  }

  function patch(n1, n2, container) {
    // 判断新老节点是否为同类型
    if (n1 && n1.type !== n2.type) {
      unmount(n1);
      n1 = null;
    }
    const { type } = n1;
    //type === '什么类型'
    // xxx...
  }
  // 渲染函数
  function render(vnode, container) {
    // 判断是否有老节点
    if (vnode) {
      patch(container.vnode, vnode, container);
    } else {
      if (!vnode) {
        unmount(container._vnode);
      }
    }
    container._vnode = vnode;
  }
  return { render };
}

createRenderer({}).render(vnode, container);
