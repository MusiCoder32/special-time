<template>
    <view class="p25">
        <unicloud-db
            @load="handleLoad"
            ref="udb"
            v-slot:default="{ data, loading, error, options }"
            :options="options"
            :collection="collectionList"
            field="name,time,type,lunar,leap,subscribed,user_id"
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
            <view v-else-if="data" class="list-details p30">
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

                <view class="detail-item">
                    <text class="f32 fc-66 mr40">消息通知</text>
                    <text class="fc-black f32" :class="data.subscribed ? '' : 'fc-orange'">{{
                        data.subscribed ? '已开启' : '未开启'
                    }}</text>
                </view>
                <view @click="shareClick(data)" class="share-button h-center">
                    <image style="width: 40rpx; height: 40rpx" src="/static/share.svg"></image>
                </view>
            </view>
        </unicloud-db>
        <view class="h-between-center mt70">
            <view class="f-grow edit-btn f36 white h-center" @click="handleUpdate">修改</view>
            <view class="ml20 f-grow del-btn f36 white h-center" @click="handleDelete">删除</view>
        </view>
    </view>
</template>

<script setup>
import { getAge, setTime, totalDay } from '../../utils/getAge'
import { ShareType, SpecialDayType } from '../../utils/emnu'
import { onShow } from '@dcloudio/uni-app'
import dayjs from 'dayjs'

onShow(async () => {
    // try {
    //     const res = await uniCloud.callFunction({
    //         name: 'myPush',
    //     })
    //     console.log(res)
    // } catch (e) {
    //     console.log(e)
    // }
})

function handleLoad(data) {
    const { time, lunar, leap, name, type } = data
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

async function shareClick(data) {
    if (data.type === SpecialDayType['生日']) {
        const res = await uni.showModal({
            confirmText: '生日',
            cancelText: '年龄',
            title: '选择分享类型',
        })
        shareBirthDay(data, res.confirm)
    } else {
        shareBirthDay(data)
    }
}

function shareBirthDay(data, isBirthDay) {
    const { time, lunar, leap, type, name, _id } = data
    let remainDay, normalTime
    if (type === SpecialDayType['提醒日']) {
        //提醒日交换remainDay与日期位置
        remainDay = dayjs(time).diff(dayjs().format('YYYY-MM-DD 00:00:00'), 'days')
        if (remainDay < 0) {
            remainDay = `已经过了 ${-remainDay} 天`
        } else if (remainDay === 0) {
            remainDay = `今天是${SpecialDayType[type]}哦`
        } else {
            remainDay = `还有 ${remainDay} 天`
        }
        normalTime = dayjs(time).format('YYYY-MM-DD')
        let temp = normalTime
        normalTime = remainDay
        remainDay = temp
    } else {
        const ageObj = getAge(time, lunar, leap)
        const { totalDay, cYear, cMonth, cDay, lYear, IMonthCn, IDayCn, aYear, oneBirthTotalDay } = ageObj
        remainDay = ageObj.remainDay
        if (type === SpecialDayType['生日']) {
            //如果分享时选择生日
            if (isBirthDay) {
                //生日隐藏年份
                if (!lunar) {
                    normalTime = `${cMonth}-${cDay}`
                } else {
                    normalTime = `${IMonthCn}${IDayCn}`
                }
                if (remainDay === 0) {
                    remainDay = `今天是${SpecialDayType[type]}哦`
                } else {
                    remainDay = `还有 ${remainDay} 天`
                }
            } else {
                //如果分享时选择年龄
                //如果年龄大于0,则以岁数显示，否则以天数显示，将计算值赋于remainDay
                if (aYear > 0) {
                    // 将打开app时记录的日期，在setInterval外获取，解决用户在晚上12点前打开，一直停留到该页面过12点，导致currentDayFloat计算错误
                    const openAppDay = dayjs().format('YYYY-MM-DD 00:00:00') //
                    let currentDayFloat = dayjs().diff(openAppDay, 'day', true)
                    //生日当天remainDay为0,做无需ayear+1
                    if (remainDay === 0) {
                        remainDay = (aYear + currentDayFloat / oneBirthTotalDay).toFixed(2) + ' 岁'
                    } else {
                        remainDay = (aYear + 1 - (remainDay - currentDayFloat) / oneBirthTotalDay).toFixed(2) + ' 岁'
                    }
                } else {
                    remainDay = `${totalDay} 天`
                }
            }
        } else {
            if (!lunar) {
                normalTime = `${cYear}-${cMonth}-${cDay}`
            } else {
                normalTime = `${lYear} ${IMonthCn}${IDayCn}`
            }
            remainDay = `第 ${totalDay(time)} 天`
        }
    }

    const obj = {
        label: SpecialDayType[type] === '生日' && isBirthDay ? name + SpecialDayType[type] : name,
        value: remainDay,
        unit: normalTime,
        shareDetails: {
            name,
            type,
            time,
            lunar,
            leap,
            _id,
        },
    }

    uni.navigateTo({
        url: '/pages/home/poster-setting?data=' + JSON.stringify(obj),
    })
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
$uni-shadow-base: 0 1px 5px 2px
    rgba(
        $color: #000000,
        $alpha: 0.3,
    ) !default;

page {
    background: $primary-bg;
}

.share-button {
    position: fixed;
    z-index: 10;
    border-radius: 45px;
    box-shadow: $uni-shadow-base;
    background-color: #3494f8;
    right: 15px;
    bottom: 30px;
    width: 55px;
    height: 55px;
}

.warning-color {
    color: #ffcc33;
}
</style>
