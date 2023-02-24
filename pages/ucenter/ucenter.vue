<template>
    <view>
        <uni-sign-in ref="signIn"></uni-sign-in>
        <view class="userInfo v-center" @click.capture="toUserInfo">
            <cloud-image
                width="150rpx"
                height="150rpx"
                v-if="hasLogin && userInfo.avatar_file && userInfo.avatar_file.url"
                :src="userInfo.avatar_file.url"
            ></cloud-image>
            <image v-else class="logo-img" src="@/static/uni-center/defaultAvatarUrl.png"></image>
            <view class="logo-title">
                <text class="uer-name" v-if="hasLogin">{{
                    userInfo.nickname || userInfo.username || userInfo.mobile
                }}</text>
                <text class="uer-name" v-else>{{ $t('mine.notLogged') }}</text>
            </view>
        </view>
        <view class="grid ml25 mr25 mb40 h-start-center">
            <view class="grid-item v-center" v-for="(item, index) in gridList" :key="index" @click="gridClick(item)">
                <view class="icon h-center" :style="'background:' + item.color">
                    <image :src="item.image"></image>
                </view>
                <text class="f32 fc-black mt15">{{ item.text }}</text>
            </view>
        </view>
        <uni-list class="center-list" v-for="(sublist, index) in ucenterList" :key="index">
            <uni-list-item
                v-for="(item, i) in sublist"
                :title="item.title"
                link
                class="list-item"
                :rightText="item.rightText"
                :key="i"
                :clickable="true"
                :to="item.to"
                @click="ucenterListClick(item)"
                :show-extra-icon="true"
                :extraIcon="{ type: item.icon, color: '#999' }"
            >
                <template v-slot:footer>
                    <view v-if="item.showBadge" class="item-footer">
                        <text class="item-footer-text">{{ item.rightText }}</text>
                        <view class="item-footer-badge"></view>
                    </view>
                </template>
            </uni-list-item>
        </uni-list>
        <!--        <ad-rewarded-video-->
        <!--            ref="adRewardedVideo2"-->
        <!--            adpid="1281160936"-->
        <!--            :preload="true"-->
        <!--            :loadnext="true"-->
        <!--            v-slot:default="{ loading, error }"-->
        <!--            @load="onadload"-->
        <!--            @close="onadclose"-->
        <!--            @error="onaderror"-->
        <!--        >-->
        <!--            &lt;!&ndash;            <view class="ad-error" v-if="error">{{ error }}</view>&ndash;&gt;-->
        <!--        </ad-rewarded-video>-->
    </view>
</template>

