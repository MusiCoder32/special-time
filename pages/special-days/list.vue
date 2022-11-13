<template>
    <view class="container">
        <unicloud-db
            ref="udb"
            loadtime="manual"
            v-slot:default="{ data, pagination, loading, hasMore, error }"
            :collection="collectionList"
            field="name,time,type"
        >
            <view v-if="error">{{ error.message }}</view>
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
                                <view class="f16 ellipsis mb10">{{ item.name }}</view>
                                <view class="primary-color">{{ item.time }}</view>
                                <view v-if="item.type === 0" class="h-start-center">
                                    <view>已经</view>
                                    <view class="f14 ml2 mr2 primary-color">{{ totalDay(item.time) }}</view>
                                    <view>天</view>
                                </view>
                                <view v-if="item.type === 1" class="h-start-center">
                                    <view>已经</view>
                                    <view class="f14 ml2 mr2 primary-color">{{ totalYear(item.time) }}</view>
                                    <view>岁</view>
                                </view>
                                <view class="h-start-center">
                                    <view class="">距离下次{{ item.type ? '生日' : '纪念日' }}还有</view>
                                    <view class="f14 ml2 mr2 primary-color">{{ arriveDay(item.time) }}</view>
                                    <view> 天</view>
                                </view>
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
import { totalYear, totalDay, arriveDay } from '../../utils/getAge'
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
/*page {*/
/*    color: white;*/
/*  background: $primary-color;*/
/*}*/
</style>
