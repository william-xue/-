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

  function render(vnode, container) {
    // 在渲染阶段
    // 首先需要进行path节点
    if (vnode) {
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

  function patch(oldVnode, newVnode, container, anchor = null) {
    // 判断新老节点的type是否相同如果不同需要卸载老节点挂载新节点
    if (oldVnode && newVnode.type !== oldVnode.type) {
      unmount(oldVnode);
      oldVnode = null;
    }
    const { type } = newVnode;
    if (typeof type === "string") {
      if (!oldVnode) {
        // path的过中看是否有老节点 没有挂载 有的话就对比
        mountElement(newVnode, container, anchor);
      } else {
        // 有老的节点就进行更新
        patchElement(oldVnode, newVnode);
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

  function mountElement(vnode, container, anchor) {
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
    insert(el, container, anchor);
  }

  function patchElement(oldVnode, newVnode) {
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
    patchChildren(oldVnode, newVnode, el);
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
      if (Array.isArray(oldVnode.child)) {
        // 双端diff算法
        patchKeyProps(oldVnode, newVnode, container);
      } else {
        setElementText(container, "");
        newVnode.child.forEach((vnode) => patch(null, vnode, container));
      }
    } else {
      // 新节点为null
      if (Array.isArray(oldVnode.child)) {
        oldVnode.child.forEach((c) => unmount(c));
      } else {
        setElementText(container, "");
      }
    }
  }

  function patchKeyProps(oldVnode, newVnode, container) {
    // 拿到新老节点的头和尾索引
    let oldStartIndex = 0,
      newStartIndex = 0,
      oldEndIndex = oldVnode.child.length - 1,
      newEndIndex = newVnode.child.length - 1;
    let oldStart = oldVnode.child[oldStartIndex],
      oldEnd = oldVnode.child[oldEndIndex],
      newStart = newVnode.child[newStartIndex],
      newEnd = newVnode.child[newEndIndex];
    while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
      if (!oldStart) {
        oldStart = oldVnode.child[++oldStartIndex];
      } else if (!oldEnd) {
        oldEnd = oldVnode.child[--oldEndIndex];
      } else if (oldStart.key === newStart.key) {
        console.log("头头");
        // 头头
        patch(oldStart, newStart, container);
        oldStart = oldVnode.child[++oldStartIndex];
        newStart = newVnode.child[++newStartIndex];
      } else if (oldEnd.key === newEnd.key) {
        console.log("尾尾");
        // 尾尾
        patch(oldEnd, newEnd, container);
        oldEnd = oldVnode.child[--oldEndIndex];
        newEnd = newVnode.child[--newEndIndex];
      } else if (oldStart.key === newEnd.key) {
        console.log("头尾");
        // 头尾
        patch(oldStart, newEnd, container);
        insert(oldStart._el, container, oldEnd._el.nextSibling);
        oldStart = oldVnode.child[++oldStartIndex];
        newEnd = newVnode.child[--newEndIndex];
      } else if (oldEnd.key === newStart.key) {
        console.log("尾头");
        // 尾头
        console.log(oldStart);
        patch(oldEnd, newStart, container);
        insert(oldEnd._el, container, oldStart._el);
        oldEnd = oldVnode.child[--oldEndIndex];
        newStart = newVnode.child[++newStartIndex];
      } else {
        // 如果搜索不到 拿一个新节点到老节点中去找
        let oldIndex = oldVnode.child.findIndex(
          (vnode) => vnode.key === newStart.key
        );
        if (oldIndex >= 0) {
          console.log("循环");
          const currentOldVnode = oldVnode.child[oldIndex];
          patch(currentOldVnode, newStart, container);
          insert(currentOldVnode._el, container, oldStart._el);
          // 如果找到的话
          oldVnode.child[oldIndex] = undefined;
        } else {
          console.log("新增");
          // 如果找不到 新加入的节点要动到第一个老节点的前面
          const anchor = oldVnode.child[oldStartIndex]._el;
          patch(null, newStart, container, anchor);
          newStart = newVnode.child[++newStartIndex];
        }
      }
    }
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      console.log("删除");
      unmount(oldVnode.child[i]);
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
          key: 2,
          child: "2",
        },
        {
          type: "p",
          key: 4,
          child: "4",
        },
        {
          type: "p",
          key: 3,
          child: "3",
        },
        {
          type: "p",
          key: 5,
          child: "5",
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
      child: [
        {
          type: "p",
          key: 1,
          child: "1",
        },
        {
          type: "p",
          key: 8,
          child: "8",
        },
        {
          type: "p",
          key: 3,
          child: "3",
        },
        {
          type: "p",
          key: 4,
          child: "4",
        },
        {
          type: "p",
          key: 5,
          child: "5",
        },
      ],
    },
    document.getElementById("app")
  );
};
