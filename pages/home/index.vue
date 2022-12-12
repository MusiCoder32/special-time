<template>
    <view class="vh100 vw100 home v-start-center">
        <view :style="'height:' + navStatusHeight + 'px'" class="w100"></view>
        <view class="h-center mb20 mt30 fc-black f36">{{ time1 }} 星期{{ week }}</view>
        <view class="h-center mb60">
            <template v-for="(str, index) in time2" :key="index">
                <view v-if="index != 2 && index != 5" style="width: 70rpx; height: 95rpx" class="p-r mrn10 fhyt">
                    <image class="p-center" src="/static/time-bg.svg" style="width: 70rpx; height: 95rpx"></image>
                    <view class="p-center fc-time f58">{{ str }}</view>
                </view>
                <view v-else class="p-r fc-black f60 pl8 mrn2 mtn5">{{ str }}</view>
            </template>
        </view>

        <s-swiper @share="genPost" class="w100" :color-arr="colorArr" :swiper-list="swiperList" />

        <scroll-view :scroll-y="true" class="scroll-view f-grow h0 mt20" :scroll-with-animation="true">
            <view
                v-for="(item, index) in specialDay"
                :key="item._id"
                class="scroll-view-item h-start-center f12 mr20 p-r"
            >
                <view class="f-grow p-r w0 h100 v-start-start p30">
                    <view
                        @click.stop="toSpecialDay(item._id)"
                        style="right: 0; top: 0; width: 60rpx; height: 100rpx"
                        class="h-center p-a"
                    >
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
                <uni-icons
                    @click.stop="toSpecialDay(item._id)"
                    class="p-a"
                    style="top: 85rpx; right: 20rpx"
                    type="eye-filled"
                    color="#fff"
                    size="30"
                ></uni-icons>
            </view>
        </scroll-view>
    </view>
    <hch-poster ref="hchPoster" :posterData="posterData" />
</template>

<script setup>
import HchPoster from '/components/hch-poster/hch-poster.vue'
import SSwiper from '/components/blackmonth-swiper'
import dayjs from 'dayjs'
import { computed, onMounted, ref, nextTick, beforeMount } from 'vue'
import { arriveDay, getAgeAll, getGrowTime, totalDay, totalYear, setTime, getAge } from '../../utils/getAge'
import ColorArr from './color-arr'
import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js'
import { onShow, onReady, onReachBottom, onShareAppMessage } from '@dcloudio/uni-app'
import { orderBy } from 'lodash'
import { SpecialDayType } from '../../utils/emnu' //不支持onLoad

const prop = defineProps({
    data: {
        type: String,
    },
})

const navStatusHeight = ref(uni.$navStatusHeight)
// 海报模板数据
const posterData = ref({
    poster: {
        //根据屏幕大小自动生成海报背景大小
        // url: 'https://huangchunhongzz.gitee.io/imgs/poster/poster_bg_3.png', //图片地址
        url: '',
        r: 10, //圆角半径
        w: 300, //海报宽度
        h: 480, //海报高度
        p: 20, //海报内边距padding
    },
    mainImg: {
        //海报主商品图
        // url: 'https://huangchunhongzz.gitee.io/imgs/poster/product.png', //图片地址
        url: '',
        r: 10, //圆角半径
        w: 150, //宽度
        h: 150, //高度
    },
    codeImg: {
        //小程序码
        url: '/static/mini-code.jpg', //图片地址
        w: 100, //宽度
        h: 100, //高度
        mt: 20, //margin-top
        r: 50, //圆角半径
    },
    title: {
        //商品标题
        text: [], //文本
        fontSize: 16, //字体大小
        color: '#fff', //颜色
        lineHeight: 25, //行高
        mt: 35, //margin-top
        align: 'center',
    },
    tips: [
        //提示信息
        {
            text: '是时光丫', //文本
            fontSize: 16, //字体大小
            color: '#fff', //字体颜色
            align: 'center', //对齐方式
            lineHeight: 25, //行高
            mt: 30, //margin-top
        },
        {
            text: '长按/扫描进入小程序', //文本
            fontSize: 12, //字体大小
            color: '#fff', //字体颜色
            align: 'center', //对齐方式
            lineHeight: 25, //行高
            mt: 25, //margin-top
        },
    ],
})

