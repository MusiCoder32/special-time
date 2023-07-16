<template>
    <view class="v-center vh100">
        <button style="w30" type="primary" class="mb50" @click="goTo(1)">打印机使用说明</button>
        <button style="w30" type="primary">文稿格式</button>
    </view>
</template>

<script setup>
function goTo(type) {
    if (type === 1) {
        uni.navigateTo({
            url: '/pages/tool/printer/print',
        })
    }
}
</script>

<style lang="scss" scoped></style>
