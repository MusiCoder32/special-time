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

        <s-swiper v-if="ageAll" @share="genPost" class="w100" :color-arr="colorArr" :swiper-list="swiperList" />

        <scroll-view :scroll-y="true" class="scroll-view f-grow h0 mt20 pb20" :scroll-with-animation="true">
            <view
                @click.stop="toSpecialDay(item._id)"
                v-for="(item, index) in specialDay"
                :key="item._id"
                class="scroll-view-item h-start-center f12 mr20 p-r"
            >
                <view class="f-grow p-r w0 h100 v-start-start p25">
                    <list-item class="w100" :model-value="item" />
                </view>
            </view>
            <uni-load-more
                @clickLoadMore="clickLoadMore"
                :contentText="{
                    contentdown: '点击查看更多',
                }"
                :status="loading ? 'loading' : hasMore ? 'more' : 'noMore'"
            ></uni-load-more>
        </scroll-view>

        <view v-if="showHomeTipShare" :style="'top:' + navStatusHeight + 'px'" class="self-mask showHomeTipShare">
            <uni-transition class="p-a mask-position" mode-class="slide-right" :duration="500" :show="showHomeTipShare">
                <image src="/static/circle.svg" class="circle" mode="widthFix" />
                <image src="/static/arrow.svg" class="arrow" mode="widthFix" />
                <view class="alert">点击可进入分享页面</view>
            </uni-transition>
            <image @click="closeShareTip.func" src="/static/next.svg" class="know" mode="widthFix" />
        </view>

        <view v-if="showHomeTipSlider" :style="'top:' + navStatusHeight + 'px'" class="self-mask showHomeTipSlider">
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
    </view>
</template>

<script setup>
import SSwiper from '@/components/blackmonth-swiper'
import dayjs from 'dayjs'

import { totalDay, setTime, getAge } from '../../utils/getAge'
import ColorArr from './color-arr'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'

import { orderBy, isNil } from 'lodash'
import { SpecialDayType, StartScene } from '@/utils/emnu' //不支持onLoad
import { isLogin, saveSceneId, shareMessageCall, shareTimelineCall, tipFactory, toLogin } from '@/utils/common'
import ListItem from '@/pages/special-days/list-item'

onShareAppMessage(shareMessageCall)
onShareTimeline(shareTimelineCall)

const navStatusHeight = ref(uni.$navStatusHeight)
// 海报模板数据

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

const loading = ref()
const hasMore = ref()

const birthDay = ref('0')
const specialDay = ref([])

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

const db = uniCloud.database()

const showHomeTipShare = ref(false)
const showHomeTipSlider = ref(false)

onShow(async () => {
    init()
    if (uni.$startScene !== StartScene['朋友圈']) {
        await guidModal()
        if (isLogin()) {
            await beforeGuideModal()
        } else {
            const sceneRes = await uni.getStorageSync('sceneDetails')
            if (sceneRes) {
                try {
                    const sceneDetails = JSON.parse(sceneRes) //防止json解析失败
                    saveSceneId(sceneDetails)
                } catch (e) {
                    console.log(e)
                }
                const modalRes = await uni.showModal({
                    title: '提示',
                    content: '检测到他人分享的日期，完善信息后可立即查看',
                    confirmText: '立即前往',
                })
                if (modalRes.confirm) {
                    uni.redirectTo({
                        url: '/pages/home/guide',
                    })
                } else {
                    uni.removeStorage({
                        key: 'sceneDetails',
                    })
                }
            }
        }
    } else {
        await openKnowTip()
    }
})

async function guidModal() {
    await openShareTip()
    await openKnowTip()
    if (!isLogin()) {
        if (!uni.getStorageSync('setTip')) {
            uni.setStorage({
                key: 'setTip',
                data: 1,
            })
            const setRes = await uni.showModal({
                title: '提示',
                content: '当前为体验数据，但不影响工具箱等相关功能使用。是否前往引导页完成设置，体验完整功能。',
                confirmText: '立即设置',
                cancelText: '稍后再说',
            })
            if (setRes.confirm) {
                uni.redirectTo({
                    url: '/pages/home/guide',
                })
            } else {
                await openToolTip() //不再弹出提示，防止审核不通过
            }
        }
    } else {
        await openToolTip() //不再弹出提示，防止审核不通过
    }
}

async function openToolTip() {
    if (!uni.getStorageSync('toolTip')) {
        uni.setStorage({
            key: 'toolTip',
            data: 1,
        })
        const modalRes = await uni.showModal({
            title: '提示',
            content: '已集成ai聊天功能，快去体验吧',
            confirmText: '立即前往',
            cancelText: '稍后再说',
        })
        if (modalRes.confirm) {
            uni.navigateTo({
                url: '/pages/tool/uni-ai/chat',
            })
        }
    }
}

