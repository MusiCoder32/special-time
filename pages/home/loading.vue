<template>
    <view class="v-center vh100">
        <image class="s-rotate" style="width: 150rpx; height: 150rpx" src="/static/logo.svg"></image>
        <view class="mt25 white">{{ loadingStatus }}</view>
    </view>
    <!--    <login-withoutpwd v-show="false" ref="loginPage" />-->
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'

const loadingStatus = ref('加载中...')

onLoad(async (query) => {
    const importantId = query.importantId
    if (importantId && importantId !== 'undefined') {
        uni.setStorage({
            key: 'importantId',
            data: importantId,
        })
    }
})
</script>
<style lang="scss">
page {
    background: $primary-color;
}
</style>
