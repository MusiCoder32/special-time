<template>
    <view class="vh100 vw100 home v-start-center">
        <view style="height: 200px; background: red; width: 400px"></view>
        <scroll-view
            @scrolltoupper="scrolltoupper"
            @scrolltolower="scrolltolower"
            :scroll-y="true"
            class="scroll-view f-grow h0 mt20 pb20"
            :scroll-with-animation="true"
        >
            <unicloud-db
                ref="udb"
                v-slot:default="{ data, pagination, loading, hasMore, error }"
                :collection="collectionList"
                field="score,type,balance,comment,create_date,user_id"
            >
                <view v-if="error">{{ error.message }}</view>
                <view v-else-if="data">
                    <view
                        v-for="(item, index) in data"
                        :key="index"
                        @click="handleItemClick(item._id)"
                        class="scroll-view-item h-start-center p-r"
                    >
                        <view class="f-grow w0 h100 v-start-start p25">
                            <view class="h-start-center w100">
                                <view class="f-grow w0 f32 ellipsis ml8 fc-black">{{ item.comment }}</view>
                            </view>
                            <view class="f32 mt10 mb10 fc-gray">{{
                                dayjs(item.create_date).format('YYYY-MM-DD HH:mm:ss')
                            }}</view>
                            <view class="h-between-center fc-gray w100">
                                <view class="">本次变动</view>
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
    </view>
</template>

<script setup>
import dayjs from 'dayjs'
</script>
<script>
const db = uniCloud.database()
export default {
    data() {
        return {
            collectionList: 'uni-id-scores',
            loadMore: {
                contentdown: '',
                contentrefresh: '',
                contentnomore: '',
            },
        }
    },

    methods: {
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
