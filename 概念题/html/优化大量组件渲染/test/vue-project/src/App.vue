<template>
  <header>
    <div class="wrapper">
      <div style="width: 33%;" v-for="(item, index) in 1000">
        <HeavyComponent v-if="defer(index)"></HeavyComponent>
      </div>
    </div>
  </header>
</template>
<script>
import { defineComponent, ref } from "vue";
import useDefer from "./components/defer.js";
import HeavyComponent from "./components/HeavyComponent.vue";
export default defineComponent({
  name: "",
  setup() {
    const count = ref(1000);
    const defer = useDefer();
    return {
      count,
      defer,
    };
  },
  components: {
    HeavyComponent,
  },
});
</script>
<style scoped>
header {
  line-height: 1.5;
}
.wrapper {
  display: flex;
  flex-wrap: wrap;
}
.logo {
  display: block;
  margin: 0 auto 2rem;
}
</style>
