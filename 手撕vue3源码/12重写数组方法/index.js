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
const arrayMethods = {};
const notVaritionMethod = ["includes", "indexOf"];
const varitionMethod = ["push", "unshift"];
let shouldTrack = true;
notVaritionMethod.map((method) => {
  arrayMethods[method] = function (...arg) {
    let origin = Array.prototype[method];
    let res = origin.apply(this, arg);
    if (!res) {
      res = origin.apply(this.raw, arg);
    }
    return res;
  };
});
varitionMethod.map((method) => {
  arrayMethods[method] = function (...arg) {
    shouldTrack = false;
    let origin = Array.prototype[method];
    let res = origin.apply(this, arg);
    shouldTrack = true;
    return res;
  };
});
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
function trigger(target, key, newValue, type) {
  console.log(target, key);
  let deps = bucket.get(target);
  if (!deps) return;
  let effectFns = deps.get(key);
  const iteratorEffectFns = deps.get(ownKeysSymbo);
  const efectsToRun = new Set();
  let lengthEffect;

  if (key === "length" && Array.isArray(target)) {
    deps.forEach((effect, i) => {
      if (Number(i) >= newValue && effect !== activeEffectFn) {
        efectsToRun.add(...effect);
      }
    });
  }

  if (type === TriggerType.ADD && Array.isArray(target)) {
    lengthEffect = deps.get("length");
    lengthEffect &&
      lengthEffect.forEach((effectFn) => {
        if (effectFn && effectFn !== activeEffectFn) {
          efectsToRun.add(effectFn);
        }
      });
  }

  // 当我修改数组的索引超过数组本身的长度 并且副作用函数中访问的是数组的长度那么需要触发副作用函数
  if (type === TriggerType.ADD && Array.isArray(target)) {
    lengthEffect = deps.get("length");
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
    if (key === "raw" || !shouldTrack) return target;
    // 在get中进行track收集依赖函数
    track(target, key);
    if (Array.isArray(target) && arrayMethods.hasOwnProperty(key)) {
      return Reflect.get(arrayMethods, key, receiver);
    }
    let res = Reflect.get(target, key, receiver);
    if (typeof target[key] === "object") {
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

// 当使用indexOf查找obj的时候会返回false 原因是data是代理后的数组 访问里面的obj的时候因为obj是一个对象所以里面的obj也被代理了 所以用原始的obj和代理后的obj对比就不会相同了
// let obj = {};
// let data = reactive([obj]);
// // has
// effect(() => {
//   console.log(data.includes(obj));
// });

// 当我们push两次的时候会爆栈
// 原因是当执行data.push的时候方法内部会把push和length两个属性和effect进行绑定
// 第一次执行effect里面的push的时候bucket中push和length每个会对应一个effect方法
// 当我第二次push的时候因为他要set一个1进去所以会走handle里面set方法
// set方法内部有一个判断当前target为数组并且是add的时候把length绑定的effect拿出来执行 这样就会执行之前存的关于length的effect就会重复执行第一个effect内部的方法就会爆栈
let arr = [1, 2, 3];
let data = reactive(arr);

effect(() => {
  console.log("eff");
  data.push(1);
});

effect(() => {
  console.log("eff");

  data.push(1);
});
