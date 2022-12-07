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
        uni.onPushMessage((res) => {
            console.log('收到推送消息：', res) //监听推送消息
        })
        // uni-app客户端获取push客户端标记
        uni.getPushClientId({
            success: (res) => {
                console.log('客户端推送标识:', res.cid)
                this.globalData.pushClientId = res.cid
                uniCloud
                    .callFunction({
                        name: 'my-push',
                        data: { name: 'wyj' },
                    })
                    .then((res2) => {
                        console.log(res2)
                    })
            },
            fail(err) {
                console.log(err)
            },
        })
        this.globalData.$i18n = this.$i18n
        this.globalData.$t = (str) => this.$t(str)
        const navBarHeight = 44
        const statusBarHeight = wx.getSystemInfoSync().statusBarHeight
        uni.$navStatusHeight = navBarHeight + statusBarHeight

        initApp()
        uniIdPageInit()

        // #ifdef APP-PLUS
        //checkIsAgree(); APP端暂时先用原生默认生成的。目前，自定义方式启动vue界面时，原生层已经请求了部分权限这并不符合国家的法规
        // #endif

        // #ifdef H5
        // checkIsAgree(); // 默认不开启。目前全球，仅欧盟国家有网页端同意隐私权限的需要。如果需要可以自己去掉注视后生效
        // #endif

        // #ifdef APP-PLUS
        //idfa有需要的用户在应用首次启动时自己获取存储到storage中
        /*var idfa = '';
			var manager = plus.ios.invoke('ASIdentifierManager', 'sharedManager');
			if(plus.ios.invoke(manager, 'isAdvertisingTrackingEnabled')){
				var identifier = plus.ios.invoke(manager, 'advertisingIdentifier');
				idfa = plus.ios.invoke(identifier, 'UUIDString');
				plus.ios.deleteObject(identifier);
			}
			plus.ios.deleteObject(manager);
			console.log('idfa = '+idfa);*/
        // #endif
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
