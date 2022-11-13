<template>
    <view v-if="day" class="h100 home pt60">
        <view class="h-center mb20">{{ time }}</view>
        <s-swiper class="mt100" :color-arr="colorArr" :swiper-list="swiperList" />

        <scroll-view :scroll-x="true" class="scroll-view mt20" :scroll-with-animation="true" @scroll="scroll">
            <view
                v-for="(i, index) in 10"
                :key="i"
                class="scroll-view-item"
                :style="'background:' + colorArr[index % colorArr.length]"
                >A</view
            >
        </scroll-view>
    </view>

    <view v-else class="v-center h100 home">
        <image class="rotate" style="width: 150rpx; height: 150rpx" src="/static/logo.png"></image>
    </view>
</template>

<script setup>
import SSwiper from '/components/blackmonth-swiper'
import dayjs from 'dayjs'
import { onBeforeMount, onMounted, reactive, ref, computed } from 'vue'
import UniIdPagesBindMobile from '../../../uni_modules/uni-id-pages/components/uni-id-pages-bind-mobile/uni-id-pages-bind-mobile'
import { getAgeAll, getAgeOnly, getGrowAge, getGrowTime } from '../../../utils/getAge'
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
            value: ageOnly.value,
            label: '你今年',
            unit: '岁',
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
        birthDay.value = dayjs(startTime).add(1, 'year').diff(dayjs(), 'day')
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
    width: 100%;
    padding: 0 20px;
    height: 200rpx;
    white-space: nowrap;
    .scroll-view-item {
        width: 200rpx;
        height: 200rpx;
        margin-right: 15px;
        display: inline-block;
        border-radius: 20rpx;
    }
}
</style>