const hchPoster = ref(null)

const colorArr = ref(ColorArr)
let startTime = null
let startType = null
let leap = false
let endTime = null
const time1 = ref(dayjs().format('YYYY-MM-DD'))
const time2 = ref(dayjs().format('HH:mm:ss'))
const time3 = ref(dayjs().format('d'))
const week = computed(() => {
    let result = ''
    switch (+time3.value) {
        case 0:
            result = '日'
            break
        case 1:
            result = '一'
            break
        case 2:
            result = '二'
            break
        case 3:
            result = '三'
            break
        case 4:
            result = '四'
            break
        case 5:
            result = '五'
            break
        case 6:
            result = '六'
            break
    }
    return result
})
const ageOnly = ref()
const ageAll = ref('')
const months = ref('0')
const days = ref('0')
const hours = ref('0')

const birthDay = ref('0')
const specialDay = ref([])

let interer = null

const swiperList = computed(() => {
    const a = [
        {
            value: ageOnly.value + '岁',
            label: '',
            unit: ageAll.value,
        },
    ]
    const c = [
        {
            value: months.value,
            label: '度过了',
            unit: '月',
        },
        {
            value: days.value,
            label: '经历了',
            unit: '天',
        },
        {
            value: hours.value,
            label: '相当于',
            unit: '小时',
        },
        {
            value: dayjs(endTime).format('YYYY-MM-DD'),
            label: '计划离开日期',
            unit: '剩余天数 ' + dayjs(endTime).diff(dayjs(), 'day'),
        },
        {
            value: dayjs(endTime).diff(dayjs(startTime), 'year') + '岁',
            label: '计划离开年龄',
            unit: '',
        },
    ]
    const b = []
    const result = setTime(startTime, startType, leap)
    if (!startType) {
        const { astro, Animal } = result
        const obj = {
            label: Animal,
            value: dayjs(startTime).format('YYYY-MM-DD'),
            unit: astro,
        }
        b.push(obj)
    } else {
        const { lYear, IMonthCn, IDayCn, cYear, cMonth, cDay, astro, Animal } = result
        const obj = {
            label: `${Animal} ${IMonthCn}${IDayCn}`,
            value: `${cYear}-${cMonth}-${cDay}`,
            unit: astro,
        }
        b.push(obj)
    }

    let obj
    if (birthDay.value) {
        obj = {
            value: birthDay.value,
            label: '距生日还有',
            unit: '天',
        }
    } else {
        obj = {
            value: 'Happy Birthday!',
            label: '生日快乐!',
            unit: Math.floor(ageOnly.value) + '岁 ',
        }
    }
    return [...a, ...b, obj, ...c]
})

const userInfo = computed(() => {
    return store.userInfo
})

const db = uniCloud.database()

onShow(() => {
    init()
})

function toSpecialDay(id) {
    uni.navigateTo({
        url: '/pages/special-days/detail?id=' + id,
    })
}

async function genPost(obj) {
    if (!userInfo.value?.avatarUpdated) {
        return uni.showModal({
            title: '提示',
            content: '是否设置新头像用于分享',
            confirmText: '立即设置',
            success: function (res) {
                if (res.confirm) {
                    uni.navigateTo({
                        url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo',
                    })
                } else if (res.cancel) {
                    openPost(obj)
                }
            },
        })
    }
    openPost(obj)
}

async function openPost(obj) {
    const { value, label, unit } = obj
    const arr = []
    if (label) {
        arr.push(label + '')
    }
    if (value) {
        arr.push(value + '')
    }
    if (unit) {
        arr.push(unit + '')
    }
    posterData.value.title.text = arr
    const i = Math.floor(Math.random() * ColorArr.length)
    posterData.value.poster.url = ColorArr[i]
    posterData.value.mainImg.url = userInfo.value.avatar_file.url
    nextTick(() => {
        hchPoster.value.posterShow()
    })
}

