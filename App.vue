<script>
import initApp from '@/common/appInit.js'

import { loginAuto } from './utils/login'

uni.$navStatusHeight = 0

function update() {
    const updateManager = wx.getUpdateManager()

    updateManager.onCheckForUpdate(function (res) {
        // 请求完新版本信息的回调
        console.log(res.hasUpdate)
    })

    updateManager.onUpdateReady(function () {
        wx.showModal({
            title: '更新提示',
            content: '新版本已经准备好，是否重启应用？',
            success: function (res) {
                if (res.confirm) {
                    uni.clearStorage()
                    // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                    updateManager.applyUpdate()
                }
            },
        })
    })

    updateManager.onUpdateFailed(function () {
        // 新版本下载失败
    })
}

export default {
    globalData: {
        pushClientId: '',
        searchText: '',
        appVersion: {},
        config: {
            about: {
                appName: '是时光丫',
                logo: '/static/logo.svg',
                slogan: '记录美好时光',
            },
        },
    },
    onLaunch: async function (e) {
        const { scene, query } = e
        console.log('App Launch', e)
        /**
         * 1154则代表从朋友圈分享页，1155代表从朋友圈点击进入小程序，效果与1007相同,1007代表聊天界面进入
         * 由于朋友圈只能使用当前分享页面，要正常使用必须进入小程序，故可不用考虑用户登录与否
         * 聊天分享则需考虑用户是否登录
         */
        uni.$startScene = scene
        const { inviteCode, sceneId } = query
        if (inviteCode && sceneId) {
            uni.setStorage({
                key: 'sceneDetails',
                data: JSON.stringify(query),
            })
        }

        // uni.onPushMessage((res) => {
        //     console.log('收到推送消息：', res) //监听推送消息
        // })
        // // uni-app客户端获取push客户端标记
        // uni.getPushClientId({
        //     success: (res) => {
        //         console.log('客户端推送标识:', res.cid)
        //         this.globalData.pushClientId = res.cid
        //     },
        //     fail(err) {
        //         console.log(err)
        //     },
        // })

        if (scene !== 1154) {
            initApp()

            /**
             * 自动登录并初始化好需要的startDate和special-day
             * */

            const localUserInfo = uni.getStorageSync('userInfo')
            if (localUserInfo && localUserInfo.token) {
                await loginAuto(e)
                
            }
        
            //将部分公用数据挂载到uni对象
            setTimeout(() => {
                let systemInfo = uni.getSystemInfoSync()
                uni.$mpVersion = systemInfo.hostSDKVersion
                // #ifdef MP-WEIXIN
                update() //检查小程序版本
                // #endif
                const navBarHeight = 44
                const statusBarHeight = uni.getSystemInfoSync().statusBarHeight
                uni.$navStatusHeight = (navBarHeight + statusBarHeight) * 2
                uni.$statusBarHeight = statusBarHeight * 2
            })
        }
    },
    onShow: function () {
        console.log('App Show')
    },
    onHide: function () {
        console.log('App Hide')
    },
}
</script>

<style lang="scss">
@import './scss/main.scss';
/*每个页面公共css */
</style>
