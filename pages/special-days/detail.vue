<template>
    <view class="container">
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
            <view v-else-if="data">
                <view>
                    <text>名称：</text>
                    <text>{{ data.name }}</text>
                </view>
                <view>
                    <text>日期：</text>
                    <text>{{ data.normalTime }}</text>
                </view>
                <view>
                    <text>类型：</text>
                    <text>{{ options.type_valuetotext[data.type] }}</text>
                </view>
                <template v-if="data.type === SpecialDayType['生日']">
                    <view v-if="data.lunar">
                        <text>公历：</text>
                        <text>{{ data.solarDate }}</text>
                    </view>
                    <view>
                        <text>生肖：</text>
                        <text>{{ data.Animal }}</text>
                    </view>
                    <view>
                        <text>星座：</text>
                        <text>{{ data.astro }}</text>
                    </view>
                </template>
            </view>
        </unicloud-db>
        <view class="btns">
            <button type="primary" @click="handleUpdate">修改</button>
            <button type="warn" class="btn-delete" @click="handleDelete">删除</button>
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
