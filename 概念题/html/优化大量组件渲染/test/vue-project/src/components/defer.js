import { ref } from "vue";

const useDefer = (maxContent = 800) => {
  let curTime = ref(0);
  function update() {
    curTime.value++;
    if (curTime >= maxContent) {
      return;
    }
    requestAnimationFrame(update);
  }
  update();
  function defer(n) {
    return curTime.value >= n;
  }
  return defer;
};

export default useDefer;
