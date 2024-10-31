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
function watcher(getter, cb, options = {}) {
  let oldValue;
  let value;
  let cleanup;
  function onInvalidatecleanup(fn) {
    cleanup = fn;
  }
  function job() {
    if (cleanup) cleanup();
    value = effectFn();
    cb(oldValue, value, onInvalidatecleanup);
    oldValue = value;
  }
  let effectFn = effect(() => getter(), {
    lazy: true,
    schelder() {
      job();
    },
  });
  if (options.immidate) {
    job();
  } else {
    oldValue = effectFn();
  }
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
let i = 2;
function ajax() {
  return new Promise(function (resolve, reject) {
    let num = Math.random();
    console.log(num);
    setTimeout(() => {
      resolve(num);
    }, i * 1000);
    i--;
  });
}
// watcher的实现原理就是使用调度执行  关键点在于调度执行中的懒执行以及调度执行中懒执行后返回的是一个edffectFn 当我们改变监听的属性的时候会执行schedler 在schedler中执行edffectFn就可以拿到最新的值  在改变属性之前调用就会拿到老的值
// 接口调用多次出现值混乱的解决办法就是把第一次的过期属性进行缓存 因为调接口属于异步操作会被阻碍 所以第二次再调接口的时候第二次操作会改变第一次的过期属性使他拿到的值始终是最新的
watcher(
  () => obj.age,
  async (oldValue, value, onInvalidatecleanup) => {
    let expire = false;
    let r;
    onInvalidatecleanup(() => {
      expire = true;
    });
    let res = await ajax(i);
    if (!expire) {
      r = res;
    }
    console.log(r);
  },
  {
    immidate: false,
  }
);
btn.onclick = function () {
  obj.age++;
};
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
