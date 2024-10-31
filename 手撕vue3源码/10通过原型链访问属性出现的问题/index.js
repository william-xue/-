class Vue {
  constructor() {}
}
/**
 * 双向绑定
 * 响应式系统的简单实现
 */

let activeEffectFn = null;
const activeEffectFnStack = [];
const bucket = new WeakMap();
let ownKeysSymbo = Symbol();
const TriggerType = {
  SET: "SET",
  ADD: "ADD",
  DELETE: "DELETE",
};

function track(target, key) {
  // 每个对象下面对应的属性都有一个副作用函数
  if (!activeEffectFn) return;
  let deps = bucket.get(target);
  if (!deps) {
    bucket.set(target, (deps = new Map()));
  }
  let effectFns = deps.get(key);
  if (!effectFns) {
    deps.set(key, (effectFns = new Set()));
  }
  effectFns.add(activeEffectFn);
  activeEffectFn.deps.push(effectFns);
}
function trigger(target, key, type) {
  let deps = bucket.get(target);
  if (!deps) return;
  let effectFns = deps.get(key);
  const iteratorEffectFns = deps.get(ownKeysSymbo);
  const efectsToRun = new Set();

  // 处理ownKeys 当属性是新增或者删除的时候通过symbol(ownKeysSymbo)触发和ownKeys绑定的effect执行
  if (type === TriggerType.ADD || type === TriggerType.DELETE) {
    iteratorEffectFns &&
      iteratorEffectFns.forEach((effectFn) => {
        if (effectFn && effectFn !== activeEffectFn) {
          efectsToRun.add(effectFn);
        }
      });
  }
  effectFns &&
    effectFns.forEach((effectFn) => {
      if (effectFn && effectFn !== activeEffectFn) {
        efectsToRun.add(effectFn);
      }
    });
  efectsToRun.forEach((effectFn) => {
    if (effectFn.options && effectFn.options.schelder) {
      effectFn.options.schelder(effectFn);
    } else {
      effectFn();
    }
  });
}

let handle = {
  get(target, key, receiver) {
    // console.log(target, key);
    if (key === "raw") return target;
    // 在get中进行track收集依赖函数
    track(target, key);
    return Reflect.get(target, key, receiver);
  },
  set(target, key, newValue, receiver) {
    let type = Object.prototype.hasOwnProperty.call(target, key)
      ? TriggerType.SET
      : TriggerType.ADD;
    let oldValue = target[key];
    let res = Reflect.set(target, key, newValue, receiver);
    console.log(target, key, receiver, receiver.raw);

    if (receiver.raw === target) {
      if (
        newValue !== oldValue &&
        (oldValue === oldValue || newvalue === newvalue)
      ) {
        trigger(target, key, type);
      }
    }

    return res;
  },
  has(target, key, receiver) {
    // 在get中进行track收集依赖函数
    track(target, key);
    return Reflect.has(target, key, receiver);
  },
  deleteProperty(target, key, receiver) {
    let hasOwnKeys = Object.prototype.hasOwnProperty.call(target, key);
    let isDelete = Reflect.deleteProperty(target, key);
    if (isDelete && hasOwnKeys) {
      trigger(target, key, TriggerType.DELETE);
    }
    // 在get中进行track收集依赖函数
    return isDelete;
  },
  ownKeys(target) {
    track(target, ownKeysSymbo);
    return Reflect.ownKeys(target);
  },
};

// 清除分支
function cleanup(activeFn) {
  for (let i = 0; i < activeFn.deps.length; i++) {
    let deps = activeFn.deps[i];
    deps.delete(activeFn);
  }
  activeFn.deps.length = 0;
}
function effect(effectFn, options) {
  function activeFn() {
    cleanup(activeFn);
    activeEffectFn = activeFn;
    activeEffectFnStack.push(activeFn);
    let res = effectFn();
    activeEffectFnStack.pop();
    activeEffectFn = activeEffectFnStack[activeEffectFnStack.length - 1];
    return res;
  }
  activeFn.deps = [];
  activeFn.options = options;
  if (options && options.lazy) {
    return activeFn;
  }
  activeFn();
}
function reactive(obj) {
  return new Proxy(obj, handle);
}
let p = {};
let q = {
  bar: "1",
};
console.log(bucket);
let parent = reactive(q);
let child = reactive(p);
Object.setPrototypeOf(child, parent);
console.log(child);
// has
effect(() => {
  console.log(child.bar);
});
child.bar = "123";
