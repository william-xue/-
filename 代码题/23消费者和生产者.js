function* consumer() {
  while (true) {
    yield "消费者消费";
  }
}

function* producte() {
  while (true) {
    yield "生产者生产";
  }
}
let prdGen = producte();
let consumerGen = consumer();
let i = 0;
let arr = [prdGen, consumerGen];
function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

(async () => {
  while (true) {
    console.log(arr[i].next().value);
    await sleep(1000);
    i++;
    if (i == 2) {
      i = 0;
    }
  }
})();
