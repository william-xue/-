const simpleTag = ["a", "input", "img"];
function createRender(options) {
  const { createElement, setElementText, insert, patchProps } = options;
  function mountElement(vnode, container) {
    // 挂载阶段
    // 根据vnode创建dom节点
    let el = createElement(vnode);
    vnode._el = el;
    // 给el设置properties
    if (vnode.props) {
      for (const key in vnode.props) {
        patchProps(el, key, null, vnode.props[key]);
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
    // 判断新老节点的type是否相同如果不同需要卸载老节点挂载新节点
    if (oldVnode && newVnode.type !== oldVnode.type) {
      unmount(oldVnode._el);
      oldVnode = null;
    }
    // path的过中看是否有老节点 没有挂载 有的话就对比
    if (!oldVnode) {
      mountElement(newVnode, container);
    } else {
    }
  }
  function unmount(el) {
    let parent = el.parentElement || el.parentNode;
    if (parent) {
      parent.removeChild(el);
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
        unmount(container._vode._el);
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
  patchProps: function (el, key, preValue, nextValue) {
    let regEvent = /^on/;
    if (regEvent.test(key)) {
      // 用当前el来保存事件处理回调
      let invokers = el._vei;
      if (nextValue) {
        // 添加事件
        // 首先看dom上是否有
        if (!invokers) {
          // 没有的话挂载
          el._vei = (e) => {
            invokers.value(e);
          };
          invokers = el._vei;
          invokers.value = nextValue;
        } else {
          // 有的话更新
          invokers.value = nextValue;
        }
        const eventName = key.slice(2).toLocaleLowerCase();
        el.addEventListener(eventName, invokers);
      } else {
        // 删除事件
        el.removeEventListener(eventName, invokers);
      }
    } else if (typeof nextValue === "string" && key === "class") {
      el.className = nextValue || "";
    } else if (shouldSetAsProPerties(el, key)) {
      // 如果属性是对象的属性就使用el[key]=nextValue设置
      // 如果当前的key是disabled并且nextValue为''的话就需要设置为true
      let type = typeof key;
      if (type === "boolean" && nextValue === "") {
        el[key] = true;
      } else {
        el[key] = nextValue;
      }
    } else {
      // 如果当前的属性是form并且是input标签那么就使用setAttribute设置
      el.setAttribute(key, nextValue);
    }
  },
});
function normalizeClass(value) {
  let res = "";
  if (typeof value === "string") {
    res = value;
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const normalized = normalizeClass(value[i]);
      if (normalized) {
        res += normalized + " ";
      }
    }
  } else if (typeof value === "object") {
    for (const name in value) {
      if (value[name]) {
        res += name + " ";
      }
    }
  }
  return res.trim();
}
renderer.render(
  {
    tag: "h1",
    child: [
      {
        tag: "input",
        child: "123",
        props: {
          form: "form",
          id: "123",
          self: 5,
          class: normalizeClass([["foo", "bar"], { bool: true }]),
          onInput: function () {
            console.log(11123);
          },
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
