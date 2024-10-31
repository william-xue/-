function loop() {
  let time = Date.now();
  while (true) {
    if (Date.now() - time > 5000) {
      break;
    }
  }
}
// let time3;

// let time1 = Date.now();
// setTimeout(() => {
//   console.log(`同步代码执行完毕后 settimeout延迟${Date.now() - time3}后执行`);
// }, 3000);
// let time2 = Date.now();
// console.log(`settimeout执行时间${time2 - time1}ms`);

// let time = Date.now();
// while (true) {
//   if (Date.now() - time > 2000) {
//     break;
//   }
// }
// console.log("执行完毕");
// time3 = Date.now();
console.time("myCode");

setTimeout(() => {
  console.log("settimeout2");
}, 3);
setTimeout(() => {
  // loop();
  console.log("settimeout1");
}, 0);
console.timeEnd("myCode");
