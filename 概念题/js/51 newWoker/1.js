function add(a, b) {
  return a + b;
}

setTimeout(() => {
  postMessage(add(5, 8));
}, 1000);
