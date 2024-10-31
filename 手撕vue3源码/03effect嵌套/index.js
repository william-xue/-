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
    effectFn();
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
    let deps = activeFn.deps[i]; //这个是桶里面的set 每个属性下set里面包含的是它对应的副作用函数
    deps.delete(activeFn);
  }
  activeFn.deps.length = 0;
}
function effect(effectFn) {
  // 执行effect的fn 会导致执行proxy的get
  function activeFn() {
    cleanup(activeFn);
    activeEffectFn = activeFn;
    activeEffectFnStack.push(activeFn);
    effectFn();
    activeEffectFnStack.pop();
    activeEffectFn = activeEffectFnStack[activeEffectFnStack.length - 1];
  }
  activeFn.deps = [];
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

// 当effect中含有另外一个effect的时候 effect1中是绑定了 当我们改变age的时候effect2执行 当我们改变name的时候也是effect2执行 这样会出问题 因为当改变name的时候应该执行effect1和effect2
// 问题就是当我们执行effect2的副作用函数的时候activeEffectFn会覆盖effect1中的activeEffectFn全局函数导致只执行effect2
effect(() => {
  temp1 = obj.age;
  console.log("effect 1");
  effect(() => {
    console.log("effect 2");
  });
});
obj.age = 11;
