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
                    <image :style="item.width ? `width:${item.width}` : ''" :src="item.image"></image>
                </view>
                <text class="f32 fc-black mt15">{{ item.text }}</text>
            </view>
        </view>
        <uni-list class="center-list" v-for="(sublist, index) in ucenterList" :key="index">
            <uni-list-item
                v-for="(item, i) in sublist"
                :title="item.title"
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
    </view>
</template>

<script setup>
import { shareMessageCall, shareTimelineCall } from '@/utils/common'

onShareAppMessage(shareMessageCall)
onShareTimeline(shareTimelineCall)
</script>
<script>
import checkUpdate from '@/uni_modules/uni-upgrade-center-app/utils/check-update'
import callCheckVersion from '@/uni_modules/uni-upgrade-center-app/utils/call-check-version'

const db = uniCloud.database()
import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js'
import { isLogin } from '@/utils/common'
export default {
    data() {
        return {
            startAdTime: 0,
            balance: 0,
            gridList: [
                // {
                //     text: '时光广场',
                //     color: '#D7B7C5',
                //     url: '/pages/time-ground/index',
                //     image: '/static/time-ground.svg',
                //     width: '44rpx',
                // },
                {
                    text: '星座查询',
                    color: '#B7D7C9',
                    url: '/pages/ucenter/astro/index',
                    image: '/static/astro.svg',
                },
                // {
                //     text: '时光币',
                //     color: '#F0BAA1',
                //     // fun: 'getScore',
                //     url: '/pages/uni-id-scores/list',
                //     image: '/static/score.svg',
                // },
                // {
                //     text: '工具箱',
                //     color: '#B7C5D7',
                //     // fun: 'getScore',
                //     url: '/pages/tool/index',
                //     image: '/static/tool.svg',
                //     width: '48rpx',
                // },
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
                        title: '时光币',
                        url: '/pages/uni-id-scores/list',
                        icon: 'circle',
                    },

                    {
                        title: '生辰',
                        url: '/pages/start-end-time/detail',
                        icon: 'person',
                    },
                    {
                        title: '倒数日',
                        url: '/pages/start-end-time/detail-leave',
                        icon: 'flag',
                    },
                    {
                        title: '留言反馈',
                        icon: 'chatbubble',
                        url:
                            '/uni_modules/uni-feedback/pages/opendb-feedback/' +
                            (store.userInfo.role?.includes('admin') ? 'list' : 'opendb-feedback'),
                    },
                    {
                        title: '设置',
                        url: '/pages/ucenter/settings/settings',
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
    onLoad() {},
    onShow() {},
    computed: {
        userInfo() {
            return store.userInfo
        },
        hasLogin() {
            return store.hasLogin
        },
    },
    methods: {
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
        // signIn() {
        //     //普通签到
        //     this.$refs.signIn.open()
        // },
        signInByAd() {
            //看激励视频广告签到
            this.$refs.signIn.showRewardedVideoAd()
        },
        /**
         * 个人中心项目列表点击事件
         */
        ucenterListClick(item) {
            uni.navigateTo({
                url: item.url,
            })
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
