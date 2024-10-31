class Vue {
  constructor() {}
}
/**
 * 双向绑定
 * 响应式系统的简单实现
 */
let obj = {
  name: "zs",
  age: 15,
};
let activeEffectFn = null;
const bucket = new WeakMap();
function track(target, key) {
  console.log(target, key);
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
}
function trigger(target, key) {
  let deps = bucket.get(target);
  if (!deps) return;
  let effectFns = deps.get(key);
  effectFns.forEach((effectFn) => {
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
function effect(fn) {
  // 执行effect的fn 会导致执行proxy的get
  activeEffectFn = fn;
  fn();
}
let proxyObj = new Proxy(obj, handle);
// 执行副作用函数
effect(() => {
  console.log(proxyObj.obj1.obj2.name);
});