/**
 * 使用工厂函数tipFactory创建打开引导页方法，实现异步控制；
 */
const closeShareTip = ref({ func: () => {} })
const openShareTip = tipFactory('showHomeTipShare', showHomeTipShare, closeShareTip)

const closeKnowTip = ref({ func: () => {} })
const openKnowTip = tipFactory('showHomeTipSlider', showHomeTipSlider, closeKnowTip)

//引导提示后的各类提示
async function beforeGuideModal() {
    /**
     * 若上一个提示引导至了其他页面，则返回Promise.reject(),将中断当前函数执行，后继提示不会弹出，
     * 若没有，则完成后执行下一个提示；
     */

    //分享按钮提示
    const sceneRes = await uni.getStorageSync('sceneDetails')
    if (sceneRes) {
        uni.removeStorage({
            key: 'sceneDetails',
        })
        const sceneDetails = JSON.parse(sceneRes)
        saveSceneId(sceneDetails)
        //如果具有type属性，则说明通过扫描日期海报分享，弹出导入日期提示窗,否则来自于朋友圈
        if (!isNil(sceneDetails.type)) {
            await showAddSpecialDayModal(sceneDetails)
        }
    }
    //纪念日、生日、提醒日到期提醒
    const importRes = await uni.getStorageSync('importantId')
    if (importRes) {
        uni.removeStorage({
            key: 'importantId',
        })
        await showImportantDayModal(importRes)
    }
}

async function showImportantDayModal(id) {
    try {
        const modalRes = await uni.showModal({
            title: '提示',
            content: `明天是个重要的日子哦`,
            confirmText: '立即查看',
        })
        if (modalRes.confirm) {
            uni.navigateTo({
                url: '/pages/special-days/detail?id=' + id,
            })
            Promise.reject()
        }
    } catch (e) {}
}
async function showAddSpecialDayModal(sceneDetails) {
    try {
        const { nickname, name, type, time, leap, lunar, _id: shareDayId } = sceneDetails
        const modalRes = await uni.showModal({
            content: `${nickname}给你分享了“${name === nickname ? '他/她的' : name}${SpecialDayType[type]}”，是否创建`,
        })
        if (modalRes.confirm) {
            uni.navigateTo({
                url:
                    '/pages/special-days/add?shareDay=' +
                    JSON.stringify({
                        name,
                        type,
                        time,
                        leap,
                        lunar,
                        shareDayId,
                    }),
            })
            return Promise.reject()
        }
    } catch (e) {}
}

function clickLoadMore() {
    uni.switchTab({
        url: '/pages/special-days/list',
    })
}

function toSpecialDay(id) {
    if (!isLogin()) {
        return toLogin()
    }

    uni.navigateTo({
        url: '/pages/special-days/detail?id=' + id,
    })
}

async function genPost(obj, index) {
    if (!isLogin()) {
        return toLogin()
    }
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
    let startData = {}
    if (isLogin()) {
        startData = await getStartData()
    } else {
        startData = {
            start_time: dayjs().subtract(18, 'year').valueOf(),
            startType: 0,
            leap: true,
            end_time: dayjs().add(100, 'year').valueOf(),
            show_end_time: true,
        }
    }
    startTime = startData.start_time
    startType = startData.startType
    endTime = startData.end_time
    leap = startData.leap
    showEndTime.value = startData.show_end_time
    startInterval()
    getSpecialDays()
}

async function getStartData() {
    let detail
    try {
        const startData = JSON.parse(uni.getStorageSync('startData'))
        const endData = JSON.parse(uni.getStorageSync('endData'))
        detail = { ...startData, ...endData }
    } catch (e) {
        try {
            const db = uniCloud.database()
            const {
                result: { errCode, data },
            } = await db
                .collection('start-end-time')
                .where({
                    user_id: db.getCloudEnv('$cloudEnv_uid'),
                })
                .get()
            detail = data[0]
        } catch (e) {
            console.log(e)
        }
    }
    return detail
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
    let data = []
    if (isLogin()) {
        data = await getSpecialDaysApi()
    } else {
        try {
            const res = await uniCloud.callFunction({
                name: 'special-day-default',
            })
            data = res.result
        } catch (e) {
            console.log(e)
        }
    }
    if (data.length > 3) {
        hasMore.value = true
        data = data.slice(0, 3)
    } else {
        hasMore.value = false
    }
    specialDay.value = data
}
async function getSpecialDaysApi() {
    loading.value = true
    let detail = []
    try {
        let {
            result: { errCode, data },
        } = await db
            .collection('special-days')
            .aggregate()
            .match({
                user_id: db.getCloudEnv('$cloudEnv_uid'),
            })
            .end()

        if (errCode == 0) {
            detail = data
        }
    } catch (e) {
        console.log(e)
    }
    loading.value = false
    return detail
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
