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
    return Reflect.get(target, key, receiver);
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
// 当我们把data中的bar变成访问器属性的时候 用obj代理data 通过obj.bar进行访问的时候里面的this指向的依旧是data而不是obj
let data = {
  foo: "1",
  get bar() {
    console.log(this);
    return this.foo;
  },
};
console.log(data);
let obj = new Proxy(data, handle);
effect(() => {
  console.log(obj.bar);
});
obj.foo = 8;
