/**
 * 双向绑定
 * 响应式系统的简单实现
 */

let activeEffectFn = null;
const activeEffectFnStack = [];
const bucket = new WeakMap();

function track (target, key) {
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

function trigger (target, key) {
    let deps = bucket.get(target);
    if (!deps) return;

    let effectFns = deps.get(key);
    if (!effectFns) return;

    const effectsToRun = new Set(effectFns);
    effectsToRun.forEach(effectFn => {
        if (effectFn !== activeEffectFn) {
            if (effectFn.options && effectFn.options.scheduler) {
                effectFn.options.scheduler(effectFn);
            } else {
                effectFn();
            }
        }
    });
}

let handle = {
    get (target, key, receiver) {
        track(target, key);
        return target[key];
    },
    set (target, key, newValue, receiver) {
        target[key] = newValue;
        trigger(target, key);
        return true;
    },
};

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

let data1 = { value: 10 };
let data2 = { value: 20 };

let obj1 = new Proxy(data1, handle);
let obj2 = new Proxy(data2, handle);

function effect1 () {
    console.log('effect1:', obj1.value);
}

function effect2 () {
    console.log('effect2:', obj2.value);
    effect(effect1); // 嵌套调用 effect1
}

effect(effect2); // 注册 effect2

obj1.value = 15; // 触发 effect1
obj2.value = 25; // 触发 effect2 和 effect1


