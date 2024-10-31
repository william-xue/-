// 分支切换问题解决方案
let data = {
  test: "test",
  ok: true,
};
// 例如 data的数据类型 绑定副作用函数后的结构是
weakMap[data][test] = fn1;
weakMap[data][ok] = fn2;
