console.log(VueReactibity);
const simpleTag = ["a", "input", "img"];
function createRender(options) {
  const { createElement, setElementText, insert, patchProps } = options;
  function mountElement(vnode, container) {
    // 挂载阶段
    // 根据vnode创建dom节点
    let el = createElement(vnode);
    // 给el设置properties
    if (vnode.props) {
      for (const key in vnode.props) {
        patchProps(el, key, vnode.props[key]);
      }
    }
    // 给节点插入text
    if (typeof vnode.child === "string" || typeof vnode.child === "number") {
      setElementText(el, vnode.child);
    } else if (Array.isArray(vnode.child)) {
      vnode.child.map((child) => {
        patch(null, child, el);
      });
    }
    // 把dom插入到父级
    insert(el, container);
  }
  function patch(oldVnode, newVnode, container) {
    // path的过中看是否有老节点 没有挂载 有的话就对比
    // 如果vode为null的情况下 就是卸载阶段
    if (!oldVnode) {
      mountElement(newVnode, container);
    } else {
    }
  }
  function render(vnode, container) {
    // 在渲染阶段
    // 首先需要进行path节点
    if (vnode) {
      patch(container._vode, vnode, container);
    } else {
      // 卸载
      if (container._vode) {
        container.innerHTML = "";
      }
    }
    // 老的vode保存在container中
    container._vnode = vnode;
  }
  return {
    render,
  };
}
function shouldSetAsProPerties(el, key) {
  if (el.tagName === "INPUT" && key === "form") return false;
  return key in el;
}
const renderer = createRender({
  createElement: function (vnode) {
    return document.createElement(vnode.tag);
  },
  setElementText: function (el, text) {
    if (simpleTag.indexOf(el.tagName.toLocaleLowerCase()) === -1) {
      el.textContent = text;
    }
  },
  insert: function (el, parent, anchor = null) {
    parent.insertBefore(el, anchor);
  },
  patchProps: function (el, key, value) {
    if (shouldSetAsProPerties(el, key)) {
      console.log(1, key);
      // 如果属性是对象的属性就使用el[key]=value设置
      // 如果当前的key是disabled并且value为''的话就需要设置为true
      let type = typeof key;
      if (type === "boolean" && value === "") {
        el[key] = true;
      } else {
        el[key] = value;
      }
    } else {
      // 如果当前的属性是form并且是input标签那么就使用setAttribute设置
      el.setAttribute(key, value);
    }
  },
});
renderer.render(
  {
    tag: "h1",
    child: [
      {
        tag: "input",
        child: "123",
        props: {
          form: "form",
          disabled: true,
          id: "123",
          self: 5,
        },
      },
      {
        tag: "span",
        child: 456,
      },
      {
        tag: "h1",
        child: "asd",
      },
    ],
  },
  document.getElementById("app")
);
