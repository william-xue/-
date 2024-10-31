const simpleTag = ["a", "input", "img"];
const TEXT = Symbol();
const COMMENT = Symbol();
const Fragment = Symbol();

const { ref, effect, reactive, shallowReactive, shallowReadOnlyReactive } =
  VueReactibity;
// 当前是哪个组件实例
let currentInstance = null;
function setCurrentInstance(instance) {
  currentInstance = instance;
}
function onMounted(fn) {
  if (currentInstance) {
    currentInstance.mounted.push(fn);
  } else {
    console.error("onMounted只能在setup中调用");
  }
}
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
    } else if (typeof type === "object") {
      if (!oldVnode) {
        if (newVnode.keptAlive) {
          newVnode.keepAliveInstance.__activate(newVnode, container, anchor);
        } else {
          mountComponent(newVnode, container, anchor);
        }
      } else {
        // 由于父组件更新造成的更新
        patchComponent(oldVnode, newVnode, container, anchor);
      }
    }
  }
  function mountComponent(newVnode, container, anchor) {
    // 挂载组件阶段
    const componentOptions = newVnode.type;
    let {
      data,
      props: propsOptions,
      render,
      beforeCreate,
      setup,
      __isKeepLive,
    } = componentOptions;
    const queue = new Set();
    let isFlush = false;
    let p = Promise.resolve();
    beforeCreate && beforeCreate();
    // 组件的插槽
    const slot = newVnode.child;
    // 1 有data data对象需要代理变成响应式数据
    const state = data ? reactive(data()) : null;
    // 拿到父组件传递过来的props
    const [props, attr] = resolveProps(propsOptions, newVnode.props);
    const setupContext = { attr, emit, slot };
    // 声明一个instance 用来记录组件实例 当数据更新带动dom更新的时候用到当前实例
    const instance = {
      state,
      isMounted: false,
      props: shallowReactive(props),
      subTree: null,
      slot,
      mounted: [],
    };
    if (__isKeepLive) {
      // 将组件移动到指定位置
      instance.keepAliveCtx = {
        move(vnode, container, anchor) {
          insert(vnode.component.subTree._el, container, anchor);
        },
        createElement,
      };
    }
    setCurrentInstance(instance);
    // 如果当前组件是keepalive组件的话我们需要给组件添加一些方法

    // 这段为什么要用shallowReadOnlyReactive重新给props响应式 因为父组件传递给子组件是属于一个新的对象了 之前没有被proxy上 所以如果不proxy的话 父组件更新子组件用到的值 子组件不会触发更新
    const setupProps = shallowReadOnlyReactive(props);
    const steupResult = setup && setup(setupProps, setupContext);
    setCurrentInstance(null);
    // 用来保存setup返回回来的数据
    let setupState = null;

    // 如果setupResult返回的是一个函数 说明他是需要用来渲染的
    if (typeof steupResult === "function") {
      if (render) {
        console.warn("setup返回渲染函数,不能和render函数同时存在");
      }
      render = steupResult;
    } else {
      setupState = steupResult;
    }
    // 函数的上下文 我们在created methods computed中能够直接通过this访问到state和props就是通过call来改变this指向指向到renderContext才能访问
    // 例如created.call(renderContext)
    const renderContext = new Proxy(instance, {
      get(target, k) {
        const { state, props, slot } = target;
        if (state && k in state) {
          return state[k];
        } else if (props && k in props) {
          return props[k];
        } else if (setupState && k in setupState) {
          if (setupState[k].hasOwnProperty("__ref_val")) {
            return setupState[k].value;
          } else {
            return setupState[k];
          }
        } else if (k === "$slots") {
          return slot;
        } else {
          console.error(k + "值不存在");
        }
      },
      set(target, k, newValue) {
        const { state, props } = target;
        if (state && k in state) {
          state[k] = newValue;
        } else if (props && k in props) {
          console.warn(k + "值不能被改变");
        } else if (setupState && k in setupState) {
          if (setupState[k].hasOwnProperty("__ref_val")) {
            setupState[k].value = newValue;
          } else {
            setupState[k] = newValue;
          }
        } else {
          console.error(k + "值不存在");
        }
      },
    });
    function emit(eventName, ...args) {
      // 将change-》onChange
      const emitName = `on${eventName[0].toLocaleUpperCase()}${eventName.slice(
        1
      )}`;
      const handler = instance.props[emitName];
      if (handler) {
        handler(...args);
      } else {
        console.error(`当前${emitName}对应的处理函数不存在`);
      }
    }
    newVnode.component = instance;
    function queueJob(job) {
      queue.add(job);
      if (!isFlush) {
        isFlush = true;
        p.then(() => {
          queue.forEach((job) => {
            job();
          });
        }).finally(() => {
          isFlush = false;
          queue.clear();
        });
      }
    }

    // 2我们要处理一下props props从父组件传递过来 子组件定义那些是要过来的变量
    // 3 有render render返回的时候虚拟dom 可以通过patch方法挂载到它的父级上面去 因为数据带动页面渲染所以需要放到effect中
    effect(
      () => {
        // render中要通过this拿到data中的变量渲染到页面中
        let vnode = render.call(renderContext, renderContext);
        // 如何渲染到页面中可以通过patch渲染
        if (!instance.isMounted) {
          patch(null, vnode, container);
          instance.isMounted = true;
          // 组件已经挂在完毕
          instance.mounted.forEach((fn) => {
            fn.call(renderContext);
          });
        } else {
          patch(instance.subTree, vnode, container);
        }
        instance.subTree = vnode;
      },
      {
        // data数据更新触发schelder更新页面
        schelder: queueJob,
      }
    );
  }

  function patchComponent(oldVnode, newVnode, container, anchor) {
    // 需要判断的是父组件传过来的props是否改变 如果props改变了那么子组件就需要整体替换props 整体替换的过程子组件会触发trigger 重新渲染页面
    // 所以之前我们把props变成shallowReactive就可以了  因为父组件更新子组件如果不一样我们直接就重新给值能触发它更新就行 就行不用往深层去遍历

    // 由于父组件更新 带动子组件被动更新
    // 挂载节点自定义组件中在vnode中会存一个instance  当patch的时候新的vnode中没有instance
    const intance = (newVnode.component = oldVnode.component);
    // 拿到更新后的props
    const [nextProps] = resolveProps(newVnode.type.props, newVnode.props);
    // 更新前的props
    const { props } = intance;
    // 判断新老节点的值是否发生改变
    if (hasChanged(oldVnode.props, newVnode.props)) {
      // 所以需要遍历新节点 把新节点的值重新给老节点
      for (const key in nextProps) {
        props[key] = nextProps[key];
      }
      // 遍历老节点 如果老节点的值在新节点中不存在那么就删除
      for (const key in props) {
        if (!key in nextProps) delete props[key];
      }
    }
  }
  function resolveProps(propsOpions, nextProps) {
    const props = {};
    const attr = {};
    // 遍历props 如果在propsOptions上就是父组件过来的 如果不在就是attr
    for (const key in nextProps) {
      if (key in propsOpions) {
        props[key] = nextProps[key];
      } else if (key.startsWith("on")) {
        props[key] = nextProps[key];
      } else {
        attr[key] = nextProps[key];
      }
    }
    return [props, attr];
  }
  function hasChanged(preProps, nextProps) {
    // 判断长度是否相同
    if (Object.keys(preProps).length === Object.keys(nextProps).length) {
      for (const key in preProps) {
        if (preProps[key] !== nextProps[key]) {
          return true;
        }
      }
    } else {
      return true;
    }
    return false;
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
    if (
      typeof newVnode.child === "string" ||
      typeof newVnode.child === "number"
    ) {
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
    } else if (j > newEnd && j <= oldEnd) {
      // 如果j > newEnd && j <= oldEnd说明老节点需要删除
      // 将j到oldEnd的节点全部删除
      for (let i = j; i <= oldEnd; i++) {
        unmount(oldChild[i]);
      }
    } else {
      // else 核心算法
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
      // 4 遍历老节点 填充source source存的是当前新节点在老节点中的索引
      for (let i = j; i <= oldEnd; i++) {
        if (patched <= count) {
          const oldInNewPos = newNodeMap[oldChild[i].key];
          if (oldInNewPos !== undefined) {
            //  4.1 判断当前老节点在新节点的map中是否存在 存在就填入source
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
    console.log(vnode);
    if (typeof vnode.type === "object") {
      if (vnode.shouldKeepAlive) {
        vnode.keepAliveInstance.__deactivate(vnode);
      } else {
        unmount(vnode.component.subTree);
      }
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
      const eventName = key.slice(2).toLocaleLowerCase();

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
function defineComponent(options) {
  // 异步组件的作用
  // 1 加载组件成功或者失败 渲染成功的组件 或自定义加载错误组件  或用户自定义组件
  // 2 加载过慢时loading加载的一个状态
  // 3 加载超市的时候渲染的组件
  // 4 加载失败重试的一个机制

  // defineComponent是一个高阶组件 传入一个延迟组件 返回一个组件  所以他的return应该是一个对象
  // 在setup里面直接返回一个函数 这个函数会在vue的内部替换为render函数
  //
  if (typeof options === "function") {
    options = { loader: options };
  }
  const el = null;
  const { loader } = options;
  // 作为组件是否加载完毕的标识
  const loaded = ref(false);
  // 组件是否加载中
  const loading = ref(true);
  // 失败的错误msg
  const errMsg = ref("");
  let loadingTimer = ref(false);
  if (options.delay) {
    loadingTimer = setTimeout(() => {
      loading.value = true;
    }, options.delay);
  }

  async function loadApi(api, c, onError) {
    return new Promise(async function (resolve, reject) {
      try {
        c--;
        let res = await api();
        resolve(res);
      } catch (error) {
        let retry, fail;
        if (c > 0) {
          retry = () => resolve(loadApi(api, c, onError));
        } else {
          fail = () => reject("组件加载失败失败");
        }
        onError(retry, fail);
      }
    });
  }
  loadApi(loader, 5, (retry, fail) => {
    retry && retry();
    fail && fail();
  })
    .then((com) => {
      // 组件加载成功
      el = com;
    })
    .catch((err) => {
      // 组件加载失败
      errMsg.value = err;
    })
    .finally(() => {
      loading.value = false;
      clearTimeout(loadingTimer);
    });
  let timer = null;
  if (options.timeout) {
    timer = setTimeout(() => {
      const err = new Error("组件加载超时");
      errMsg.value = err.message;
    }, options.timeout);
  }
  // 组件卸载时候要调用clear 暂时未实现组件的卸载
  // clearTimeout(timer)
  // 默认返回
  const placeholder = {
    type: TEXT,
    child: "",
  };
  return {
    setup() {
      return () => {
        // setup返回一个函数 作为render函数
        if (loaded.value) {
          // 组件加载完成返回
          return {
            type: el,
            props: {},
          };
        } else if (loading.value && loading.loadingComponent) {
          return {
            type: options.loadingComponent,
            props: {},
          };
        } else if (errMsg.value && options.errComponetn) {
          return {
            type: options.errComponetn,
            props: {
              errMsg: errMsg.value,
            },
          };
        }
        return placeholder;
      };
    },
  };
}

const keepAlive = {
  __isKeepLive: true,
  setup(props, { slot }) {
    // keepalive的实现原理
    // keepalive属于一个高阶组件 将当前组件增强并缓存 然后返回这个组件
    // 1 缓存 缓存vode 和 el
    //  1.2 如何缓存vnode 使用map来进行缓存 key就是组件对象 value就是组件对象
    //  1.3 如何缓存组件对象生成的el 创建一个隐藏的div到内存中 激活的时候从div中把组件对应的el给移动到container中 失活的时候把el从container中拿到div中
    // 2 给组件做keepalive的标识 标识它已经被keepalive缓存上了
    const instance = currentInstance;
    const { move, createElement } = instance.keepAliveCtx;
    // 创建一个隐藏的div
    const storeContainer = createElement({ type: "div" });
    storeContainer.id = "keepalive";
    instance.__deactivate = function (vnode) {
      vnode.type.deactive && vnode.type.deactive();
      move(vnode, storeContainer);
    };
    instance.__activate = function (vnode, container, anchor) {
      vnode.type.activate && vnode.type.activate();
      move(vnode, container, anchor);
    };
    // 创建一个map用来缓存组件对象
    const vnodeCache = new Map();
    return () => {
      let rawVnode = slot.default();
      if (vnodeCache.has(rawVnode.type)) {
        rawVnode.component = vnodeCache.get(rawVnode.type).component;
        rawVnode.keptAlive = true;
      } else {
        vnodeCache.set(rawVnode.type, rawVnode);
      }
      rawVnode.shouldKeepAlive = true;
      rawVnode.keepAliveInstance = instance;
      return rawVnode;
    };
  },
};
const com1 = {
  activate() {
    console.log("激活");
  },
  deactive() {
    console.log("失活");
  },
  setup() {
    const a = ref(Math.random());
    return () => {
      return {
        type: "div",
        child: a.value + "com1",
      };
    };
  },
};
const com2 = {
  setup() {
    const a = ref(Math.random());
    return () => {
      return {
        type: "div",
        child: a.value + "com2",
      };
    };
  },
};
const myComponent = {
  setup(props, context) {
    const { emit } = context;
    const a = ref(1);
    const flag = ref(true);
    const msg = ref("msg");
    function editProps() {
      emit("change", 1, 2, 3);
    }
    onMounted(() => {});
    return {
      a,
      msg,
      body,
      flag,
      editProps,
    };
  },

  props: {
    title: String,
  },
  render() {
    return {
      type: "div",
      child: [
        {
          type: "p",
          child: this.title,
        },
      ],
      props: {
        class: "aaa",
        xxxL: "xx",
      },
    };
  },
};
let vnode;
const a1 = ref(8);
const user = reactive({
  name: "zs",
  age: 1,
});
const flag = ref(true);
effect(() => {
  vnode = {
    type: "div",
    child: [
      {
        name: "keepalive",
        type: keepAlive,
        child: {
          default() {
            return flag.value
              ? {
                  name: "com1",

                  type: com1,
                  props: {},
                }
              : {
                  name: "com2",

                  type: com2,
                  props: {},
                };
          },
        },
        props: {},
      },
    ],
  };
  renderer.render(vnode, document.getElementById("app"));
});

document.getElementById("btn").onclick = function () {
  flag.value = !flag.value;
};
