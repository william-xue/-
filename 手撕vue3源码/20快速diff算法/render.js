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

  function patch(oldVnode, newVnode, container, anchor = null) {
    console.log("patch");
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
    console.log(oldVnode, newVnode, "patchelem");
    // 有三对三九种情况 字符串 数组 null
    if (typeof newVnode.child === "string") {
      // 判断老的child是否为数组 如果是数组就挨个卸载
      if (Array.isArray(oldVnode.child)) {
        oldVnode.child.forEach((c) => unmount(c));
      }
      setElementText(container, newVnode.child);
    } else if (Array.isArray(newVnode.child)) {
      if (Array.isArray(oldVnode.child)) {
        // 快速diff算法
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
    // 快速diff
    // 预处理
    let j = 0;
    let newEnd = newVnode.child.length - 1;
    let oldEnd = oldVnode.child.length - 1;
    let oldChild = oldVnode.child;
    let newChild = newVnode.child;
    // 1对比头部节点看key是否相同 如果相同直接复用 j
    while (j <= newEnd && j <= oldEnd) {
      if (oldChild[j].key === newChild[j].key) {
        patch(oldChild[j], newChild[j], container);
        j++;
      } else {
        break;
      }
    }
    // 2对尾头部节点看key是否相同 如果相同直接复用 newEnd oldEnd
    while (j <= newEnd && j <= oldEnd) {
      if (oldChild[oldEnd].key === newChild[newEnd].key) {
        patch(oldChild[oldEnd], newChild[newEnd], container);
        newEnd--;
        oldEnd--;
      } else {
        break;
      }
    }
    if (j <= newEnd && j > oldEnd) {
      // 如果 j<= newEnd && j > oldEnd说明新节点有新增的
      for (let i = j; i <= newEnd; i++) {
        const anchorIndex = newEnd + 1;
        const anchor =
          anchorIndex < newChild.length ? newChild[anchorIndex]._el : null;
        patch(null, newChild[i], container, anchor);
      }
      console.log("新增节点");
    } else if (j > newEnd && j <= oldEnd) {
      // 如果j > newEnd && j <= oldEnd说明老节点需要删除
      // 将j到oldEnd的节点全部删除
      for (let i = j; i <= oldEnd; i++) {
        unmount(oldChild[i]);
      }
      console.log("删除节点");
    } else {
      // else 核心算法
      console.log("核心算法");
      // 1 先取到剩余新节点未处理的数量 count = newEnd-j+1
      const count = newEnd - j + 1;
      // 2 声明一个数组source容量为count 填充为-1
      const source = new Array(count).fill(-1);
      // 3 把新的节点创建个map<key:唯一id><value:索引>
      const newNodeMap = {};
      let pos = -1;
      let patched = 0;
      // 判断节点是否需要移动
      let moved = false;
      for (let i = j; i <= newEnd; i++) {
        newNodeMap[newChild[i].key] = i;
      } 
     /**
      * 例:
      1     1
   4  3     6   j=1
   3  5     2
   2  2     5
   1  6     3
      newNodeMap = {
        3:1,
        5:2,
        2:3,
        6:4
      }
      source=[4,3,2,1]
      * 
     */
     
      // 4 遍历老节点 填充source source存的是当前新节点在老节点中的索引
      for (let i = j; i <= oldEnd; i++) {
        if (patched <= count) {
          const oldInNewPos = newNodeMap[oldChild[i].key];
          if (oldInNewPos !== undefined) {
            //  4.1 source是老节点和新节点的索引映射 source数组的index是新节点的位置 value是老节点的位置 说白了 source就是
            source[oldInNewPos - j] = i;
            //  4.2 记录当前老节点对应新节点的索引 如果当前老节点的在新节点的索引小于之前记录的 说明节点需要移动 否则 重新记录老节点在新节点中的位置记录为pos
            if (pos > oldInNewPos) {
              moved = true;
            } else {
              pos = oldInNewPos;
            }
            patched++;
            patch(oldChild[i], newChild[oldInNewPos], container);
          } else {
            // 不存在说明是删除节点直接卸载
            unmount(oldChild[i]);
          }
        }
      }
      if (moved) {
        // 5 取source的最大递增的子序列sep
        const sep = findJ(source);
        // 6 s指向序列的地端 t指向新节点未处理的低端 因为sep是以source的索引生成的 所以未处理节点的索引需要处理成和sep一直的头部以0开始
        let s = sep.length - 1;
        let t = count - 1;
        let newStart = j;
        for (let i = t; i >= 0; i--) {
          if (source[i] === -1) {
            console.log("新增的节点");
            // 7 如果当前seq[i]===-1说明是新增节点 直接mounted
            const anchor =
              newStart + i + 1 < newChild.length
                ? newChild[newStart + i + 1]._el
                : null;
            patch(null, newChild[i + newStart], container, anchor);
          } else if (sep[s] === source[i]) {
            // 8 如果相同的s--
            s--;
          } else {
            // 9 else 说明是需要移动的 进行path并插入到他下一个节点的前面
            console.log("需要移动");
            const anchor =
              newStart + i + 1 < newChild.length
                ? newChild[newStart + i + 1]._el
                : null;
            insert(newChild[i + newStart]._el, container, anchor);
          }
        }
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
          key: 6,
          child: "6",
        },
        {
          type: "p",
          key: 5,
          child: "5",
        },
        {
          type: "p",
          key: 1,
          child: "1",
        },
        {
          type: "p",
          key: 3,
          child: "3",
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
          key: 3,
          child: "3",
        },
        {
          type: "p",
          key: 5,
          child: "5",
        },
        {
          type: "p",
          key: 1,
          child: "1",
        },
        {
          type: "p",
          key: 4,
          child: "4",
        },
        {
          type: "p",
          key: 2,
          child: "2",
        },
      ],
    },
    document.getElementById("app")
  );
};
