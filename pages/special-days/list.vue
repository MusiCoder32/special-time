<template>
    <view class="container">
        <unicloud-db
            @load="handleLoad"
            ref="udb"
            loadtime="manual"
            v-slot:default="{ data, pagination, loading, hasMore, error }"
            :collection="collectionList"
            where="user_id==$cloudEnv_uid"
            field="name,time,type,lunar"
        >
            <view class="deep-blue-bg" v-if="error">{{ error.message }}</view>
            <view v-else-if="data">
                <uni-list>
                    <uni-list-item
                        v-for="(item, index) in data"
                        :key="index"
                        showArrow
                        :clickable="true"
                        @click="handleItemClick(item._id)"
                    >
                        <template v-slot:body>
                            <view class="">
                                <view class="f16 ellipsis mb10">{{ item.name + SpecialDayType[item.type] }}</view>
                                <view class="f12">{{ item.normalTime }}</view>
                                <!--                              <uni-dateformat :date="item.time" :threshold="[0, 0]" format="yyyy-MM-dd"></uni-dateformat>-->
                                <view v-if="item.type === 0" class="h-start-center f12">
                                    <view>已经</view>
                                    <view class="f16 ml5 mr5 day-color">{{ totalDay(item.time) }}</view>
                                    <view>天</view>
                                </view>
                                <view v-if="item.type === 1" class="h-start-center f12">
                                    <view>已经</view>
                                    <view class="f16 ml5 mr5 day-color">{{ item.age }}</view>
                                    <view>岁</view>
                                </view>
                                <view v-if="item.remainDay" class="h-start-center f12">
                                    <template v-if="item.remainDay < 0 && item.type === SpecialDayType['提醒日']">
                                        <view class="">距离{{ item.name }}已经过了</view>
                                        <view class="f16 ml5 mr5">{{ 0 - item.remainDay }}</view>
                                        <view>天</view>
                                    </template>
                                    <template v-else>
                                        <view class="">距离{{ SpecialDayType[item.type] }}还有</view>
                                        <view class="f16 ml5 mr5 day-color">{{ item.remainDay }}</view>
                                        <view>天</view>
                                    </template>
                                </view>
                                <view v-else class="f16 mr2 warning-color"
                                    >今天是{{ item.name + '的' + SpecialDayType[item.type] }}</view
                                >
                            </view>
                        </template>
                    </uni-list-item>
                </uni-list>
            </view>
            <uni-load-more :status="loading ? 'loading' : hasMore ? 'more' : 'noMore'"></uni-load-more>
        </unicloud-db>
        <uni-fab ref="fab" horizontal="right" vertical="bottom" :pop-menu="false" @fabClick="fabClick" />
    </view>
</template>
<script setup>
import { totalYear, totalDay, arriveDay, setTime, getAge } from '../../utils/getAge'
import dayjs from 'dayjs'
import { SpecialDayType } from '../../utils/emnu'

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
.uni-load-more {
    background: #8fbec1 !important;
}
.uni-list-item {
    background: #8fbec1 !important;
}
page {
    color: white;
    background: #8fbec1;
}
.deep-blue-bg {
    background: #8fbec1 !important;
}
</style>