async function init() {
    console.log(uni.getStorageSync('startEndData'))
    const data = JSON.parse(uni.getStorageSync('startEndData'))
    console.log(data)
    startTime = data.start_time
    startType = data.startType
    endTime = data.end_time
    leap = data.leap
    startInterval()
    getSpecialDays()
}

function startInterval() {
    const ageDetails = getAge(startTime, startType, leap)
    const { cYear, cMonth, cDay, remainDay, oneBirthTotalDay, aYear, aMonth } = ageDetails
    console.log(ageDetails)
    let solarTime = `${cYear}-${cMonth}-${cDay}`
    months.value = dayjs().diff(solarTime, 'month')
    days.value = dayjs().diff(solarTime, 'day')
    hours.value = dayjs().diff(solarTime, 'hour')
    birthDay.value = remainDay
    ageAll.value = `${aYear}岁${aMonth}个月`

    // 将打开app时记录的日期，在setInterval外获取，解决用户在晚上12点前打开，一直停留到该页面过12点，导致currentDayFloat计算错误
    const openAppDay = dayjs().format('YYYY-MM-DD 00:00:00') //

    let currentDayFloat = dayjs().diff(openAppDay, 'day', true)
    //生日当天remainDay为0,做无需ayear+1
    if (remainDay === 0) {
        ageOnly.value = (aYear + currentDayFloat / oneBirthTotalDay).toFixed(7)
    } else {
        ageOnly.value = (aYear + 1 - (remainDay - currentDayFloat) / oneBirthTotalDay).toFixed(7)
    }

    if (interer) {
        clearInterval(interer)
        interer = null
    }
    interer = setInterval(() => {
        //生日当天remainDay为0,则无需ayear+1
        currentDayFloat = dayjs().diff(openAppDay, 'day', true)
        if (remainDay === 0) {
            ageOnly.value = (aYear + currentDayFloat / oneBirthTotalDay).toFixed(7)
        } else {
            ageOnly.value = (aYear + 1 - (remainDay - currentDayFloat) / oneBirthTotalDay).toFixed(7)
        }

        time2.value = dayjs().format('HH:mm:ss')
        //晚上00:00:00时刻，更新所有时刻
        if (time2.value.indexOf('00:00:00') > -1) {
            time1.value = dayjs().format('YYYY-MM-DD')
            time3.value = dayjs().format('d')
            clearInterval(interer)
            interer = null
            startInterval()
            getSpecialDays()
        }
    }, 1000)
}

async function getSpecialDays() {
    const $ = db.command.aggregate
    const {
        result: { errCode, data },
    } = await db
        .collection('special-days')
        .aggregate()
        .match({
            user_id: db.getCloudEnv('$cloudEnv_uid'),
        })
        .end()

    if (errCode == 0) {
        data.forEach((item) => {
            const { time, lunar, leap, type } = item

            if (type === SpecialDayType['提醒日']) {
                item.normalTime = dayjs(time).format('YYYY-MM-DD')
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
            //解决提醒日remain为负，即提醒日已经过去后，排序在前面的问题
            if (item.remainDay >= 0) {
                item.order = 0
            } else {
                item.order = 1
            }
        })
        specialDay.value = orderBy(data, ['order', 'remainDay'])
    }
}
</script>
<style lang="scss">
.home {
    background: $primary-bg;
    color: #ffffff;
    font-size: 36rpx;
}

@keyframes logo-rotate {
    from {
        transform: rotate(0);
    }
    to {
        transform: rotate(360deg);
    }
}

.rotate {
    animation: logo-rotate 3s linear infinite;
}

.scroll-view {
    white-space: nowrap;
    overflow: hidden;

    .scroll-view-item {
        width: 670rpx;
        margin: 0 40rpx 30rpx;
        height: 202rpx;
        mix-blend-mode: normal;
        border-radius: 20rpx;
        background: #ffffff99;
        box-shadow: 0rpx 5rpx 10rpx #6f8fea0f, 0rpx 5rpx 10rpx #6f8fea0f;
    }
}
</style>
