<template>
    <view class="p25">
        <unicloud-db
            @load="handleLoad"
            ref="udb"
            v-slot:default="{ data, loading, error, options }"
            :options="options"
            :collection="collectionList"
            field="name,time,type,lunar,leap"
            :where="queryWhere"
            :getone="true"
            :manual="true"
        >
            <view v-if="error">{{
                error.message.indexOf('timeout') ? '请检查网络后重试' : '连接错误，请退出重试'
            }}</view>
            <view v-else-if="loading">
                <uni-load-more :contentText="loadMore" status="loading"></uni-load-more>
            </view>
            <view v-else-if="data" class="details p30">
                <view class="detail-item h-start-center">
                    <text class="f32 fc-66 mr40">名称</text>
                    <text class="fc-black f-grow w0 ellipsis f32">{{ data.name }}</text>
                </view>
                <view class="detail-item">
                    <text class="f32 fc-66 mr40">日期</text>
                    <text class="fc-black f32">{{ data.normalTime }}</text>
                </view>
                <view class="detail-item">
                    <text class="f32 fc-66 mr40">类型</text>
                    <text class="fc-black f32">{{ options.type_valuetotext[data.type] }}</text>
                </view>
                <template v-if="data.type === SpecialDayType['生日']">
                    <view class="detail-item" v-if="data.lunar">
                        <text class="f32 fc-66 mr40">公历</text>
                        <text class="fc-black f32">{{ data.solarDate }}</text>
                    </view>
                    <view class="detail-item">
                        <text class="f32 fc-66 mr40">生肖</text>
                        <text class="fc-black f32">{{ data.Animal }}</text>
                    </view>
                    <view class="detail-item">
                        <text class="f32 fc-66 mr40">星座</text>
                        <text class="fc-black f32">{{ data.astro }}</text>
                    </view>
                </template>
            </view>
        </unicloud-db>
        <view class="h-between-center mt70" style="height: 93rpx">
            <view class="f-grow edit-btn h100 f36 white h-center" @click="handleUpdate">修改</view>
            <view class="ml20 f-grow del-btn h100 f36 white h-center" @click="handleDelete">删除</view>
        </view>
    </view>
</template>

<script setup>
import { setTime } from '../../utils/getAge'
import { SpecialDayType } from '../../utils/emnu'
import dayjs from 'dayjs'

function handleLoad(data) {
    const { time, lunar, leap } = data
    const result = setTime(time, lunar, leap)
    const { lYear, IMonthCn, IDayCn, lMonth, lDay, cYear, cMonth, cDay, Animal, astro } = result
    data.Animal = `${Animal}`
    data.astro = `${astro}`
    if (!lunar) {
        data.normalTime = dayjs(time).format('YYYY-MM-DD')
    } else {
        data.normalTime = `${lYear} ${IMonthCn}${IDayCn}`
        data.solarDate = `${cYear}-${cMonth}-${cDay}`
    }
}
</script>

<script>
// 由schema2code生成，包含校验规则和enum静态数据
import { enumConverter } from '../../js_sdk/validator/special-days.js'
const db = uniCloud.database()

export default {
    data() {
        return {
            queryWhere: '',
            collectionList: 'special-days',
            loadMore: {
                contentdown: '',
                contentrefresh: '',
                contentnomore: '',
            },
            options: {
                // 将scheme enum 属性静态数据中的value转成text
                ...enumConverter,
            },
        }
    },
    onLoad(e) {
        this._id = e.id
    },
    onReady() {
        if (this._id) {
            this.queryWhere = '_id=="' + this._id + '"'
        }
    },
    methods: {
        handleUpdate() {
            // 打开修改页面
            uni.navigateTo({
                url: './add?id=' + this._id,
                events: {
                    // 监听修改页面成功修改数据后, 刷新当前页面数据
                    refreshData: () => {
                        this.$refs.udb.loadData({
                            clear: true,
                        })
                    },
                },
            })
        },
        handleDelete() {
            this.$refs.udb.remove(this._id, {
                success: (res) => {
                    // 删除数据成功后跳转到list页面
                    uni.navigateBack()
                },
            })
        },
    },
}
</script>

<style lang="scss">
page {
    background: $primary-bg;
}
.details {
    width: 700rpx;
    mix-blend-mode: normal;
    border-radius: 20rpx;
    background: white;
    box-shadow: 0rpx 3rpx 10rpx rgba(111, 143, 234, 0.06), 0rpx 3rpx 10rpx rgba(111, 143, 234, 0.06);
    .detail-item {
        height: 93rpx;
        line-height: 93rpx;
        border-bottom: 3rpx solid #eeeeee;
    }
}
</style>
