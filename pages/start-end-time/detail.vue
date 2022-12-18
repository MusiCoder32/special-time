<template>
    <view class="p25">
        <unicloud-db
            ref="udb"
            v-slot:default="{ data, loading, error, options }"
            :options="options"
            :collection="collectionList"
            field="start_time,startType,leap,end_time"
            where="user_id==$cloudEnv_uid"
            @load="handleLoad"
            :getone="true"
        >
            <view v-if="error">{{ error.message }}</view>
            <view v-else-if="loading">
                <uni-load-more :contentText="loadMore" status="loading"></uni-load-more>
            </view>
            <view v-else-if="data" class="list-details p30">
                <view class="detail-item">
                    <text class="f32 fc-66 mr40">出生日期</text>
                    <text class="fc-black f32">{{ data.normalTime }}</text>
                </view>
                <view class="detail-item">
                    <text class="f32 fc-66 mr40">类型</text>
                    <text class="fc-black f32">{{ options.type_valuetotext[data.type] }}</text>
                </view>

                <view class="detail-item" v-if="data.startType">
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
                <view class="detail-item">
                    <text class="f32 fc-66 mr40">计划离开时间</text>
                    <uni-dateformat
                        type="date"
                        :threshold="[0, 0]"
                        :date="data.end_time"
                        format="yyyy-MM-dd"
                    ></uni-dateformat>
                </view>
            </view>
        </unicloud-db>

        <view class="w100 mt30 edit-btn f36 white h-center" @click="handleUpdate">修改</view>
    </view>
</template>

<script setup>
import { getAge, setTime } from '../../utils/getAge'

function handleLoad(data) {
    console.log(data)
    const { start_time, startType, leap } = data
    const { Animal, astro, IDayCn, IMonthCn, lYear, cYear, cMonth, cDay } = getAge(start_time, startType, leap)
    data.Animal = `${Animal}`
    data.astro = `${astro}`
    data.normalTime = `${lYear} ${IMonthCn}${IDayCn}`
    data.solarDate = `${cYear}-${cMonth}-${cDay}`
}
</script>

<script>
// 由schema2code生成，包含校验规则和enum静态数据
import { enumConverter } from '../../js_sdk/validator/start-end-time.js'

const db = uniCloud.database()

export default {
    data() {
        return {
            collectionList: 'start-end-time',
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
    onLoad() {},
    onReady() {},
    methods: {
        handleUpdate() {
            // 打开修改页面
            uni.navigateTo({
                url: './edit?id=' + this._id,
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
                    uni.navigateTo({
                        url: './list',
                    })
                },
            })
        },
    },
}
</script>

<style>
.container {
    padding: 10px;
}

.btns {
    margin-top: 10px;
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    flex-direction: row;
}

.btns button {
    flex: 1;
}

.btn-delete {
    margin-left: 10px;
}
</style>
