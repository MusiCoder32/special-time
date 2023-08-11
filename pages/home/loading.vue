<template>
    <view class="v-center vh100">
        <image class="s-rotate" style="width: 150rpx; height: 150rpx" src="/static/logo.svg"></image>
        <view class="mt25 white">{{ loadingStatus }}</view>
    </view>
    <!--    <login-withoutpwd v-show="false" ref="loginPage" />-->
    <uni-id-pages-fab-login v-show="false" ref="loginPage"></uni-id-pages-fab-login>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const loadingStatus = ref('加载中...')
const loginPage = ref()
const db = uniCloud.database()

onMounted(async () => {})

onLoad(async (query) => {
    const scene = decodeURIComponent(query.scene)
    const importantId = query.importantId
    console.log(scene, 'scene')
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
    nextTick(() => {
        loginPage.value.login_before('weixin', false, {})
    })
    /**
   完成小程序自动登录改造
   1.调用LoginWithoutpwd中的login_before方法；
   2.在上方组件中搜索mutations.loginSuccess(result)，注释点登录成功提示，result.showToast设为false；
   3.在uni-id-pages-login-success事件后执行登录成功后的逻辑即可
   */
    //自动登录成功后会发送该事件
    uni.$once('uni-id-pages-login-success', () => {
        if (scene === '/pages/tool/printer/list/list') {
            return uni.redirectTo({
                url: scene,
            })
        }
        getStartEndTime()
    })
})

async function getStartEndTime() {
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
                uni.switchTab({
                    url: '/pages/home/index',
                })
            } else {
                const { start_time, startType, leap, end_time, show_end_time } = data[0]
                uni.setStorageSync(
                    'startData',
                    JSON.stringify({
                        start_time,
                        startType,
                        leap,
                    }),
                )
                uni.setStorageSync(
                    'endData',
                    JSON.stringify({
                        end_time,
                        show_end_time,
                    }),
                )
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
page {
    background: $primary-color;
}
</style>
