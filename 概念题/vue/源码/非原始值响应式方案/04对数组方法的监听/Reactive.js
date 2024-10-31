arr = [];
TriggerType = {
  SET: "SET",
  ADD: "ADD",
  DELETE: "DELETE",
};
const iterateKey = Symbol();
const bucket = new WeakMap();
let activeEffect = null;
const effectStack = [];
const reactiveMap = new Map();
// 重写数组查找的方法
const arrayInstanceMethods = {};
["includes", "indexOf"].map((method) => {
  arrayInstanceMethods[method] = function (...args) {
    const originMethod = Array.prototype[method];
    let res = originMethod.apply(this, args);
    if (!res) {
      res = originMethod.apply(this.raw, args);
    }
    return res;
  };
});
// 重写修改数组长度的方法
let shouldTrack = true;

["push", "pop"].map((method) => {
  arrayInstanceMethods[method] = function (...args) {
    shouldTrack = false;
    const originMethod = Array.prototype[method];
    let res = originMethod.apply(this, args);
    shouldTrack = true;
    return res;
  };
});
function isNaN(value) {
  return value === value;
}
function track(target, key) {
  console.log("track", key, shouldTrack);

  if (!activeEffect || !shouldTrack) return target[key];
  let depsMap = bucket.get(target);
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()));
  }
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  deps.add(activeEffect);
  activeEffect.deps.push(deps);
}
function trigger(target, key, type = "", newValue) {
  console.log("trigger", key);

  let depsMap = bucket.get(target);
  if (!depsMap) return;
  const iteratorEffectFns = depsMap.get(iterateKey);
  let effects = depsMap.get(key);
  const effectToRun = new Set();
  let lengthEffectFns;

  if (Array.isArray(target) && key === "length") {
    depsMap.forEach((effect, key) => {
      if (Number(key) >= newValue && effect !== activeEffect)
        effectToRun.add(...effect);
    });
  }

  // 数组长度改变触发
  if (type === TriggerType["ADD"] && Array.isArray(target)) {
    lengthEffectFns = depsMap.get("length");
    lengthEffectFns &&
      lengthEffectFns.forEach((lengthEffect) => {
        if (lengthEffect !== activeEffect) {
          effectToRun.add(lengthEffect);
        }
      });
  }
  // 当我们遍历对象的时候添加或者删除属性的时候触发
  if (type === TriggerType["ADD"] || type === TriggerType["DELETE"]) {
    iteratorEffectFns &&
      iteratorEffectFns.forEach((iteratorEffectFn) => {
        if (iteratorEffectFn !== activeEffect) {
          effectToRun.add(iteratorEffectFn);
        }
      });
  }
  effects &&
    effects.forEach((effect) => {
      if (effect && effect !== activeEffect) {
        effectToRun.add(effect);
      }
    });
  for (const effectFn of effectToRun) {
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn);
    } else {
      effectFn();
    }
  }
}
function createReactive(
  data,
  isShallow = false,
  isReadOnly = false,
  isShallowReadOnly = false
) {
  let handle = {
    get(target, key, receiver) {
      if (key === "raw") return target;
      if (!isReadOnly || !isShallowReadOnly || typeof key !== "symbol") {
        track(target, key);
      }
      // 重写数组方法
      if (Array.isArray(target) && arrayInstanceMethods.hasOwnProperty(key)) {
        return Reflect.get(arrayInstanceMethods, key, receiver);
      }
      let res = Reflect.get(target, key, receiver);

      if (isShallow) return res;
      if (res && typeof res === "object") {
        if (isReadOnly) {
          return readOnly(res);
        }
        if (isShallowReadOnly) {
          return reactive(res);
        }
        return reactive(res);
      }
      return res;
    },
    set(target, key, newValue, receiver) {
      if (isReadOnly || isShallowReadOnly) {
        console.warn(`${key} is read only`);
        return true;
      }
      const triggerType = Array.isArray(target)
        ? Number(key) < target.length
          ? TriggerType["SET"]
          : TriggerType["ADD"]
        : Object.prototype.hasOwnProperty.call(target, key)
        ? TriggerType["SET"]
        : TriggerType["ADD"];
      let oldValue = target[key];
      let res = Reflect.set(target, key, newValue, receiver);
      if (receiver.raw === target) {
        if (oldValue !== newValue && (isNaN(oldValue) || isNaN(newValue))) {
          trigger(target, key, triggerType, newValue);
        }
      }

      return res;
    },
    has(target, key) {
      track(target, key);
      return Reflect.get(target, key);
    },
    ownKeys(target) {
      track(target, Array.isArray(target) ? "length" : iterateKey);
      return Reflect.ownKeys(target);
    },
    deleteProperty(target, key) {
      if (readOnly || shallowReadOnly) {
        console.warn(`${key} is read only`);
        return true;
      }
      const hasOwnKeys = Object.prototype.hasOwnProperty.call(target, key);
      const isDelete = Reflect.deleteProperty(target, key);
      if ((hasOwnKeys, isDelete)) {
        trigger(target, key, TriggerType["DELETE"]);
      }
      return isDelete;
    },
  };
  return new Proxy(data, handle);
}

function cleanup(effectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    let deps = effectFn.deps[i];
    deps.delete(effectFn);
  }
  effectFn.deps.length = 0;
}
function effect(fn, options = {}) {
  const effectFn = () => {
    cleanup(effectFn);
    activeEffect = effectFn;
    effectStack.push(activeEffect);
    let value = fn();
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
    return value;
  };
  effectFn.deps = [];
  effectFn.options = options;
  if (!options.lazy) {
    effectFn();
  }
  return effectFn;
}
function reactive(obj) {
  const existionProxy = reactiveMap.get(obj);
  if (existionProxy) return existionProxy;
  let res = createReactive(obj);
  reactiveMap.set(obj, res);
  return res;
}
function shallowReactive(obj) {
  return createReactive(obj, true);
}
function readOnly(obj) {
  return createReactive(obj, false, true);
}
function shallowReadOnly(obj) {
  return createReactive(obj, false, false, true);
}
