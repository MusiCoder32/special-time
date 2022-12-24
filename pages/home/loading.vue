<template>
    <view class="v-center vh100 home">
        <image class="rotate" style="width: 150rpx; height: 150rpx" src="/static/logo.svg"></image>
        <view class="mt25 white">{{ loadingStatus }}</view>
    </view>
</template>

<script setup>
import { ref } from 'vue'

const loadingStatus = ref('加载中...')

getStartEndTime()

async function getStartEndTime() {
    const db = uniCloud.database()
    try {
        const {
            result: { errCode, data },
        } = await db
            .collection('start-end-time')
            .where({
                user_id: db.getCloudEnv('$cloudEnv_uid'),
            })
            .get()

        if (errCode == 0) {
            if (data.length === 0) {
                uni.redirectTo({
                    url: '/pages/home/guide',
                })
            } else {
                uni.setStorageSync('startEndData', JSON.stringify(data[0]))
                uni.switchTab({
                    url: '/pages/home/index',
                })
            }
        } else {
            loadingStatus.value = '加载失败，请重新登陆'

            uni.showToast({
                icon: 'none',
                title: errCode,
            })
            toLogin()
        }
    } catch (e) {
        loadingStatus.value = '加载失败，请重新登陆'
        toLogin()
    }
}
function toLogin() {
    uni.redirectTo({
        url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd',
    })
}
</script>
<style lang="scss">
@keyframes logo-rotate {
    from {
        transform: rotate(0);
    }
    to {
        transform: rotate(360deg);
    }
}
.home {
    background: $primary-color;
}

.rotate {
    animation: logo-rotate 3s linear infinite;
}
</style>
