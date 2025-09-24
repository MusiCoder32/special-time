<template>
    <view class="vw100 home">
        <view :style="'height:' + navStatusHeight + 'rpx'" class="w100"></view>
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

        <s-swiper v-if="ageAll" @share="genPost" class="w100" :color-arr="colorArr" :swiper-list="swiperList" />

        <list />

        <view v-if="showHomeTipShare" :style="'top:' + navStatusHeight + 'rpx'" class="self-mask showHomeTipShare">
            <uni-transition class="p-a mask-position" mode-class="slide-right" :duration="500" :show="showHomeTipShare">
                <image src="/static/circle.svg" class="circle" mode="widthFix" />
                <image src="/static/arrow.svg" class="arrow" mode="widthFix" />
                <view class="alert">点击可进入分享页面</view>
            </uni-transition>
            <image @click="closeShareTip.func" src="/static/next.svg" class="know" mode="widthFix" />
        </view>

        <view v-if="showHomeTipSlider" :style="'top:' + navStatusHeight + 'rpx'" class="self-mask showHomeTipSlider">
            <uni-transition
                class="p-a mask-position"
                mode-class="slide-right"
                :duration="500"
                :show="showHomeTipSlider"
            >
                <view class="alert">点击或滑动可切换卡片</view>
            </uni-transition>
            <image @click="closeKnowTip.func" src="/static/know.svg" class="know" mode="widthFix" />
        </view>
        <ad-interstitial
            ref="adInterstitial"
            adpid="1859613948"
            :loadnext="true"
            v-slot:default="{ loading, error }"
            @load="onadload"
            @close="onadclose"
            @error="onaderror"
        >
            <view v-if="error">{{ error }}</view>
        </ad-interstitial>
    </view>
</template>

<script setup>
import SSwiper from '@/components/blackmonth-swiper'
import dayjs from 'dayjs'
import { setTime, getAge } from '@/utils/getAge'
import ColorArr from './color-arr'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'

import { SpecialDayType, StartScene } from '@/utils/emnu' //不支持onLoad
import { shareMessageCall, shareTimelineCall, tipFactory } from '@/utils/common'
import List from './list'

const navStatusHeight = ref(uni.$navStatusHeight)
const ageDigit = 8
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

let interer = null
const showEndTime = ref(false)

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
    ]
    if (showEndTime.value) {
        c.push(
            ...[
                {
                    value: dayjs(endTime).diff(dayjs(startTime), 'year') + '岁',
                    label: '计划离开年龄',
                    unit: '',
                },
                {
                    value: dayjs(endTime).format('YYYY-MM-DD'),
                    label: '计划离开日期',
                    unit: '剩余天数 ' + dayjs(endTime).diff(dayjs(), 'day'),
                },
            ],
        )
    }
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
        return [...a, obj, ...b, ...c]
    } else {
        obj = {
            value: 'Happy Birthday!',
            label: '生日快乐!',
            unit: Math.floor(ageOnly.value) + '岁 ',
        }
        return [obj, ...a, ...b, ...c]
    }
})

const userInfo = computed(() => {
    return store.userInfo
})

const showHomeTipShare = ref(false)
const showHomeTipSlider = ref(false)

onShow(async () => {
    init()
    if (uni.$startScene !== StartScene['朋友圈']) {
        await beforeGuideModal()
        await guidModal()
    } else {
        await openKnowTip()
    }
})
onShareAppMessage(shareMessageCall)
onShareTimeline(shareTimelineCall)
onReachBottom(() => {})

onPageScroll(() => {})

//引导提示后的各类提示
async function beforeGuideModal() {
    /**
     * 若上一个提示引导至了其他页面，则返回Promise.reject(),将中断当前函数执行，后继提示不会弹出，
     * 若没有，则完成后执行下一个提示；
     */
    //纪念日、生日、提醒日到期提醒
    const importRes = await uni.getStorageSync('importantId')
    if (importRes) {
        uni.removeStorage({
            key: 'importantId',
        })
        await showImportantDayModal(importRes)
    }
}
async function guidModal() {
    await openShareTip()
    await openKnowTip()
    const setStartTipRes = await openSetStartTip()
    // if (!setStartTipRes) {
    //     await openToolTip() //不再弹出提示，防止审核不通过
    // }
}

