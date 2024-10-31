function normalizeClass(value) {
  let res = "";
  if (typeof value === "string") {
    res = value;
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const normalized = normalizeClass(value[i]);
      if (normalized) {
        res += normalized + " ";
      }
    }
  } else if (typeof value === "object") {
    for (const name in value) {
      if (value[name]) {
        res += name + " ";
      }
    }
  }
  return res.trim();
}


function findJ(arr) {
  let arr_max = [];
  let cache = [];
  for (var i = 0; i < arr.length; i++) {
    cache.push([]);
  }
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < i; j++) {
      if (arr[j] < arr[i]) {
        if (cache[i].length < cache[j].length + 1) {
          cache[i] = [].concat(cache[j]);
        }
      }
    }
    cache[i].push(arr[i]);
    if (cache[i].length > arr_max.length) {
      arr_max = [].concat(cache[i]);
    }
  }
  return arr_max;
}

