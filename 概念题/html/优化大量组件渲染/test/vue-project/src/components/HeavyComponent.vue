<template>
  <div class="box">
    <div class="item" v-for="item in count" :key="item"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
export default defineComponent({
  name: "",
  setup() {
    const count = ref(1000);
    return {
      count,
    };
  },
});
</script>
<style scoped>
.box {
  border: 1px solid #ccc;
}
.item {
  height: 1px;
  margin-top: 1px;
  width: 100%;
  background-color: red;
}
</style>
