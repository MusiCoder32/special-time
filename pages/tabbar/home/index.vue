<template>
    <view v-if="day" class="vh100 home pt60">
        <view class="h-center mb20">{{ time }}</view>
        <s-swiper class="" :color-arr="colorArr" :swiper-list="swiperList" />

        <scroll-view :scroll-x="true" class="scroll-view mt20" :scroll-with-animation="true" @scroll="scroll">
            <view
                v-for="(item, index) in specialDay"
                :key="item._id"
                class="scroll-view-item f12 mr20"
                :class="index === 0 ? 'ml20' : ''"
                :style="'background:' + colorArr[(index + 3) % colorArr.length]"
            >
                <view class="w100 h100 v-between-start">
                    <view class="f16 ellipsis mb10">{{ item.name }}</view>
                    <view class="">{{ item.time }}</view>
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
                        <view class="f14 ml2 mr2">{{ arriveDay(item.time) }}</view>
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
</template>

<script setup>
import SSwiper from '/components/blackmonth-swiper'
import dayjs from 'dayjs'
import { onBeforeMount, onMounted, reactive, ref, computed } from 'vue'
import UniIdPagesBindMobile from '../../../uni_modules/uni-id-pages/components/uni-id-pages-bind-mobile/uni-id-pages-bind-mobile'
import { getAgeAll, getGrowTime, totalDay, totalYear, arriveDay } from '../../../utils/getAge'
import ColorArr from './color-arr'

const prop = defineProps({
    data: {
        type: String,
    },
})
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
            label: '度过了',
            unit: '天',
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

init()

async function init() {
    await getStartEndTime()
    await getSepcialDays()
}

async function getStartEndTime() {
    const db = uniCloud.database()

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
                url: '/pages/tabbar/home/guide',
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
    const db = uniCloud.database()

    const {
        result: { errCode, data },
    } = await db
        .collection('special-days')
        .where({
            user_id: db.getCloudEnv('$cloudEnv_uid'),
        })
        .get()

    if (errCode == 0) {
        specialDay.value = data
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