async function openSetStartTip() {
    if (uni.getStorageSync('setStartTip') == 2) {
        uni.setStorage({
            key: 'setStartTip',
            data: 1,
        })
        const modalRes = await uni.showModal({
            title: '提示',
            content: '当前生辰时间为默认时间，是否前往修改？',
            confirmText: '立即前往',
            cancelText: '稍后再说',
        })
        if (modalRes.confirm) {
            uni.navigateTo({
                url: '/pages/start-end-time/detail',
            })
            return true
        }
    }
    return false
}

/**
 * 使用工厂函数tipFactory创建打开引导页方法，实现异步控制；
 */
const closeShareTip = ref({ func: () => {} })
const openShareTip = tipFactory('showHomeTipShare', showHomeTipShare, closeShareTip)

const closeKnowTip = ref({ func: () => {} })
const openKnowTip = tipFactory('showHomeTipSlider', showHomeTipSlider, closeKnowTip)

async function showImportantDayModal(id) {
    try {
        const modalRes = await uni.showModal({
            title: '提示',
            content: `明天是个重要的日子哦`,
            confirmText: '立即查看',
        })
        if (modalRes.confirm) {
            uni.navigateTo({
                url: '/pages/special-days/detail?specialDayId=' + id,
            })
            Promise.reject()
        }
    } catch (e) {}
}

async function genPost(obj, index) {
    if (index === 1) {
        obj.value = obj.value.slice(5)
    }
    uni.setStorageSync(
        'shareDetails',
        JSON.stringify({
            time: startTime,
            lunar: startType,
            leap,
            type: SpecialDayType['生日'],
            name: userInfo.value.nickname || 'momo',
            _id: userInfo.value._id, //分享用户自身生日时，使用用户id作为分享详情_id
        }),
    )
    uni.navigateTo({
        url: '/pages/home/poster-setting?data=' + JSON.stringify(obj),
    })
}

async function init() {
    const startData = uni.getStorageSync('startData')
    const endData = uni.getStorageSync('endData')
    startTime = startData.start_time
    startType = startData.startType
    leap = startData.leap
    endTime = endData.end_time
    showEndTime.value = endData.show_end_time
    startInterval()
}



function startInterval() {
    const ageDetails = getAge(startTime, startType, leap)
    const { cYear, cMonth, cDay, remainDay, oneBirthTotalDay, aYear, aMonth } = ageDetails
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
        ageOnly.value = (aYear + currentDayFloat / oneBirthTotalDay).toFixed(ageDigit)
    } else {
        ageOnly.value = (aYear + 1 - (remainDay - currentDayFloat) / oneBirthTotalDay).toFixed(ageDigit)
    }

    if (interer) {
        clearInterval(interer)
        interer = null
    }
    interer = setInterval(() => {
        //生日当天remainDay为0,则无需ayear+1
        currentDayFloat = dayjs().diff(openAppDay, 'day', true)
        if (remainDay === 0) {
            ageOnly.value = (aYear + currentDayFloat / oneBirthTotalDay).toFixed(ageDigit)
        } else {
            ageOnly.value = (aYear + 1 - (remainDay - currentDayFloat) / oneBirthTotalDay).toFixed(ageDigit)
        }

        time2.value = dayjs().format('HH:mm:ss')
        //晚上00:00:00时刻，更新所有时刻
        if (time2.value.indexOf('00:00:00') > -1) {
            time1.value = dayjs().format('YYYY-MM-DD')
            time3.value = dayjs().format('d')
            clearInterval(interer)
            interer = null
            startInterval()
        }
    }, 1000)
}
</script>
<style lang="scss">
page {
    background: $primary-bg !important;
    height: 100vh;
}
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

.showHomeTipShare {
    .mask-position {
        left: 300rpx;
        top: 250rpx;
        width: 300rpx;
        height: 600rpx;
    }

    .circle {
        width: 200rpx;
        position: absolute;
        left: 200rpx;
        top: 0;
    }

    .arrow {
        width: 80rpx;
        position: absolute;
        left: 200rpx;
        top: 110rpx;
        transform: rotateY(180deg);
    }

    .alert {
        color: white;
        width: 200rpx;
        position: absolute;
        left: 100rpx;
        top: 250rpx;
    }
}

.showHomeTipSlider {
    .mask-position {
        left: 300rpx;
        top: 350rpx;
        width: 300rpx;
        height: 600rpx;
    }

    .alert {
        color: white;
        width: 200rpx;
        position: absolute;
        left: 0rpx;
        top: 250rpx;
    }
}

.know {
    width: 200rpx;
    position: fixed;
    left: 275rpx;
    bottom: 200rpx;
}
</style>
