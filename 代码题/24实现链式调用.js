function arrage(name) {
  const task = [
    function () {
      console.log(`${name}`);
    },
  ];
  const obj = {
    do: function (name) {
      task.push(function () {
        console.log(`start to${name}`);
      });
      return obj;
    },
    wait: function (delay) {
      task.push(function () {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, delay * 1000);
        });
      });
      return obj;
    },
    waiteFirst: function (delay) {
      task.unshift(function () {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, delay * 1000);
        });
      });
      return obj;
    },
    execute: async function () {
      for (let i = 0; i < task.length; i++) {
        await task[i]();
      }
    },
  };
  return obj;
}

// arrage("willem").execute();
// willem
// start to commit

// arrage("willem").wait(5).do("commit").execute();
// willem
// 等待5秒
// start to commit

arrage("willem").waiteFirst(5).do("commit").execute();

// // 等待5秒
// // willem
// // start to commit