<script>
import { onShareAppMessage } from '@dcloudio/uni-app'
import checkUpdate from '@/uni_modules/uni-upgrade-center-app/utils/check-update'
import callCheckVersion from '@/uni_modules/uni-upgrade-center-app/utils/call-check-version'
// #ifdef APP
import UniShare from '@/uni_modules/uni-share/js_sdk/uni-share.js'
const uniShare = new UniShare()
// #endif
const db = uniCloud.database()
import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js'
import Add from '../../uni_modules/uni-upgrade-center/pages/version/add'
export default {
    components: { Add },
    // #ifdef APP
    onBackPress({ from }) {
        if (from == 'backbutton') {
            this.$nextTick(function () {
                uniShare.hide()
            })
            return uniShare.isShow
        }
    },
    // #endif
    data() {
        return {
            startAdTime: 0,
            balance: 0,
            gridList: [
                // {
                //     text: '留言反馈',
                //     icon: 'chatbubble',
                // },
                {
                    text: '星座查询',
                    color: '#269ED1',
                    url: '/pages/ucenter/astro/index',
                    image: '/static/astro.svg',
                },
                {
                    text: '时光币',
                    color: '#F0BAA1',
                    fun: 'getScore',
                    image: '/static/score.svg',
                },
            ],
            ucenterList: [
                // [
                //     // #ifdef APP-PLUS
                //     {
                //         title: this.$t('mine.signInByAd'),
                //         event: 'signInByAd',
                //         icon: 'compose',
                //     },
                //     // #endif
                //     // {
                //     //     title: this.$t('mine.signIn'),
                //     //     event: 'signIn',
                //     //     icon: 'compose',
                //     // },
                //     // {
                //     //     title: this.$t('mine.toEvaluate'),
                //     //     event: 'gotoMarket',
                //     //     icon: 'hand-thumbsup',
                //     // },
                //     // {
                //     //     title: this.$t('mine.readArticles'),
                //     //     to: '/pages/ucenter/read-news-log/read-news-log',
                //     //     icon: 'flag',
                //     // },
                //     // {
                //     //     title: this.$t('mine.invite'),
                //     //     event: 'share',
                //     //     icon: 'redo',
                //     // },
                // ],
                [
                    // {
                    //     title: this.$t('mine.feedback'),
                    //     to: '/uni_modules/uni-feedback/pages/opendb-feedback/opendb-feedback',
                    //     icon: 'help',
                    // },
                    {
                        title: this.$t('mine.settings'),
                        to: '/pages/ucenter/settings/settings',
                        icon: 'gear',
                    },
                ],
                // [
                //     {
                //         title: this.$t('mine.about'),
                //         to: '/pages/ucenter/about/about',
                //         icon: 'info',
                //     },
                // ],
            ],
            listStyles: {
                height: '150rpx', // 边框高度
                width: '150rpx', // 边框宽度
                border: {
                    // 如果为 Boolean 值，可以控制边框显示与否
                    color: '#eee', // 边框颜色
                    width: '1px', // 边框宽度
                    style: 'solid', // 边框样式
                    radius: '100%', // 边框圆角，支持百分比
                },
            },
        }
    },
    onLoad() {
        //#ifdef APP-PLUS
        this.ucenterList[this.ucenterList.length - 2].unshift({
            title: this.$t('mine.checkUpdate'), // this.this.$t('mine.checkUpdate')"检查更新"
            rightText: this.appVersion.version + '-' + this.appVersion.versionCode,
            event: 'checkVersion',
            icon: 'loop',
            showBadge: this.appVersion.hasNew,
        })
        //#endif
    },
    onShow() {},
    computed: {
        userInfo() {
            return store.userInfo
        },
        hasLogin() {
            return store.hasLogin
        },
        // #ifdef APP-PLUS
        appVersion() {
            return getApp().appVersion
        },
        // #endif
        appConfig() {
            return getApp().globalData.config
        },
    },
    methods: {
        /**
         * 获取积分信息
         */
        async getScore() {
            if (!this.hasLogin) {
                uni.reLaunch({
                    url: `/uni_modules/uni-id-pages/pages/login/login-withoutpwd`,
                })
            }
            uni.showLoading({
                mask: true,
            })
            let res
            try {
                const { result } = await db
                    .collection('uni-id-scores')
                    .where('"user_id" == $env.uid')
                    .field('score,balance')
                    .orderBy('create_date', 'desc')
                    .limit(1)
                    .get()
                res = result
            } catch (e) {
                console.log(e)
            }

            uni.hideLoading()

            //调整逻辑，保证不管时光币请求成功还是失败，都能打开广告
            let balance = 0
            try {
                balance = res.data[0].balance
            } catch (e) {
                console.log(e)
            }
            this.balance = balance
            const modalRes = await uni.showModal({
                title: '提示',
                content: `您目前拥有 ${balance} 时光币，是否继续赚取？`,
            })
            if (modalRes.confirm) {
                this.startAdTime = +new Date()
                this.$refs.adRewardedVideo2.show()
            }
        },
        onadload(e) {
            console.log('广告数据加载成功')
        },
        async onadclose(e) {
            let me = this
            const detail = e.detail
            // 用户点击了【关闭广告】按钮
            if (detail && detail.isEnded) {
                // 每次赠送五分之广告时长的奖励,最少两个，最多五个
                let score = Math.floor((+new Date() - this.startAdTime) / 1000 / 5)
                score = Math.min(score, 5)
                score = Math.max(score, 2)
                let balance = this.balance + score
                // 正常播放结束
                uni.showLoading({ title: '时光币发放中...' })

                try {
                    const uniScores = db.collection('uni-id-scores')
                    await uniScores.add({
                        balance,
                        score,
                        type: 1,
                        comment: `观看激励视频赠送${score}时光币`,
                    })
                } catch (e) {
                    console.log(e)
                }
                uni.hideLoading()

                this.balance = balance
                const modalRes = await uni.showModal({
                    title: '提示',
                    content: `您新获得 ${score} 时光币，共拥有 ${balance} 时光币，是否继续赚取`,
                })
                if (modalRes.confirm) {
                    this.startAdTime = +new Date()
                    this.$refs.adRewardedVideo2.show()
                }
            }
        },
        onaderror(e) {
            // 广告加载失败
            console.log('onaderror: ', e.detail)
        },
        gridClick(item) {
            if (item.url) {
                uni.navigateTo({
                    url: item.url,
                })
            }
            if (item.fun) {
                this[item.fun]()
            }
        },
        toSettings() {
            uni.navigateTo({
                url: '/pages/ucenter/settings/settings',
            })
        },
        signIn() {
            //普通签到
            this.$refs.signIn.open()
        },
        signInByAd() {
            //看激励视频广告签到
            this.$refs.signIn.showRewardedVideoAd()
        },
        /**
         * 个人中心项目列表点击事件
         */
        ucenterListClick(item) {
            if (!item.to && item.event) {
                this[item.event]()
            }
        },
        async checkVersion() {
            let res = await callCheckVersion()
            console.log(res)
            if (res.result.code > 0) {
                checkUpdate()
            } else {
                uni.showToast({
                    title: res.result.message,
                    icon: 'none',
                })
            }
        },
        toUserInfo() {
            uni.navigateTo({
                url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo',
            })
        },

        /**
         * 去应用市场评分
         */
        gotoMarket() {
            // #ifdef APP-PLUS
            if (uni.getSystemInfoSync().platform == 'ios') {
                // 这里填写appstore应用id
                let appstoreid = this.appConfig.marketId.ios // 'id1417078253';
                console.log({ appstoreid })
                plus.runtime.openURL(
                    'itms-apps://' + 'itunes.apple.com/cn/app/wechat/' + appstoreid + '?mt=8',
                    (err) => {
                        console.log('plus.runtime.openURL err:' + JSON.stringify(err))
                    },
                )
            }
            if (uni.getSystemInfoSync().platform == 'android') {
                var Uri = plus.android.importClass('android.net.Uri')
                var uri = Uri.parse('market://details?id=' + this.appConfig.marketId.android)
                var Intent = plus.android.importClass('android.content.Intent')
                var intent = new Intent(Intent.ACTION_VIEW, uri)
                var main = plus.android.runtimeMainActivity()
                main.startActivity(intent)
            }
            // #endif
        },

        async share() {
            let { result } = await db
                .collection('uni-id-users')
                .where("'_id' == $cloudEnv_uid")
                .field('my_invite_code')
                .get()
            let myInviteCode = result.data[0].my_invite_code
            if (!myInviteCode) {
                return uni.showToast({
                    title: '请检查uni-config-center中uni-id配置，是否已启用 autoSetInviteCode',
                    icon: 'none',
                })
            }
            console.log({ myInviteCode })
            let { appName, logo, company, slogan } = this.appConfig.about
            // #ifdef APP-PLUS
            uniShare.show(
                {
                    content: {
                        //公共的分享类型（type）、链接（herf）、标题（title）、summary（描述）、imageUrl（缩略图）
                        type: 0,
                        href:
                            this.appConfig.h5.url +
                            `/#/pages/ucenter/invite/invite?code=uniInvitationCode:${myInviteCode}`,
                        title: appName,
                        summary: slogan,
                        imageUrl: logo + '?x-oss-process=image/resize,m_fill,h_100,w_100', //压缩图片解决，在ios端分享图过大导致的图片失效问题
                    },
                    menus: [
                        {
                            img: '/static/app-plus/sharemenu/wechatfriend.png',
                            text: this.$t('common.wechatFriends'),
                            share: {
                                provider: 'weixin',
                                scene: 'WXSceneSession',
                            },
                        },
                        {
                            img: '/static/app-plus/sharemenu/wechatmoments.png',
                            text: this.$t('common.wechatBbs'),
                            share: {
                                provider: 'weixin',
                                scene: 'WXSceneTimeline',
                            },
                        },
                        {
                            img: '/static/app-plus/sharemenu/weibo.png',
                            text: this.$t('common.weibo'),
                            share: {
                                provider: 'sinaweibo',
                            },
                        },
                        {
                            img: '/static/app-plus/sharemenu/qq.png',
                            text: 'QQ',
                            share: {
                                provider: 'qq',
                            },
                        },
                        {
                            img: '/static/app-plus/sharemenu/copyurl.png',
                            text: this.$t('common.copy'),
                            share: 'copyurl',
                        },
                        {
                            img: '/static/app-plus/sharemenu/more.png',
                            text: this.$t('common.more'),
                            share: 'shareSystem',
                        },
                    ],
                    cancelText: this.$t('common.cancelShare'),
                },
                (e) => {
                    //callback
                    console.log(e)
                },
            )
            // #endif
        },
    },
}
</script>

