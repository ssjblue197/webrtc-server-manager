<template>
    <div style="position: fixed; width: 100%; z-index: 1009; background-color: black;" class="pt-2 pb-2">
      <img alt="Vue logo" src="../assets/logo.png" style="max-width: 40px;">
      <Toasts
        :time-out="3000"
        :closeable="false"
      ></Toasts>
    </div>
</template>

<script>
    export default {
        
    }
</script>

<style lang="scss" scoped>

</style>