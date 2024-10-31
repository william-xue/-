/*
 * @Author: freeze.xue 
 * @Date: 2024-07-19 09:42:29 
 * @Last Modified by: freeze.xue
 * @Last Modified time: 2024-07-19 14:56:00
 */

class Vue {
  constructor() { }
}
/**
 * 双向绑定
 * 响应式系统的简单实现
 */

let activeEffectFn = null;
/**
 * description
 */
const activeEffectFnStack = [];
const bucket = new WeakMap();
function track (target, key) {
  // 每个对象下面对应的属性都有一个副作用函数
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
function trigger (target, key) {
  let deps = bucket.get(target);
  if (!deps) return;
  let effectFns = deps.get(key);
  if (!effectFns) return;
  const efectsToRun = new Set(effectFns);
  efectsToRun.forEach((effectFn) => {
    if (effectFn && effectFn !== activeEffectFn) {
      if (effectFn.options.schelder) {
        effectFn.options.schelder(effectFn);
      } else {
        effectFn();
      }
    }
  });
}
let handle = {
  get (target, key, receiver) {
    // 在get中进行track收集依赖函数
    track(target, key);
    return target[key];
  },
  set (target, key, newValue, receiver) {
    target[key] = newValue;
    trigger(target, key);
    return true;
  },
};
// 清除分支
function cleanup (activeFn) {
  for (let i = 0; i < activeFn.deps.length; i++) {
    let deps = activeFn.deps[i];
    deps.delete(activeFn);
  }
  activeFn.deps.length = 0;
}
function effect (effectFn, options) {
  function activeFn () {
    cleanup(activeFn);
    activeEffectFn = activeFn;
    activeEffectFnStack.push(activeFn);
    effectFn();
    activeEffectFnStack.pop();
    activeEffectFn = activeEffectFnStack[activeEffectFnStack.length - 1];
  }
  activeFn.deps = [];
  activeFn.options = options;
  activeFn();
}
let data = {
  name: "zs",
  age: 15,
  ok: true,
};
let temp1;
let temp2;
let obj = new Proxy(data, handle);

// 调度执行 副作用函数中添加第二个参数决定trigger的时候怎么进行调度
effect(
  () => {
    obj.age++;
    console.log(obj.age);
  },
  {
    schelder (effect) {
      console.log("schelder");
      effect();
    },
  }
);
obj.age = 20;
