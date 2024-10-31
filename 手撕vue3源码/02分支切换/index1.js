
/**
 * 双向绑定
 * 响应式系统的简单实现
 */

let n = 0;
let activeEffectFn = null;
const bucket = new WeakMap();

function track (target, key) {

  n++
  console.log('第几次n: ', n);

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
  activeEffectFn.deps.add(effectFns);
  console.log('activeEffectFn.deps收集的副作用函数: ', activeEffectFn.deps);
  console.log('target: ', target);
  console.log('bucket: ', bucket);
  console.log('第几次n: ', n);

}
function trigger (target, key) {
  let deps = bucket.get(target);
  if (!deps) return;
  let effectFns = deps.get(key);
  console.log('key----effectFns: ', key, effectFns);
  if (!effectFns) return;
  const efectsToRun = new Set(effectFns);
  efectsToRun.forEach((effectFn) => {
    effectFn();
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
function cleanup1 (activeFn) {
  console.log('Before cleanup:', activeFn.deps);
  for (let i = 0; i < activeFn.deps.length; i++) {
    let deps = activeFn.deps[i]; //这个是桶里面的set 每个属性下set里面包含的是它对应的副作用函数

    console.log('deps: ', deps);
    deps.delete(activeFn);
  }
  console.log('清楚里的bucket', JSON.parse(JSON.stringify(bucket)));
  activeFn.deps.length = 0;
  console.log('After cleanup:', activeFn.deps);
}
function cleanup (activeFn) {
  console.log('Before cleanup:', activeFn.deps);
  activeFn.deps.forEach(deps => {
    console.log('deps: ', deps);
    deps.delete(activeFn);
  });
  activeFn.deps.clear(); // 清空访问过的属性集合
}

function effect (effectFn) {
  // 执行effect的fn 会导致执行proxy的get
  function activeFn () {
    cleanup(activeFn);
    activeEffectFn = activeFn;
    effectFn();
  }
  activeFn.deps = new Set();
  activeFn();
}
let data = {
  name: "zs",
  age: 15,
  ok: true,
};
let obj = new Proxy(data, handle);

// 问题点引出 分支切换
// 当ok为true的时候 副作用函数中应该收集的依赖是ok和name
// 当ok为false的时候副作用函数收集的依赖应该只是ok
// 所以问题来了无论ok为true还是false 当我改变那么的时候都会触发副作用函数这是错误的

// 这是因为第一次ok为true的时候副作用函数收集的是ok和name 这两个属性下面都有副作用函数 所以当ok变成false的时候会触发副作用函数
// 解决思路就是当我们每次trigger的时候effect中会触发get 就是属性会重新进行依赖收集 这时候我们就可以进行清除一下属性的分支 把我们没有访问到的属性从桶里面给清除出去 关键函数为cleanup
effect(() => {
  console.log("effect");
  if (obj.ok) {
    console.log(obj.name);
  }
});

console.log('开始改变 ok的值')

obj.ok = false;
obj.name = 'dsjcsdckj'
console.log("====================================");
console.log(bucket);
console.log("====================================");
console.log('改变 ok的值 结束')
