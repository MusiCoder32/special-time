<template>
    <view class="vh100 vw100 home v-start-center">
        <view class="bg-primary w100 p-r" style="height: 400rpx">
            <view class="v-center mt20">
                <view style="margin-top: -230rpx; border-radius: 50%" class="h-center p-r">
                    <image
                        style="width: 800rpx; height: 800rpx; clip-path: circle(130rpx)"
                        src="/static/score.svg"
                    ></image>
                    <text class="f40 fc-red p-center mr15">{{ balance }}</text>
                </view>
            </view>
        </view>
        <scroll-view
            @scrolltoupper="scrolltoupper"
            @scrolltolower="scrolltolower"
            :scroll-y="true"
            class="scroll-view f-grow h0 mt20 pb20"
            :scroll-with-animation="true"
        >
            <unicloud-db
                where="user_id==$cloudEnv_uid"
                @load="handleLoad"
                ref="udb"
                v-slot:default="{ data, pagination, loading, hasMore, error }"
                :collection="collectionList"
                orderby="create_date desc"
                field="score,type,balance,comment,create_date,user_id"
            >
                <view v-if="error">{{ error.message }}</view>
                <view v-else-if="data">
                    <view v-for="(item, index) in data" :key="item._id" class="scroll-view-item h-start-center p-r">
                        <view class="f-grow w0 h100 v-start-start p25">
                            <view class="h-start-center w100">
                                <view class="f-grow w0 f32 ellipsis fc-black">{{ item.comment }}</view>
                            </view>
                            <view class="f32 mt15 mb10 fc-gray">本次变动后剩余 {{ item.balance }} 个</view>
                            <view class="h-between-center fc-gray w100">
                                <view class="">{{ dayjs(item.create_date).format('YYYY-MM-DD HH:mm:ss') }}</view>
                                <view class="h-center">
                                    <view class="f36 ml8 mr8 fc-red">{{ item.score }}</view>
                                    <view>个</view>
                                </view>
                            </view>
                        </view>
                    </view>
                </view>
                <uni-load-more class="mb20" :status="loading ? 'loading' : hasMore ? 'more' : 'noMore'"></uni-load-more>
            </unicloud-db>
            <uni-fab ref="fab" horizontal="right" vertical="bottom" :pop-menu="false" @fabClick="fabClick" />
        </scroll-view>
        <ad-rewarded-video
            ref="adRewardedVideo2"
            adpid="1281160936"
            :preload="true"
            :loadnext="true"
            v-slot:default="{ loading, error }"
            @load="onadload"
            @close="onadclose"
            @error="onaderror"
        >
            <!--            <view class="ad-error" v-if="error">{{ error }}</view>-->
        </ad-rewarded-video>
    </view>
</template>

<script setup>
import dayjs from 'dayjs'
</script>
<script>
import { debounce } from '@/utils/common.js'
const db = uniCloud.database()
export default {
    data() {
        return {
            collectionList: 'uni-id-scores',
            balance: 0,
            startAdTime: 0,
            loadMore: {
                contentdown: '',
                contentrefresh: '',
                contentnomore: '',
            },
        }
    },

    methods: {
        handleLoad(data) {
            if (data.length > 0) {
                this.balance = data[0].balance
            }
        },
        scrolltoupper() {
            this.$refs.udb.loadData(
                {
                    clear: true,
                },
                () => {
                    uni.stopPullDownRefresh()
                },
            )
        },
        scrolltolower() {
            this.$refs.udb.loadMore()
        },
        handleItemClick(id) {
            uni.navigateTo({
                url: './detail?id=' + id,
            })
        },
        async fabClick() {
            const modalRes = await uni.showModal({
                cancelText: '邀请用户',
                confirmText: '观看视频',
                title: '赚取时光币',
            })
            if (modalRes.confirm) {
                this.$refs.adRewardedVideo2.show()
            } else {
                const shareModalRes = await uni.showModal({
                    confirmText: '立即邀请',
                    title: '邀请新用户赚取奖励',
                    content:
                        '分享时光列表中的日期或首页中的个人生日。1.每邀请一个新用户，可立即获得5个时光币奖励。2.帮助用户完成头像与昵称设置，双方均可再获得5时光币奖励',
                })
                if (shareModalRes.confirm) {
                    uni.switchTab({
                        url: '/pages/special-days/list',
                    })
                }
            }
        },
        /**
         * 获取积分信息
         */
        onadload(e) {
            console.log('广告数据加载成功')
        },
        onadclose: debounce(async function (e) {
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
                        comment: `观看激励视频赠送`,
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
        }, 1000),
        onaderror(e) {
            // 广告加载失败
            console.log('onaderror: ', e.detail)
            uni.$showToast({
                icon: 'none',
                title: '广告加载失败，请稍后再试',
            })
        },
    },
}
</script>

<style lang="scss" scoped>
page {
    color: white;
    background: $primary-bg;
}

.scroll-view-item {
    left: 0;
    width: 670rpx;
    margin: 0 40rpx 30rpx;
    height: 200rpx;
    mix-blend-mode: normal;
    border-radius: 20rpx;
    background: #ffffff99;
    box-shadow: 0rpx 5rpx 10rpx #6f8fea0f, 0rpx 5rpx 10rpx #6f8fea0f;
}
.scroll-view {
    white-space: nowrap;
    overflow: hidden;
}
</style>
