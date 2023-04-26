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
                ref="scoreListRef"
                v-slot:default="{ data, pagination, loading, hasMore, error }"
                :collection="collectionList"
                orderby="create_date desc"
                field="score,type,balance,comment,create_date,user_id"
            >
                <view v-if="error">{{ error.message }}</view>
                <view v-else-if="data">
                    <view v-for="(item, index) in data" :key="item._id" class="scroll-view-item h-start-center p-r">
                        <view class="f-grow w0 h100 v-between-start pt15 pb10 pl25 pr25">
                            <view class="h-start-center w100">
                                <view class="f-grow w0 f32 ellipsis fc-black">{{ item.comment }}</view>
                            </view>
                            <view class="f32 mt15 fc-gray">本次变动后剩余 {{ item.balance }} 个</view>
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
            <uni-fab ref="fab" horizontal="right" vertical="bottom" :pop-menu="false" @fabClick="openAd" />
        </scroll-view>
        <ad-video ref="adVideo" />
    </view>
</template>

<script setup>
import dayjs from 'dayjs'
import AdVideo from '/components/ad-video.vue'
import { shareMessageCall } from '@/utils/common'
const db = uniCloud.database()
const scoreListRef = ref()

const collectionList = 'uni-id-scores'
const balance = ref(0)

const adVideo = ref()
function openAd() {
    adVideo.value.beforeOpenAd()
}
onShareAppMessage(shareMessageCall)

onPullDownRefresh(() => {
    scoreListRef.value.loadData(
        {
            clear: true,
        },
        () => {
            uni.stopPullDownRefresh()
        },
    )
})

function handleLoad(data, ended, pagination) {
    if (pagination.current === 1 && data.length > 0) {
        balance.value = data[0].balance
    }
}
function scrolltoupper() {
    uni.startPullDownRefresh()
}
function scrolltolower() {
    scoreListRef.value.loadMore()
}
function handleItemClick(id) {
    uni.navigateTo({
        url: './detail?id=' + id,
    })
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
    height: 180rpx;
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
