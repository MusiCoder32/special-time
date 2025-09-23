<script setup>
import initApp from '@/common/appInit.js'
import { loginAuto } from './utils/login'
import { getStartEndTime } from './utils/login'

import { useUserStore } from './utils/stores'
const userStore = useUserStore()

uni.$navStatusHeight = 0

function update() {
    const updateManager = wx.getUpdateManager()
    updateManager.onCheckForUpdate(function (res) {
        console.log(res.hasUpdate)
    })
    updateManager.onUpdateReady(function () {
        wx.showModal({
            title: '更新提示',
            content: '新版本已经准备好，是否重启应用？',
            success: function (res) {
                if (res.confirm) {
                    uni.clearStorage()
                    updateManager.applyUpdate()
                }
            },
        })
    })
    updateManager.onUpdateFailed(function () {})
}

onLaunch(async (e) => {
    const { scene, query } = e
    console.log('App Launch', e)
    uni.$startScene = scene
    const { inviteCode, sceneId } = query
    if (inviteCode && sceneId) {
        uni.setStorage({
            key: 'sceneDetails',
            data: query,
        })
    }

    if (scene !== 1154) {
        initApp()

        const time1 = +new Date()
        console.log('调用loginAuto开始', time1)
        const loginRes = await loginAuto(e, userStore.userInfo.value?._id)
        userStore.setUserInfo(loginRes.userInfo)
        if(loginRes.newUser){
            await getStartEndTime()
        }
        const time2 = +new Date()
        console.log('调用loginAuto结束', time2 - time1)

        // 这里 userId 变量未定义，建议根据实际逻辑传递
        // await getStartEndTime(userId)

        let systemInfo = uni.getSystemInfoSync()
        uni.$mpVersion = systemInfo.hostSDKVersion
        // #ifdef MP-WEIXIN
        setTimeout(() => {
            update()
        }, 10 * 1000)
        // #endif
        const navBarHeight = 44
        const statusBarHeight = uni.getSystemInfoSync().statusBarHeight
        uni.$navStatusHeight = (navBarHeight + statusBarHeight) * 2
        uni.$statusBarHeight = statusBarHeight * 2

        uni.switchTab({ url: '/pages/home/index' })
    }
})

onShow(() => {
    console.log('App Show')
})

onHide(() => {
    console.log('App Hide')
})
</script>

<style lang="scss">
@import './scss/main.scss';
/*每个页面公共css */
</style>
