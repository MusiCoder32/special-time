<template>
    <view class="v-center vh100">
        <image class="s-rotate" style="width: 150rpx; height: 150rpx" src="/static/logo.svg"></image>
        <view class="mt25 white">{{ loadingStatus }}</view>
    </view>
    <!--    <login-withoutpwd v-show="false" ref="loginPage" />-->
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const loadingStatus = ref('加载中...')
const loginPage = ref()
const db = uniCloud.database()

onMounted(async () => {})

onShow(() => {
    console.log('loading-show')
})

onLoad(async (query) => {
    console.log('loading-query', query)
    //自动登录成功后会发送该事件
    uni.$once('getStartSuccess', async () => {
        uni.switchTab({
            url: '/pages/home/index',
        })
    })
    const importantId = query.importantId
    if (importantId && importantId !== 'undefined') {
        uni.setStorage({
            key: 'importantId',
            data: importantId,
        })
    }
    if (uni.$getStartSuccess) {
        uni.switchTab({
            url: '/pages/home/index',
        })
    }
})
</script>
<style lang="scss">
page {
    background: $primary-color;
}
</style>
