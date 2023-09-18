<template>
        <uni-fab
            v-if="showFab"
            :pattern="{
                buttonColor: '#3494F8',
                icon: 'home-filled',
            }"
            ref="fab"
            horizontal="right"
            vertical="bottom"
            :pop-menu="false"
            @fabClick="fabClick"
        />
</template>

<script setup>
const showFab = ref(false) //用于扫码进入该页面时提供回到主页按钮

onMounted(() => {
    const pages = getCurrentPages()
    if (pages.length === 1) {
        showFab.value = true
    }
})
function fabClick() {
    uni.switchTab({
        url: '/pages/home/index',
    })
}
</script>

<style lang="scss" scoped></style>
