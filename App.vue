<script>
import initApp from '@/common/appInit.js'
import openApp from '@/common/openApp.js'
// #ifdef H5
openApp() //创建在h5端全局悬浮引导用户下载app的功能
// #endif
import uniIdPageInit from '@/uni_modules/uni-id-pages/init.js'
import { loginAuto } from '@/utils/login'

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
        $i18n: {},
        $t: {},
    },
    onLaunch: async function (e) {
        const { scene, query } = e
        console.log('App Launch', e)
        /**
         * 1154则代表从朋友圈进入,1007代表聊天界面进入
         * 由于朋友圈只能使用当前分享页面，要正常使用必须进入小程序，故可不用考虑用户登录与否
         * 聊天分享则需考虑用户是否登录
         */
        uni.$startScene = scene
        const { inviteCode, sceneId, userId } = query
        if (inviteCode) {
            uni.$inviteCode = inviteCode
            uni.setStorage({
                key: 'sceneDetails',
                data: JSON.stringify({ inviteCode, sceneId, userId }),
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

        initApp()
        uniIdPageInit()
        loginAuto() //用户在打开小程序时便自动登录成功，故只需要判断是否初始化
        console.log('用户在打开小程序时便自动登录成功，故只需要判断是否初始化')
        //将部分公用数据挂载到uni对象
        setTimeout(() => {
            let systemInfo = uni.getSystemInfoSync()
            uni.$mpVersion = systemInfo.hostSDKVersion
            // #ifdef MP-WEIXIN
            update() //检查小程序版本
            // #endif
            this.globalData.$i18n = this.$i18n
            this.globalData.$t = (str) => this.$t(str)
            const navBarHeight = 44
            const statusBarHeight = wx.getSystemInfoSync().statusBarHeight
            uni.$navStatusHeight = navBarHeight + statusBarHeight
        })
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
