// 用于存储所有的依赖
const bucket = new WeakMap();

// 当前活跃的副作用函数
let activeEffectFn = null;

function track (target, key) {
  if (activeEffectFn === null) return; // 如果没有活跃的副作用函数，直接返回

  let depsMap = bucket.get(target);
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()));
  }

  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }

  deps.add(activeEffectFn);
  activeEffectFn.deps.add(deps); // 将当前副作用函数的依赖集合记录在 deps 中
}

function trigger (target, key) {
  const depsMap = bucket.get(target);
  if (!depsMap) return;

  const effectFns = depsMap.get(key);
  if (effectFns) {
    effectFns.forEach(effectFn => effectFn());
  }
}

function cleanup (effectFn) {
  // 清除当前副作用函数的依赖
  effectFn.deps.forEach(deps => {
    deps.forEach(dep => {
      if (!effectFn.deps.has(dep)) {
        deps.delete(dep);
      }
    });
  });
  effectFn.deps.clear(); // 清空访问过的属性集合
}


function effect (fn) {
  const effectFn = function () {
    cleanup(effectFn); // 清理上一次的依赖
    effectFn.deps = new Set(); // 初始化访问过的属性集合
    activeEffectFn = effectFn;
    fn(); // 执行副作用函数
    activeEffectFn = null;
  };
  effectFn.deps = new Set(); // 初始化依赖集合
  effectFn(); // 立即执行副作用函数
}

// 示例对象
const obj = {
  ok: true,
  name: 'example'
};

// 代理对象
const handler = {
  get (target, key, receiver) {
    track(target, key); // 访问属性时进行追踪
    return Reflect.get(target, key, receiver);
  },
  set (target, key, newValue, receiver) {
    const result = Reflect.set(target, key, newValue, receiver);
    trigger(target, key); // 设置属性时触发依赖
    return result;
  }
};

const proxy = new Proxy(obj, handler);

// 创建副作用函数
effect(() => {
  if (proxy.ok) {
    console.log(proxy.name); // 访问属性，触发 track
  }
});

//proxy.ok = false
// 修改属性触发副作用函数
//proxy.name = 'new example'; // 触发 trigger
