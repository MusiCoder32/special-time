<template>
    <view v-if="day" class="vh100 vw100 home v-start-center">
        <view :style="'height:' + navStatusHeight + 'px'" class="w100"></view>
        <view class="h-center mb20 mt10">{{ time }}</view>
        <s-swiper @share="genPost" class="w100" :color-arr="colorArr" :swiper-list="swiperList" />

        <scroll-view :scroll-x="true" class="scroll-view mt20" :scroll-with-animation="true" @scroll="scroll">
            <view
                v-for="(item, index) in specialDay"
                :key="item._id"
                class="scroll-view-item f12 mr20"
                :class="index === 0 ? 'ml20' : ''"
                :style="'background:' + colorArr[(index + 3) % colorArr.length]"
            >
                <view class="w100 h100 v-between-start">
                    <view class="f16 ellipsis mb10">{{ item.name }}{{ item.type === 1 ? '生日' : '' }}</view>
                    <view class="">{{ item.normalTime }}</view>
                    <view v-if="item.type === 0" class="h-start-center">
                        <view>已经</view>
                        <view class="f14 ml2 mr2">{{ totalDay(item.time) }}</view>
                        <view>天</view>
                    </view>
                    <view v-if="item.type === 1" class="h-start-center">
                        <view>已经</view>
                        <view class="f14 ml2 mr2">{{ totalYear(item.time) }}</view>
                        <view>岁</view>
                    </view>
                    <view class="h-start-center">
                        <view class="">距离下次{{ item.type ? '生日' : '纪念日' }}还有</view>
                        <view class="f14 ml2 mr2">{{ item.remainDay }}</view>
                        <view> 天</view>
                    </view>
                </view>
            </view>
        </scroll-view>
    </view>

    <view v-else class="v-center vh100 home">
        <image class="rotate" style="width: 150rpx; height: 150rpx" src="/static/logo.png"></image>
        <view class="mt20">加载中...</view>
    </view>
    <hch-poster ref="hchPoster" :posterData="posterData" />
</template>

<script setup>
import HchPoster from '/components/hch-poster/hch-poster.vue'
import SSwiper from '/components/blackmonth-swiper'
import dayjs from 'dayjs'
import { computed, onMounted, ref, nextTick } from 'vue'
import { arriveDay, getAgeAll, getGrowTime, totalDay, totalYear, setTime } from '../../utils/getAge'
import ColorArr from './color-arr'
import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js'
import { onShow, onReady, onReachBottom, onShareAppMessage } from '@dcloudio/uni-app'
import { orderBy } from 'lodash' //不支持onLoad

const prop = defineProps({
    data: {
        type: String,
    },
})

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
        url: '//static/mini-code.jpg', //图片地址
        w: 100, //宽度
        h: 100, //高度
        mt: 20, //margin-top
        r: 50, //圆角半径
    },
    title: {
        //商品标题
        text: '', //文本
        fontSize: 16, //字体大小
        color: '#fff', //颜色
        lineHeight: 25, //行高
        mt: 30, //margin-top
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
const time = ref('')
const ageOnly = ref('0')
const ageAll = ref('')
const day = ref('')
const months = ref('0')
const days = ref('0')
const hours = ref('0')
const minutes = ref('0')
const seconds = ref('0')
const birthDay = ref('0')
const specialDay = ref([])
const navStatusHeight = ref(0)

const swiperList = computed(() => {
    return [
        {
            value: ageOnly.value,
            label: '',
            unit: '岁',
        },
        {
            value: ageAll.value,
            label: '',
            unit: '',
        },
        {
            value: birthDay.value,
            label: '距生日还有',
            unit: '天',
        },
        {
            value: day.value,
            label: '已经过了',
            unit: '',
        },
        {
            value: months.value,
            label: '相当于',
            unit: '月',
        },
        {
            value: days.value,
            label: '相当于',
            unit: '天',
        },
        {
            value: hours.value,
            label: '相当于',
            unit: '小时',
        },
        {
            value: minutes.value,
            label: '相当于',
            unit: '分',
        },
        {
            value: seconds.value,
            label: '相当于',
            unit: '秒',
        },
    ]
})

const userInfo = computed(() => {
    return store.userInfo
})

const db = uniCloud.database()

onMounted(() => {
    navStatusHeight.value = uni.$navStatusHeight
})
onShow(() => {
    init()
})
async function genPost(obj) {
    const { value, label, unit } = obj
    posterData.value.title.text = label + value + unit
    const i = Math.floor(Math.random() * ColorArr.length)
    posterData.value.poster.url = ColorArr[i]
    posterData.value.mainImg.url = userInfo.value.avatar_file.url
    nextTick(() => {
        hchPoster.value.posterShow()
    })
}

async function init() {
    await getStartEndTime()
    await getSepcialDays()
}

async function getStartEndTime() {
    const {
        result: { errCode, data },
    } = await db
        .collection('start-end-time')
        .where({
            user_id: db.getCloudEnv('$cloudEnv_uid'),
        })
        .get()

    if (errCode == 0) {
        if (data.length === 0) {
            uni.redirectTo({
                url: '/pages/home/guide',
            })
        } else {
            startTime = data[0].start_time
            startInterval()
        }
    } else {
        uni.showToast({
            icon: 'none',
            title: errCode,
        })
    }
}
async function getSepcialDays() {
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
            const { time, lunar } = item
            console.log(item)
            if (!lunar) {
                item.remainDay = arriveDay(time)
                item.normalTime = dayjs(time).format('YYYY-MM-DD')
            } else {
                const result = setTime(time, lunar)
                const { lYear, IMonthCn, IDayCn, cYear, cMonth, cDay } = result
                item.normalTime = `${lYear} ${IMonthCn} ${IDayCn}`
                item.remainDay = arriveDay(dayjs(`${cYear}-${cMonth}-${cDay}`))
            }
        })
        specialDay.value = orderBy(data, ['remainDay'])
    }
}

function startInterval() {
    setInterval(() => {
        day.value = getGrowTime(startTime)
        ageAll.value = getAgeAll(startTime)
        ageOnly.value = dayjs().diff(startTime, 'year', true).toFixed(7)
        months.value = dayjs().diff(startTime, 'month')
        days.value = dayjs().diff(startTime, 'day')
        hours.value = dayjs().diff(startTime, 'hour')
        minutes.value = dayjs().diff(startTime, 'minute')
        seconds.value = dayjs().diff(startTime, 'second')
        birthDay.value = arriveDay(startTime)
        time.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
    }, 1000)
}
function scroll(e) {
    console.log(e.detail)
    console.log(e.details)
}
</script>
<style lang="scss">
.home {
    background: #b7d5d7;
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
    width: 375px;
    white-space: nowrap;
    .scroll-view-item {
        width: 320rpx;
        height: 200rpx;
        display: inline-block;
        border-radius: 20rpx;
        padding: 10px;
    }
}
</style>
