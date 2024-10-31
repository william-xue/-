const simpleTag = ["a", "input", "img"];
const TEXT = Symbol();
const COMMENT = Symbol();
const Fragment = Symbol();
function createRender(options) {
  const {
    createElement,
    setElementText,
    insert,
    patchProps,
    createComment,
    createTextNode,
  } = options;
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
  function patchElement(oldVnode, newVnode, container) {
    const oldProps = oldVnode["props"];
    const newProps = newVnode["props"];
    // 属性的更新 新老属性替换 新老vnode的el都是一个 因为type肯定是相同的如果不同就走得是mountElement
    const el = (newVnode._el = oldVnode._el);
    // 遍历新属性 然后赋值给el
    for (const key in newProps) {
      if (newProps[key] !== oldProps[key]) {
        patchProps(el, key, oldProps[key], newProps[key]);
      }
    }
    // 遍历旧节点 看新节点是否有落下的
    for (const key in oldProps) {
      if (!(key in newProps)) {
        patchProps(el, key, null, oldProps[key]);
      }
    }
    // children更新
    patchChildren(oldVnode, newVnode, container);
  }
  function patchChildren(oldVnode, newVnode, container) {
    // 有三对三九种情况 字符串 数组 null
    if (typeof newVnode.child === "string") {
      // 判断老的child是否为数组 如果是数组就挨个卸载
      if (Array.isArray(oldVnode.child)) {
        oldVnode.child.forEach((c) => unmount(c));
      }
      setElementText(container, newVnode.child);
    } else if (Array.isArray(newVnode.child)) {
      // 这里需要进行diff算法对比更新
      // TODO 暂时先简单处理 卸载调所有的老节点 然后path新节点
      // 判断老的child是否为数组 如果是数组就挨个卸载
      if (Array.isArray(oldVnode.child)) {
        oldVnode.child.forEach((c) => unmount(c));
      } else {
        setElementText(container, "");
      }
      newVnode.child.map((c) => {
        patch(null, c, container);
      });
    } else {
      // 新节点为null
      if (Array.isArray(oldVnode.child)) {
        oldVnode.child.forEach((c) => unmount(c));
      } else {
        setElementText(container, "");
      }
    }
  }
  function patch(oldVnode, newVnode, container) {
    // 判断新老节点的type是否相同如果不同需要卸载老节点挂载新节点
    if (oldVnode && newVnode.type !== oldVnode.type) {
      unmount(oldVnode);
      oldVnode = null;
    }
    const { type } = newVnode;
    if (typeof type === "string") {
      if (!oldVnode) {
        // path的过中看是否有老节点 没有挂载 有的话就对比
        mountElement(newVnode, container);
      } else {
        // 有老的节点就进行更新
        patchElement(oldVnode, newVnode, container);
      }
    } else if (type === TEXT) {
      // 文本节点
      if (!oldVnode) {
        const el = createTextNode(newVnode.child);
        newVnode._el = el;
        insert(el, container);
      } else {
        const el = (newVnode._el = oldVnode._el);
        if (newVnode.child !== oldVnode.child) {
          el.nodeValue = newVnode.child;
        }
      }
    } else if (type === COMMENT) {
      // 注释节点
      if (!oldVnode) {
        const el = createComment(newVnode.child);
        newVnode._el = el;
        insert(el, container);
      } else {
        const el = (newVnode._el = oldVnode._el);
        if (newVnode.child !== oldVnode.child) {
          el.nodeValue = newVnode.child;
        }
      }
    } else if (type === Fragment) {
      // fragment节点
      if (!oldVnode) {
        newVnode.child.map((vnode) => patch(null, vnode, container));
      } else {
        patchChildren(oldVnode, newVnode, container);
      }
    }
  }
  function unmount(vnode) {
    const el = vnode._el;
    if (vnode.type === Fragment) {
      vnode.child.map((c) => unmount(c));
    }
    if (el) {
      let parent = el.parentElement || el.parentNode;

      if (parent) {
        parent.removeChild(el);
      }
    }
  }
  function render(vnode, container) {
    // 在渲染阶段
    // 首先需要进行path节点
    if (vnode) {
      console.log(
        container._vnode,
        "container._vode是否存在 存在为更新 不存在是mounted阶段",
        vnode
      );
      patch(container._vnode, vnode, container);
    } else {
      // 卸载
      if (container._vnode) {
        unmount(container._vnode);
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
    return document.createElement(vnode.type);
  },
  setElementText: function (el, text) {
    if (simpleTag.indexOf(el.tagName.toLocaleLowerCase()) === -1) {
      el.textContent = text;
    }
  },
  createTextNode(str) {
    return document.createTextNode(str);
  },
  insert: function (el, parent, anchor = null) {
    parent.insertBefore(el, anchor);
  },
  createComment(str) {
    return document.createComment(str);
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

const { ref, effect } = VueReactibity;
let bool = ref(false);
effect(() => {
  renderer.render(
    {
      type: "div",
      child: [
        {
          type: "p",
          child: 1,
        },
        {
          type: "h1",
          child: 2,
        },
      ],
    },
    document.getElementById("app")
  );
});
btn.onclick = function () {
  renderer.render(
    {
      type: "div",
      props: bool.value
        ? {
            onClick: function () {
              console.log("123333");
            },
          }
        : {},
      child: [
        {
          type: "p",
          child: "456",
          props: {
            class: "aaa",
            xxxL: "xx",
          },
        },
        {
          type: "p",
          child: "123333",
        },
        {
          type: COMMENT,
          child: "注释节点",
        },
        {
          type: Fragment,
          child: [
            {
              type: "li",
              child: 1,
              props: {
                class: "aaa",
              },
            },
            {
              type: "li",
              child: 2,
            },
            {
              type: "li",
              child: 3,
            },
          ],
        },
      ],
    },
    document.getElementById("app")
  );
};
