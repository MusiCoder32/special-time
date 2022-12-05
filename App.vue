<script>
import initApp from '@/common/appInit.js'
import openApp from '@/common/openApp.js'
// #ifdef H5
openApp() //创建在h5端全局悬浮引导用户下载app的功能
// #endif
import checkIsAgree from '@/pages/uni-agree/utils/uni-agree.js'
import uniIdPageInit from '@/uni_modules/uni-id-pages/init.js'
uni.$navStatusHeight = 0
export default {
    globalData: {
        pushClientId: '',
        searchText: '',
        appVersion: {},
        config: {},
        $i18n: {},
        $t: {},
    },
    onLaunch: function () {
        console.log('App Launch')
        // uni.onPushMessage((res) => {
        //     console.log('收到推送消息：', res) //监听推送消息
        // })
        // // uni-app客户端获取push客户端标记
        // uni.getPushClientId({
        //     success: (res) => {
        //         console.log('客户端推送标识:', res.cid)
        //         this.globalData.pushClientId = res.cid
        //         const myPush = uniCloud.importObject('my-push')
        //         myPush.sendMessage({
        //             pushClientId: res.cid,
        //             title: 'test-title',
        //             content: 'test-content',
        //             event: 'test',
        //         })
        //     },
        //     fail(err) {
        //         console.log(err)
        //     },
        // })
        this.globalData.$i18n = this.$i18n
        this.globalData.$t = (str) => this.$t(str)
        const navBarHeight = 44
        const statusBarHeight = wx.getSystemInfoSync().statusBarHeight
        uni.$navStatusHeight = navBarHeight + statusBarHeight

        initApp()
        uniIdPageInit()
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
