function overloadFunction() {
  let map = new Map();
  function getSearch(...args) {
    let paramsStr = args.map((param) => typeof param).join(",");
    const runFn = map.get(paramsStr);
    runFn && runFn(...args);
  }
  getSearch.addImpl = function (...args) {
    const runFn = args.pop();
    if (!runFn || typeof runFn !== "function") {
      throw new Error("The last params must be a function");
    }
    const params = args.join(",");
    map.set(params, runFn);
  };
  return getSearch;
}

const getSearch = overloadFunction();

getSearch.addImpl("number", (a) => {
  console.log(a);
});

getSearch.addImpl("number", "string", (a, b) => {
  console.log(a, b);
});

getSearch(1);
getSearch(1, 12);
