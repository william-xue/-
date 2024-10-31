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
const reactiveMap = new Map();
const TriggerType = {
  SET: 'SET',
  ADD: 'ADD',
  DELETE: 'DELETE',
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
function trigger(target, key, newValue, type) {
  console.log(target, key);
  let deps = bucket.get(target);
  if (!deps) return;
  let effectFns = deps.get(key);
  const iteratorEffectFns = deps.get(ownKeysSymbo);
  const efectsToRun = new Set();
  let lengthEffect;

  if (key === 'length' && Array.isArray(target)) {
    deps.forEach((effect, i) => {
      if (Number(i) >= newValue && effect !== activeEffectFn) {
        efectsToRun.add(...effect);
      }
    });
  }
  // 当我修改数组的索引超过数组本身的长度 并且副作用函数中访问的是数组的长度那么需要触发副作用函数
  if (type === TriggerType.ADD && Array.isArray(target)) {
    lengthEffect = deps.get('length');
    lengthEffect &&
      lengthEffect.forEach((effectFn) => {
        if (effectFn && effectFn !== activeEffectFn) {
          efectsToRun.add(effectFn);
        }
      });
  }
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
    console.log(target, key);
    if (key === 'raw') return target;
    // 在get中进行track收集依赖函数
    track(target, key);
    let res = Reflect.get(target, key, receiver);
    if (typeof target[key] === 'object') {
      return reactive(target[key]);
    }
    return res;
  },
  set(target, key, newValue, receiver) {
    let type = Array.isArray(target[key])
      ? target.length >= key
        ? TriggerType.ADD
        : TriggerType.SET
      : Object.prototype.hasOwnProperty.call(target, key)
      ? TriggerType.SET
      : TriggerType.ADD;
    let oldValue = target[key];
    let res = Reflect.set(target, key, newValue, receiver);
    if (receiver.raw === target) {
      if (
        newValue !== oldValue &&
        (oldValue === oldValue || newvalue === newvalue)
      ) {
        trigger(target, key, newValue, type);
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
function creatReactive(obj) {
  return new Proxy(obj, handle);
}
function reactive(obj) {
  let res = reactiveMap.get(obj);
  if (res) return res;
  let proxy = creatReactive(obj);
  reactiveMap.set(obj, proxy);
  return proxy;
}
let data = {
  bar: '1',
  child: [1, 2, 3],
};
//当我修改数组的索引超过数组本身的长度 并且副作用函数中访问的是数组的长度那么需要触发副作用函数
// let obj = reactive(data);
// // has
// effect(() => {
//   console.log(obj.child.length);
// });
// obj.child[3] = 5;

//当我修改数组的长度小于之前数组的长度 相当于把数组给减小了 此时也需要触发effect
// 思路就是判断当前访问的key是length 并且target是个数组 然后遍历bucket存的所有数组的索引和当前的修改后的长度比较  如果修改后的长度小于等于bucket中存的索引属性那么就把它对应的effect副作用函数进行trigger
let obj = reactive(data);
// has
effect(() => {
  console.log(obj.child[2]);
});
obj.child.length = 1;
