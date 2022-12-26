<template>
    <view class="">
        <unicloud-db
            @load="handleLoad"
            ref="udb"
            loadtime="manual"
            v-slot:default="{ data, pagination, loading, hasMore, error }"
            :collection="collectionList"
            where="user_id==$cloudEnv_uid"
            field="name,time,type,lunar"
        >
            <view class="fc-black" v-if="error">{{ error.message }}</view>
            <view v-else-if="data" class="mt20">
                <view v-for="(item, index) in data" :key="index" @click="handleItemClick(item._id)">
                    <view class="scroll-view-item v-start-start p30 p-r">
                        <view style="right: 0; top: 0; width: 60rpx; height: 100rpx" class="h-center p-a">
                            <image src="/static/more.svg" style="width: 6rpx; height: 30rpx"></image>
                        </view>

                        <!--                  日期名称-->
                        <view class="h-start-center w100">
                            <image
                                v-if="SpecialDayType[item.type] === '提醒日'"
                                src="/static/alert.svg"
                                style="width: 50rpx; height: 50rpx"
                            ></image>
                            <image
                                v-if="SpecialDayType[item.type] === '生日'"
                                src="/static/birthday.svg"
                                style="width: 50rpx; height: 50rpx"
                            ></image>
                            <image
                                v-if="SpecialDayType[item.type] === '纪念日'"
                                src="/static/commemorate.svg"
                                style="width: 50rpx; height: 50rpx"
                            ></image>
                            <view class="f16 f-grow w0 f32 ellipsis ml8 fc-black">{{
                                item.name + SpecialDayType[item.type]
                            }}</view>
                            <view class="ml30"></view>
                        </view>

                        <view class="fc-gray f28 h-start-center mt10">
                            <view>{{ item.normalTime }}</view>
                            <view
                                v-if="SpecialDayType[item.type] === '纪念日' && totalDay(item.time) > 0"
                                class="h-start-center"
                            >
                                <view class="ml10 mr10 mtn4 f32">|</view>
                                <view>已经</view>
                                <view class="ml8 mr8">{{ totalDay(item.time) }}</view>
                                <view>天</view>
                            </view>
                            <view v-if="item.type === 1" class="h-start-center mt5">
                                <view class="ml10 mr10 mtn4 f32">|</view>
                                <view>已经</view>
                                <view class="ml8 mr8">{{ item.age }}</view>
                                <view>岁</view>
                            </view>
                        </view>

                        <view v-if="item.remainDay" class="h-start-center fc-gray f28 mt10">
                            <template v-if="item.remainDay < 0 && item.type === SpecialDayType['提醒日']">
                                <view class="">距离{{ item.name }}已经过了</view>
                                <view class="f36 ml8 mr8 fc-red">{{ 0 - item.remainDay }}</view>
                                <view>天</view>
                            </template>
                            <template v-else>
                                <view class="">距离{{ SpecialDayType[item.type] }}还有</view>
                                <view class="f36 ml8 mr8 fc-red">{{ item.remainDay }}</view>
                                <view>天</view>
                            </template>
                        </view>
                        <view v-else class="f32 w100 ellipsis mr2 fc-orange mt10"
                            >今天是{{ item.name + '的' + SpecialDayType[item.type] }}
                        </view>
                    </view>
                </view>
            </view>
            <uni-load-more :status="loading ? 'loading' : hasMore ? 'more' : 'noMore'"></uni-load-more>
        </unicloud-db>
        <uni-fab
            :pattern="{
                buttonColor: '#3494F8',
            }"
            ref="fab"
            horizontal="right"
            vertical="bottom"
            :pop-menu="false"
            @fabClick="fabClick"
        />
    </view>
</template>
<script setup>
import { totalYear, totalDay, arriveDay, setTime, getAge } from '../../utils/getAge'
import dayjs from 'dayjs'
import { SpecialDayType } from '../../utils/emnu'
import { onShareAppMessage } from '@dcloudio/uni-app'

function handleLoad(data) {
    data.forEach((item) => {
        const { time, lunar, leap, type } = item
        if (type === SpecialDayType['提醒日']) {
            item.remainDay = dayjs(time).diff(dayjs().format('YYYY-MM-DD 00:00:00'), 'days')
        } else {
            const { remainDay, aYear, cYear, cMonth, cDay, lYear, IMonthCn, IDayCn } = getAge(time, lunar, leap)
            item.remainDay = remainDay
            item.age = aYear

            if (!lunar) {
                item.normalTime = `${cYear}-${cMonth}-${cDay}`
            } else {
                item.normalTime = `${lYear} ${IMonthCn}${IDayCn}`
            }
        }
    })
    // data.sort((a, b) => a.remainDay - b.remainDay)
}
</script>

<script>
const db = uniCloud.database()
export default {
    data() {
        return {
            collectionList: 'special-days',
            loadMore: {
                contentdown: '',
                contentrefresh: '',
                contentnomore: '',
            },
        }
    },
    onPullDownRefresh() {
        this.$refs.udb.loadData(
            {
                clear: true,
            },
            () => {
                uni.stopPullDownRefresh()
            },
        )
    },
    onShow() {
        this.$refs.udb.loadData(
            {
                clear: true,
            },
            () => {
                uni.stopPullDownRefresh()
            },
        )
    },
    onReachBottom() {
        this.$refs.udb.loadMore()
    },
    methods: {
        handleItemClick(id) {
            uni.navigateTo({
                url: './detail?id=' + id,
            })
        },
        fabClick() {
            // 打开新增页面
            uni.navigateTo({
                url: './add',
                events: {
                    // 监听新增数据成功后, 刷新当前页面数据
                    refreshData: () => {
                        this.$refs.udb.loadData({
                            clear: true,
                        })
                    },
                },
            })
        },
    },
}
</script>

<style lang="scss">
page {
    color: white;
    background: $primary-bg;
}
.scroll-view-item {
    width: 670rpx;
    margin: 0 40rpx 30rpx;
    height: 202rpx;
    mix-blend-mode: normal;
    border-radius: 20rpx;
    background: #ffffff99;
    box-shadow: 0rpx 5rpx 10rpx #6f8fea0f, 0rpx 5rpx 10rpx #6f8fea0f;
}
</style>
