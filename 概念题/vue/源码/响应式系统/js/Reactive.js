class Reactive {
  constructor() {
    this.bucket = new WeakMap();
    this.activeEffect = null;
    this.effect_stack = [];
  }
  proxy(data) {
    let that = this;
    let handle = {
      get(target, key,receiver) {
        console.log(target,receiver);
        that.track(target, key);
        return target[key];
      },
      set(target, key, newValue) {
        console.log(target);
        target[key] = newValue;
        that.trigger(target, key);
        return true;
      },
    };
    return new Proxy(data, handle);
  }
  cleanup(effectFn) {
    for (let i = 0; i < effectFn.deps.length; i++) {
      let deps = effectFn.deps[i];
      deps.delete(effectFn);
    }
    effectFn.deps.length = 0;
  }
  effect(fn, options = {}) {
    const effectFn = () => {
      this.cleanup(effectFn);
      this.activeEffect = effectFn;
      this.effect_stack.push(this.activeEffect);
      let value = fn();
      this.effect_stack.pop();
      this.activeEffect = this.effect_stack[this.effect_stack.length - 1];
      return value;
    };
    effectFn.deps = [];
    effectFn.options = options;
    if (!options.lazy) {
      effectFn();
    }
    return effectFn;
  }
  track(target, key) {
    if (!this.activeEffect) return target[key];
    let depsMap = this.bucket.get(target);
    if (!depsMap) {
      this.bucket.set(target, (depsMap = new Map()));
    }
    let deps = depsMap.get(key);
    if (!deps) {
      depsMap.set(key, (deps = new Set()));
    }
    deps.add(this.activeEffect);
    this.activeEffect.deps.push(deps);
  }
  trigger(target, key) {
    let depsMap = this.bucket.get(target);
    if (!depsMap) return;
    let deps = depsMap.get(key);
    const effectToRun = new Set(deps);
    for (const effect of effectToRun) {
      if (effect && effect !== this.activeEffect) {
        if (effect.options.scheduler) {
          effect.options.scheduler(effect);
        } else {
          effect();
        }
      }
    }
  }
}
