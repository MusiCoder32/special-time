<template>
    <view class="v-center vh100 home">
        <image class="rotate" style="width: 150rpx; height: 150rpx" src="/static/logo.svg"></image>
        <view class="mt25 white">{{ loadingStatus }}</view>
    </view>
    <!--    <login-withoutpwd v-show="false" ref="loginPage" />-->
    <uni-id-pages-fab-login v-show="false" ref="loginPage"></uni-id-pages-fab-login>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import LoginWithoutpwd from '../../uni_modules/uni-id-pages/pages/login/login-withoutpwd'

const loadingStatus = ref('加载中...')

const loginPage = ref()

onMounted(async () => {
    console.log('mounted1')
    await loginPage.value.login_before('weixin', false, {})
    /**
  完成小程序自动登录改造
   1.调用LoginWithoutpwd中的login_before方法；
   2.在上方组件中搜索mutations.loginSuccess(result)，注释点登录成功提示，result.showToast设为false；
   3.在uni-id-pages-login-success事件后执行登录成功后的逻辑即可
   */
    //自动登录成功后会发送该事件
    uni.$once('uni-id-pages-login-success', () => {
        getStartEndTime()
    })
    console.log('mounted2')
})
onLoad((query) => {
    console.log('onload1')
    const scene = decodeURIComponent(query.scene)
    console.log(query)
    const importantId = query.importantId

    if (scene && scene !== 'undefined') {
        uni.setStorage({
            key: 'sceneId',
            data: scene,
        })
    }
    if (importantId && importantId !== 'undefined') {
        uni.setStorage({
            key: 'importantId',
            data: importantId,
        })
    }
    console.log('onload2')
})

async function getStartEndTime() {
    console.log(555)
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
            // 加载失败也进入首页，因为能进入这个页面说明已登陆，即使在该页面请求失败，也进入首页重新请求数据
            // 若仍请求失败会使用首页的模拟数据
            // loadingStatus.value = '加载失败，请退出小程序重试'
            uni.switchTab({
                url: '/pages/home/index',
            })
        }
    } catch (e) {
        // loadingStatus.value = '加载失败，请退出小程序重试'
        uni.switchTab({
            url: '/pages/home/index',
        })
    }
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
