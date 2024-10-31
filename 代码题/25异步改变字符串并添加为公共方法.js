// 首先有一个getName方法 会异步将字符串中数字前面加上一个name
let template = "234,55-234_j24——455dawd3214wfxfd";
function getName(num) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(`name${num}`);
    }, 0);
  });
}
String.prototype.replaceAllAsync = async function (pattern, asyncFn) {
  let reg;
  if (pattern instanceof RegExp) {
    if (!pattern.global) {
      throw new TypeError("reg must be a global RegExp");
    }
    reg = new RegExp(pattern);
  } else if (typeof pattern === "string") {
    pattern = pattern.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
    reg = new RegExp(pattern, "g");
  } else {
    throw new TypeError("pattern must be a RegExp or a string");
  }
  const str = this;
  let match;
  let lastIndex = 0;
  const arr = [];
  while ((match = reg.exec(str)) !== null) {
    const [value] = match;
    const index = match.index;
    const notMath = match.input.slice(lastIndex, index);
    lastIndex = match.index + value.length;
    arr.push(notMath, getName(value));
  }
  const notMath = str.slice(lastIndex);
  arr.push(notMath);
  let res = await Promise.all(arr);
  return res.join("");
};

async function test() {
  const result = await template.replaceAllAsync(/\d+/g, async (match) =>
    getName(match)
  );
  console.log(result);
}

test();