<style lang="scss">
page {
    color: white;
    background: $primary-bg;
}

.userInfo {
    padding: 50rpx;
    padding-bottom: 120rpx;
    background: $primary-color;
    flex-direction: column;
    align-items: center;
}

.logo-img {
    width: 150rpx;
    height: 150rpx;
    border-radius: 150rpx;
}

.logo-title {
    flex: 1;
    align-items: center;
    justify-content: space-between;
    flex-direction: row;
}

.uer-name {
    height: 100rpx;
    line-height: 100rpx;
    font-size: 38rpx;
    color: #ffffff;
}

.uni-list {
    width: 700rpx !important;
    margin: 0 25rpx;
    border-radius: 20rpx;
    box-shadow: 0rpx 5rpx 10rpx #6f8fea0f, 0rpx 5rpx 10rpx #6f8fea0f;
}
.uni-list-item {
    border-radius: 20rpx;
    box-shadow: 0rpx 5rpx 10rpx #6f8fea0f, 0rpx 5rpx 10rpx #6f8fea0f;
}
.list-item {
    width: 700rpx;
    border-radius: 20rpx;
    box-shadow: 0rpx 5rpx 10rpx #6f8fea0f, 0rpx 5rpx 10rpx #6f8fea0f;
}

.center-list-cell {
    width: 700rpx;
    height: 40rpx;
}

.grid {
    margin-top: -102.5rpx;
    width: 700rpx;
    height: 205rpx;
    border-radius: 20rpx;
    background: #ffffff;
    box-shadow: 0rpx 5rpx 10rpx #6f8fea0f, 0rpx 5rpx 10rpx #6f8fea0f;
    .grid-item {
        width: 25%;
        height: 100%;
        .icon {
            width: 75rpx;
            height: 75rpx;
            border-radius: 50%;
            > image {
                height: 100%;
            }
        }
    }
}

.center-list ::v-deep .uni-list--border-top,
.center-list ::v-deep .uni-list--border-bottom {
    display: none;
}

.item-footer {
    flex-direction: row;
    align-items: center;
}

.item-footer-text {
    color: #999;
    font-size: 24rpx;
    padding-right: 10rpx;
}

.item-footer-badge {
    width: 20rpx;
    height: 20rpx;
    /* #ifndef APP-NVUE */
    border-radius: 50%;
    /* #endif */
    /* #ifdef APP-NVUE */
    border-radius: 10rpx;
    /* #endif */
    background-color: #dd524d;
}
</style>
