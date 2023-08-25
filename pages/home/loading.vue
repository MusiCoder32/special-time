<template>
    <view class="v-center vh100">
        <image class="s-rotate" style="width: 150rpx; height: 150rpx" src="/static/logo.svg"></image>
        <view class="mt25 white">{{ loadingStatus }}</view>
    </view>
    <!--    <login-withoutpwd v-show="false" ref="loginPage" />-->
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import qs from 'qs'
import { store } from '@/uni_modules/uni-id-pages/common/store'

const loadingStatus = ref('加载中...')
const loginPage = ref()
const db = uniCloud.database()

onMounted(async () => {})

onLoad(async (query) => {
    const scene = decodeURIComponent(query.scene)
    const importantId = query.importantId
    console.log(query, 'loading-query')
    if (scene && scene !== 'undefined' && scene !== '/pages/tool/printer/list/list') {
        const scene_db = db.collection('scene')
        const sceneRes = await scene_db
            .where({
                _id: scene,
            })
            .get()
        const sceneData = JSON.parse(sceneRes?.result?.data[0]?.details)
        //确认分享海报有效再执行
        if (sceneData) {
            uni.$inviteCode = sceneData.inviteCode || '' //获取分享海报中的邀请码
            sceneData.sceneId = scene
            uni.setStorage({
                key: 'sceneDetails',
                data: JSON.stringify(sceneData),
            })
        } else {
            console.log('数据库中未查询到分享海报信息')
        }
    }

    if (importantId && importantId !== 'undefined') {
        uni.setStorage({
            key: 'importantId',
            data: importantId,
        })
    }
    /**
   完成小程序自动登录改造
   1.调用LoginWithoutpwd中的login_before方法；
   2.在上方组件中搜索mutations.loginSuccess(result)，注释点登录成功提示，result.showToast设为false；
   3.在uni-id-pages-login-success事件后执行登录成功后的逻辑即可
   */
    //自动登录成功后会发送该事件
    if (store.userInfo._id) {
        uni.switchTab({
            url: '/pages/home/index',
        })
    } else {
        uni.$once('getStartSuccess', async () => {
            if (scene === '/pages/tool/printer/list/list') {
                return uni.redirectTo({
                    url: scene,
                })
            }
            uni.switchTab({
                url: '/pages/home/index',
            })
        })
    }
})
</script>
<style lang="scss">
page {
    background: $primary-color;
}
</style>
