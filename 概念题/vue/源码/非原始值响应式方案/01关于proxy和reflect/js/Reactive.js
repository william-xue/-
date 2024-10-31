class Reactive {
  static TriggerType = {
    SET: "SET",
    ADD: "ADD",
    DELETE: "DELETE",
  };
  constructor() {
    this.iterateKey = Symbol();
    this.bucket = new WeakMap();
    this.activeEffect = null;
    this.effectStack = [];
  }
  proxy(data) {
    let that = this;
    let handle = {
      get(target, key, receiver) {
        that.track(target, key);
        return Reflect.get(target, key, receiver);
      },
      set(target, key, newValue, receiver) {
        const triggerType = Object.prototype.hasOwnProperty.call(target, key)
          ? Reactive.TriggerType["SET"]
          : Reactive.TriggerType["ADD"];
        let currentValue = target[key];
        if (currentValue === newValue) return;
        target[key] = newValue;
        Reflect.set(target, key, newValue, receiver);
        that.trigger(target, key, triggerType);
        return true;
      },
      has(target, key) {
        that.track(target, key);
        return Reflect.get(target, key);
      },
      ownKeys(target) {
        that.track(target, that.iterateKey);
        return Reflect.ownKeys(target);
      },
      deleteProperty(target, key) {
        const hasOwnKeys = Object.prototype.hasOwnProperty.call(target, key);
        const isDelete = Reflect.deleteProperty(target, key);
        if (hasOwnKeys && isDelete) {
          that.trigger(target, key, Reactive.TriggerType["DELETE"]);
        }
        return isDelete;
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
      this.effectStack.push(this.activeEffect);
      let value = fn();
      this.effectStack.pop();
      this.activeEffect = this.effectStack[this.effectStack.length - 1];
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
  trigger(target, key, type = "") {
    let depsMap = this.bucket.get(target);
    if (!depsMap) return;
    const iteratorEffectFns = depsMap.get(this.iterateKey);
    let effects = depsMap.get(key);
    const effectToRun = new Set();

    if (type === "ADD" || type === "DELETE") {
      iteratorEffectFns &&
        iteratorEffectFns.forEach((iteratorEffectFn) => {
          if (iteratorEffectFn !== this.activeEffect) {
            effectToRun.add(iteratorEffectFn);
          }
        });
    }

    effects &&
      effects.forEach((effect) => {
        if (effect && effect !== this.activeEffect) {
          effectToRun.add(effect);
        }
      });
    for (const effectFn of effectToRun) {
      if (effectFn.options.scheduler) {
        effectFn.options.scheduler(effectFn);
      } else {
        effectFn();
      }
    }
  }
}
