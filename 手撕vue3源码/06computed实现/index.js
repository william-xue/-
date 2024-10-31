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
function trigger(target, key) {
  let deps = bucket.get(target);
  if (!deps) return;
  let effectFns = deps.get(key);
  if (!effectFns) return;
  const efectsToRun = new Set(effectFns);
  efectsToRun.forEach((effectFn) => {
    if (effectFn && effectFn !== activeEffectFn) {
      if (effectFn.options && effectFn.options.schelder) {
        effectFn.options.schelder(effectFn);
      } else {
        effectFn();
      }
    }
  });
}
let handle = {
  get(target, key, receiver) {
    // 在get中进行track收集依赖函数
    track(target, key);
    return target[key];
  },
  set(target, key, newValue, receiver) {
    target[key] = newValue;
    trigger(target, key);
    return true;
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
function computed(getter) {
  let cache;
  let effectFn = effect(getter, {
    schelder() {
      cache = false;
      trigger(obj, "value");
    },
    lazy: true,
  });
  let res = effectFn();

  let obj = {
    get value() {
      if (!cache) {
        res = effectFn();
        cache = true;
        track(obj, "value");

        console.log("get");
      }
      return res;
    },
  };

  return obj;
}
let data = {
  name: "zs",
  age: 15,
  num: 1,
  ok: true,
};
let temp1;
let temp2;
let obj = new Proxy(data, handle);

// computed属性的实现原理就是使用调度执行 simpleAttribute的值就是obj.age 当obj.age变化的时候也会触发计算属性更新
let simpleAttribute = computed(() => {
  return obj.age + obj.num;
});

// effect(() => {
//   console.log(simpleAttribute.value);
// });
console.log(simpleAttribute.value);

obj.age++;
console.log(simpleAttribute.value);
// effect(
//   () => {
//     obj.age++;
//     console.log(obj.age);
//   },
//   {
//     schelder(effect) {
//       console.log("schelder");
//       effect();
//     },
//   }
// );
